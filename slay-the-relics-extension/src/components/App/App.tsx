import { Component, CSSProperties } from "react";
import "./App.css";
import { RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";
import { CardData, DeckView } from "../Deck/Deck";
import PotionBar from "../Potion/Potion";
import SpireMap from "../SpireMap/SpireMap";
import { decode } from "base85";
import { inflate } from "pako";
import {
  fetchLocalizationData,
  LocalizationContext,
  LocalizationData,
} from "../Localization/Localization";
import { Tooltip } from "react-tooltip";

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
  game?: string;

  character: string;
  boss: string;
  secondBoss?: string;
  ancient?: string;
  relics: string[];
  baseRelicStats: Record<number, (string | number)[]>;
  relicTips: Tip[];
  deck: CardData[];
  drawPile: CardData[];
  discardPile: CardData[];
  exhaustPile: CardData[];
  potions: string[];
  additionalTips: { tips: Tip[]; hitbox: NumHitBox }[];
  staticTips: { tips: Tip[]; hitbox: NumHitBox }[];
  mapNodes: MapNode[][];
  mapPath: number[][];
  bottles: number[];
  potionX: number
  cardTips?: Record<string, Tip[]>;
  potionTips?: Tip[];
  relicTipMap?: Record<string, Tip[]>;
}

interface AppState {
  runState: RunState;
  localization: LocalizationData;
}

const API_BASE_URL = import.meta.env.PROD
  ? "https://slay-the-relics.baalorlord.tv"
  : "";

function getDevChannel(): string {
  const fromQuery = new URLSearchParams(window.location.search)
    .get("channel")
    ?.trim();
  if (fromQuery) {
    return fromQuery;
  }
  const envChannel = import.meta.env.VITE_DEV_CHANNEL as unknown;
  if (typeof envChannel === "string" && envChannel.trim() !== "") {
    return envChannel.trim();
  }
  return "59817220";
}

/* eslint-disable @typescript-eslint/no-empty-object-type */
interface AppProps {}

export default class App extends Component<AppProps, AppState> {
  private readonly twitch: typeof Twitch.ext | null;
  private eventSource: EventSource | null;
  private gameStateIndex: number;

  constructor(props: AppProps) {
    super(props);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.eventSource = null;
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
        secondBoss: "",
        ancient: "",
        channel: "",
        game: "",
        additionalTips: [],
        staticTips: [],
        relicTips: [],
        deck: [],
        potions: [],
        mapNodes: [],
        mapPath: [],
        drawPile: [],
        discardPile: [],
        exhaustPile: [],
        baseRelicStats: {},
        bottles: [-1, -1, -1],
        potionX: 33,
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
      const merged = { ...prev.runState };
      for (const [key, value] of Object.entries(filtered)) {
        const prevValue = merged[key];
        // Merge map fields per-key so partial updates (e.g. one changed relic) don't wipe the rest
        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          prevValue !== null &&
          typeof prevValue === "object" &&
          !Array.isArray(prevValue)
        ) {
          merged[key] = { ...prevValue, ...value };
        } else {
          merged[key] = value;
        }
      }
      return { ...prev, runState: merged as RunState };
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
    if (index === 0) {
      this.gameStateIndex = index;
      // Full state snapshot: clear optional STS2 fields that may be omitted when empty
      this.setStateUpdate({
        secondBoss: "",
        ancient: "",
        ...(js as RunState),
      });
      return;
    }
    if (this.gameStateIndex + 1 === index) {
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

  connectLocalSSE(channel: string) {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    const url = `${API_BASE_URL}/api/dev/events/${encodeURIComponent(channel)}`;
    const es = new EventSource(url);
    let hasOpened = false;

    es.addEventListener("open", () => {
      // On reconnect (e.g. after backend hot reload), resync full state snapshot.
      if (hasOpened) {
        this.fetchState().catch((err) => {
          console.error("Failed to resync state after SSE reconnect", err);
        });
      }
      hasOpened = true;
    });

    es.addEventListener("broadcast", (event) => {
      const msgEvent = event as MessageEvent<string>;
      this.handleMessage(msgEvent.data).catch((err) => {
        console.error("Failed to handle local SSE broadcast", err);
      });
    });

    this.eventSource = es;
  }

  componentDidMount() {
    const pubsubMode = import.meta.env.VITE_PUBSUB_MODE as unknown;
    const useLocalDev =
      import.meta.env.DEV &&
      (pubsubMode === "sse" || !this.twitch || window.self === window.top);

    if (useLocalDev) {
      const channel = getDevChannel();
      void this.initialLoad(channel);
      this.connectLocalSSE(channel);
      return;
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
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  render() {
    const styles: CSSProperties = {
      background: import.meta.env.PROD ? "transparent" : "darkgrey",
      //background: "transparent",
    };
    return (
      <LocalizationContext value={this.state.localization}>
        <div className={"App"} style={styles}>
          <SpireMap
            boss={this.state.runState.boss}
            secondBoss={this.state.runState.secondBoss}
            ancient={this.state.runState.ancient}
            nodes={this.state.runState.mapNodes}
            path={this.state.runState.mapPath}
            game={this.state.runState.game}
          />
          <RelicBar
            relics={this.state.runState.relics}
            character={this.state.runState.character}
            relicParams={this.state.runState.baseRelicStats}
            relicTips={this.state.runState.relicTips}
            relicTipMap={this.state.runState.relicTipMap}
            game={this.state.runState.game}
          />
          <PotionBar
            potions={this.state.runState.potions}
            relics={this.state.runState.relics}
            character={this.state.runState.character}
            potionX={this.state.runState.potionX}
            potionTips={this.state.runState.potionTips}
            game={this.state.runState.game}
          />
          <DeckView
            bottles={this.state.runState.bottles}
            cards={this.state.runState.deck}
            character={this.state.runState.character}
            what={"deck"}
            enableCardView={true}
            cardTips={this.state.runState.cardTips}
            game={this.state.runState.game}
          />
          <DeckView
            cards={this.state.runState.drawPile}
            character={this.state.runState.character}
            what={"draw"}
            cardTips={this.state.runState.cardTips}
            game={this.state.runState.game}
          />
          <DeckView
            cards={this.state.runState.discardPile}
            character={this.state.runState.character}
            what={"discard"}
            cardTips={this.state.runState.cardTips}
            game={this.state.runState.game}
          />
          <DeckView
            cards={this.state.runState.exhaustPile}
            character={this.state.runState.character}
            what={"exhaust"}
            cardTips={this.state.runState.cardTips}
            game={this.state.runState.game}
          />
          <div>
            {this.state.runState.additionalTips
              .concat(this.state.runState.staticTips ?? [])
              .map((t, i) => (
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
                />
              ))}
          </div>
          <Tooltip
            id={"root-tooltip"}
            style={{ background: "transparent", zIndex: 500 }}
          />
        </div>
      </LocalizationContext>
    );
  }
}
