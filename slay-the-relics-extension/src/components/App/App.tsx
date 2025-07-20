import { Component, CSSProperties } from "react";
import "./App.css";
import { RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";
import { DeckView } from "../Deck/Deck";
import PotionBar from "../Potion/Potion";
import SpireMap from "../SpireMap/SpireMap";
import { decode } from "base85";
import { inflate } from "pako";
import {
  fetchLocalizationData,
  LocalizationContext,
  LocalizationData,
} from "../Localization/Localization";

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

interface RunState extends Record<string, unknown> {
  channel: string;

  character: string;
  boss: string;
  relics: string[];
  baseRelicStats: Record<number, (string | number)[]>;
  relicTips: Tip[];
  deck: string[];
  drawPile: string[];
  discardPile: string[];
  exhaustPile: string[];
  potions: string[];
  additionalTips: { tips: Tip[]; hitbox: NumHitBox }[];
  mapNodes: MapNode[][];
  mapPath: number[][];
}

interface AppState {
  runState: RunState;
  localization: LocalizationData;
}

const API_BASE_URL = import.meta.env.PROD
  ? "https://slay-the-relics.baalorlord.tv"
  : "http://localhost:8888";

export default class App extends Component<never, AppState> {
  private readonly twitch: typeof Twitch.ext | null;
  private gameStateIndex: number;

  constructor(props: never) {
    super(props);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.gameStateIndex = 0;
    this.state = {
      localization: {
        cards: {},
        keywords: {},
        relics: {},
        potions: {},
      },
      runState: {
        relics: [],
        character: "",
        boss: "",
        channel: "",
        additionalTips: [],
        relicTips: [],
        deck: [],
        potions: [],
        mapNodes: [],
        mapPath: [],
        drawPile: [],
        discardPile: [],
        exhaustPile: [],
        baseRelicStats: {},
      },
    };
  }

  decomp(s: string): string {
    const decodedBytes = decode(s, "ascii85");
    if (decodedBytes === false) {
      throw new Error("failed to decode b85 string");
    }
    return inflate(decodedBytes, { to: "string" });
  }

  setRunState(runState: RunState) {
    this.setState((prev) => {
      return {
        ...prev,
        runState: runState,
      };
    });
  }

  async fetchState() {
    if (this.state.runState.channel === "") {
      console.warn("empty channel id");
      return;
    }
    const resp = await fetch(
      API_BASE_URL + "/api/v2/game-state/" + this.state.runState.channel,
    );
    if (resp.ok) {
      const js = (await resp.json()) as Record<string, unknown>;
      this.gameStateIndex = js["gameStateIndex"] as number;
      this.setRunState(js as RunState);
      return;
    }
  }

  setStateUpdate(js: RunState) {
    // Only include keys with non-null values
    const filtered = Object.fromEntries(
      Object.entries(js).filter(
        ([_, val]) => val !== null && val !== undefined,
      ),
    );

    this.setState((prev) => {
      return {
        ...prev,
        runState: {
          ...prev.runState,
          ...filtered,
        },
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

    let js: Record<string, unknown> = {};
    try {
      js = JSON.parse(jsString) as Record<string, unknown>;
    } catch (e) {
      console.error("Failed to parse incoming message", jsString);
      throw e;
    }

    const index = js["gameStateIndex"] as number;
    if (index === 0 || this.gameStateIndex + 1 === index) {
      this.gameStateIndex = index;
      this.setStateUpdate(js as RunState);
      return;
    }
    if (this.gameStateIndex >= index) {
      // our game state is ahead, do nothing
      return;
    }

    console.warn("index out of sync: ", this.gameStateIndex, " ", index);
    await this.fetchState();
  }

  async initialLoad(channel: string) {
    const loc = await fetchLocalizationData();
    this.setState(
      (prev) => ({ ...prev, localization: loc }),
      () => {
        this.setState(
          (prev) => ({
            ...prev,
            runState: { ...prev.runState, channel: channel },
          }),
          () => {
            this.fetchState().catch((err) => {
              console.error(err);
            });
          },
        );
      },
    );
  }

  componentDidMount() {
    if (import.meta.env.DEV) {
      void this.initialLoad("59817220");
    }
    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        const channel = auth.channelId;
        this.initialLoad(channel).catch((err) =>
          console.error("Failed to load initial state", err),
        );
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
      <LocalizationContext value={this.state.localization}>
        <div className={"App"} style={styles}>
          <SpireMap
            boss={this.state.runState.boss}
            nodes={this.state.runState.mapNodes}
            path={this.state.runState.mapPath}
          />
          <RelicBar
            relics={this.state.runState.relics}
            character={this.state.runState.character}
            relicParams={this.state.runState.baseRelicStats}
            relicTips={this.state.runState.relicTips}
          />
          <PotionBar
            potions={this.state.runState.potions}
            relics={this.state.runState.relics}
            character={this.state.runState.character}
          />
          <DeckView
            cards={this.state.runState.deck}
            character={this.state.runState.character}
            what={"deck"}
            enableCardView={true}
          />
          <DeckView
            cards={this.state.runState.drawPile}
            character={this.state.runState.character}
            what={"draw"}
          />
          <DeckView
            cards={this.state.runState.discardPile}
            character={this.state.runState.character}
            what={"discard"}
          />
          <DeckView
            cards={this.state.runState.exhaustPile}
            character={this.state.runState.character}
            what={"exhaust"}
          />
          <div>
            {this.state.runState.additionalTips.map((t, i) => (
              <PowerTipBlock
                noExpand={true}
                character={this.state.runState.character}
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
      </LocalizationContext>
    );
  }
}
