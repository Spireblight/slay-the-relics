import { Component, CSSProperties } from "react";
import "./App.css";
import { RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";
import { DeckView } from "../Deck/Deck";
import PotionBar from "../Potion/Potion";
import SpireMap from "../SpireMap/SpireMap";
import { decode } from "base85";
import { inflate } from "pako";

interface MapNode {
  type: string;
  parents: number[];
}

class NumHitBox {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number | string;

  constructor(x: number, y: number, w: number, h: number, z: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.z = z;
  }

  convertToHb(): HitBox {
    return {
      x: this.x + "%",
      y: this.y + "%",
      w: this.w + "%",
      h: this.h + "%",
      z: this.z,
    };
  }
}

interface AppState extends Record<string, unknown> {
  channel: string;

  character: string;
  boss: string;
  relics: string[];
  baseRelicStats: Record<number, (string | number)[]>;
  deck: string[];
  drawPile: string[];
  discardPile: string[];
  exhaustPile: string[];
  potions: string[];
  additionalTips: { tips: Tip[]; hitbox: NumHitBox }[];
  mapNodes: MapNode[][];
  mapPath: number[][];
}

const API_BASE_URL = "http://localhost:8888";

export default class App extends Component<never, AppState> {
  private readonly twitch: typeof Twitch.ext | null;
  private gameStateIndex: number;

  constructor(props: never) {
    super(props);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.gameStateIndex = 0;
    this.state = {
      relics: [],
      character: "",
      boss: "",
      channel: "",
      additionalTips: [],
      deck: [],
      potions: [],
      mapNodes: [],
      mapPath: [],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
      baseRelicStats: {},
    };
  }

  decomp(s: string): string {
    const decodedBytes = decode(s, "ascii85");
    if (decodedBytes === false) {
      throw new Error("failed to decode b85 string");
    }
    return inflate(decodedBytes, { to: "string" });
  }

  async fetchState() {
    if (this.state.channel === "") {
      console.warn("empty channel id");
      return;
    }
    const resp = await fetch(
      API_BASE_URL + "/api/v2/game-state/" + this.state.channel,
    );
    if (resp.ok) {
      const js = (await resp.json()) as Record<string, unknown>;
      this.gameStateIndex = js["gameStateIndex"] as number;
      this.setState(js as AppState);
      return;
    }
  }

  setStateUpdate(js: AppState) {
    // Only include keys with non-null values
    const filtered = Object.fromEntries(
      Object.entries(js).filter(
        ([_, val]) => val !== null && val !== undefined,
      ),
    );

    this.setState((prev) => {
      return {
        ...prev,
        ...filtered,
      };
    });
  }

  async handleMessage(body: string) {
    let jsString = "";
    try {
      jsString = this.decomp(body);
    } catch (e) {
      console.error("Failed to decompress incoming message", e);
      throw e;
    }

    const js = JSON.parse(jsString) as Record<string, unknown>;

    const index = js["gameStateIndex"] as number;
    if (index === 0 || this.gameStateIndex + 1 === index) {
      this.gameStateIndex = index;
      this.setStateUpdate(js as AppState);
      return;
    }
    if (this.gameStateIndex >= index) {
      // our game state is ahead, do nothing
      return;
    }

    console.warn("index out of sync: ", this.gameStateIndex, " ", index);
    await this.fetchState();
  }

  initialLoad(channel: string) {
    this.setState(
      (prev) => ({ ...prev, channel }),
      () => {
        this.fetchState().catch((err) => {
          console.error(err);
        });
      },
    );
  }

  componentDidMount() {
    this.initialLoad("59817220");

    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        const channel = auth.channelId;
        this.initialLoad(channel);
      });

      this.twitch.listen("broadcast", (_, __, body) => {
        this.handleMessage(body).catch((err) => {
          console.error(err);
        });
      });
    }
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten("broadcast", () =>
        console.log("successfully unlistened"),
      );
    }
  }

  render() {
    const styles: CSSProperties = {
      background: import.meta.env.PROD ? "transparent" : "darkgrey",
      // background: "transparent",
    };
    return (
      <div className={"App"} style={styles}>
        <SpireMap
          boss={this.state.boss}
          nodes={this.state.mapNodes}
          path={this.state.mapPath}
        />
        <RelicBar
          relics={this.state.relics}
          character={this.state.character}
          relicParams={this.state.baseRelicStats}
        />
        <PotionBar
          potions={this.state.potions}
          relics={this.state.relics}
          character={this.state.character}
        />
        <DeckView
          cards={this.state.deck}
          character={this.state.character}
          what={"deck"}
        />
        <DeckView
          cards={this.state.drawPile}
          character={this.state.character}
          what={"draw"}
        />
        <DeckView
          cards={this.state.discardPile}
          character={this.state.character}
          what={"discard"}
        />
        <DeckView
          cards={this.state.exhaustPile}
          character={this.state.character}
          what={"exhaust"}
        />
        <div>
          {this.state.additionalTips.map((t, i) => (
            <PowerTipBlock
              noExpand={true}
              character={this.state.character}
              key={"additional-tips-" + i}
              magGlass={false}
              hitbox={new NumHitBox(
                t.hitbox.x,
                t.hitbox.y,
                t.hitbox.w,
                t.hitbox.h,
                0,
              ).convertToHb()}
              tips={t.tips}
              offset={60}
            />
          ))}
        </div>
      </div>
    );
  }
}
