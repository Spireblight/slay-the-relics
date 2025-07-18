import { Component, CSSProperties } from "react";
import "./App.css";
import { RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";
import { DeckView } from "../Deck/Deck";
import PotionBar from "../Potion/Potion";
import SpireMap from "../SpireMap/SpireMap";

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

interface AppState {
  gameStateIndex: number;
  channel: string;

  character: string;
  relics: string[];
  baseRelicStats: Record<number, (string | number)[]>;
  deck: string[];
  potions: string[];
  additionalTips: { tips: Tip[]; hitbox: NumHitBox }[];
  mapNodes: MapNode[][];
  mapPath: number[][];
}

const API_BASE_URL = "http://localhost:8888";

export default class App extends Component<never, AppState> {
  private readonly twitch: typeof Twitch.ext | null;

  constructor(props: never) {
    super(props);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      gameStateIndex: 0,
      relics: [],
      character: "",
      channel: "",
      additionalTips: [],
      deck: [],
      potions: [],
      mapNodes: [],
      mapPath: [],
      baseRelicStats: {},
    };
  }

  async decomp(s: string) {
    // Using Node Buffer for encoder
    const str = Buffer.from(s, "base64");
    const cs = new DecompressionStream("gzip");
    const writer = cs.writable.getWriter();
    await writer.write(str);
    await writer.close();
    return await new Response(cs.readable).arrayBuffer().then(
      // Resolve Function
      (arr) => Buffer.from(arr).toString("utf8"),
      // Reject Function
      async () => {
        throw new Error(await Promise.reject(await writer.closed));
      },
    );
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
      this.setState((await resp.json()) as AppState);
      return;
    }
    console.error("failed to fetch with code: ", resp.status);
  }

  async handleMessage(body: string) {
    const jsString = await this.decomp(body);
    const js = JSON.parse(jsString);

    const index = js["gameStateIndex"];
    if (index === 0 || this.state.gameStateIndex + 1 === index) {
      this.setState((prev) => {
        return {
          gameStateIndex: js["gameStateIndex"],
          channel: js["channel"],
          character:
            js["character"] === null ? prev.character : js["character"],
          relics: js["relics"] === null ? prev.relics : js["relics"],
          baseRelicStats:
            js["baseRelicStats"] === null
              ? prev.baseRelicStats
              : js["baseRelicStats"],
          deck: js["deck"] === null ? prev.deck : js["deck"],
          potions: js["potions"] === null ? prev.potions : js["potions"],
          additionalTips:
            js["additionalTips"] === null
              ? prev.additionalTips
              : js["additionalTips"],
          mapNodes: js["mapNodes"] === null ? prev.mapNodes : js["mapNodes"],
          mapPath: js["mapPath"] === null ? prev.mapPath : js["mapPath"],
        };
      });
      return;
    }
    console.warn("index out of sync: ", this.state.gameStateIndex, " ", index);
    await this.fetchState();
  }

  componentDidMount() {
    this.setState(
      (prev) => ({ ...prev, channel: "59817220" }),
      () => this.fetchState(),
    );

    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        const channel = auth.channelId;
        this.setState((prevState) => ({
          ...prevState,
          channel: channel,
        }));
        this.fetchState().then(
          () => {
            console.log("finished initial fetch");
          },
          (e) => {
            throw new Error("failed initial fetch", e);
          },
        );
      });

      this.twitch.listen("broadcast", (_, __, body) => {
        this.handleMessage(body).then(
          () => {
            console.log("processed message");
          },
          (e) => {
            throw new Error("failed to process message: ", e);
          },
        );
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
      background: this.twitch === null ? "darkgrey" : "transparent",
    };
    return (
      <div className={"App"} style={styles}>
        <SpireMap nodes={this.state.mapNodes} path={this.state.mapPath} />
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
        <DeckView cards={this.state.deck} character={this.state.character} />
        <div>
          {this.state.additionalTips.map((t, i) => (
            <PowerTipBlock
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
              offset={66}
            />
          ))}
        </div>
      </div>
    );
  }
}
