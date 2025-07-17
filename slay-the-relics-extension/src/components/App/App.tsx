import { Component } from "react";
import "./App.css";
import { RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";
import { DeckView } from "../Deck/Deck";
import PotionBar from "../Potion/Potion";
import SpireMap from "../SpireMap/SpireMap";

const nodes = [
  [
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "M", parents: [] },
    { type: "M", parents: [] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
  ],
  [
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "M", parents: [3] },
    { type: "?", parents: [3] },
    { type: "*", parents: [] },
    { type: "M", parents: [4] },
    { type: "*", parents: [] },
  ],
  [
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "M", parents: [2] },
    { type: "?", parents: [3] },
    { type: "M", parents: [3, 5] },
    { type: "?", parents: [5] },
    { type: "$", parents: [5] },
  ],
  [
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "?", parents: [2, 3] },
    { type: "M", parents: [4] },
    { type: "*", parents: [] },
    { type: "?", parents: [5, 6] },
    { type: "*", parents: [] },
  ],
  [
    { type: "*", parents: [] },
    { type: "M", parents: [2] },
    { type: "*", parents: [] },
    { type: "$", parents: [2] },
    { type: "M", parents: [3] },
    { type: "M", parents: [5] },
    { type: "*", parents: [] },
  ],
  [
    { type: "R", parents: [1] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "R", parents: [3, 4, 5] },
    { type: "*", parents: [] },
    { type: "E", parents: [5] },
  ],
  [
    { type: "E", parents: [0] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "E", parents: [4] },
    { type: "?", parents: [4] },
    { type: "M", parents: [4] },
    { type: "R", parents: [6] },
  ],
  [
    { type: "R", parents: [0] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "R", parents: [3, 4] },
    { type: "E", parents: [5, 6] },
    { type: "*", parents: [] },
  ],
  [
    { type: "T", parents: [0] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "T", parents: [4] },
    { type: "T", parents: [4] },
    { type: "T", parents: [4] },
    { type: "T", parents: [5] },
  ],
  [
    { type: "*", parents: [] },
    { type: "?", parents: [0] },
    { type: "?", parents: [3] },
    { type: "M", parents: [4] },
    { type: "M", parents: [5] },
    { type: "R", parents: [6] },
    { type: "*", parents: [] },
  ],
  [
    { type: "R", parents: [1] },
    { type: "*", parents: [] },
    { type: "E", parents: [2, 3] },
    { type: "*", parents: [] },
    { type: "M", parents: [4, 5] },
    { type: "?", parents: [5] },
    { type: "*", parents: [] },
  ],
  [
    { type: "*", parents: [] },
    { type: "?", parents: [0, 2] },
    { type: "*", parents: [] },
    { type: "M", parents: [2] },
    { type: "E", parents: [4] },
    { type: "*", parents: [] },
    { type: "E", parents: [5] },
  ],
  [
    { type: "$", parents: [1] },
    { type: "*", parents: [] },
    { type: "M", parents: [3] },
    { type: "?", parents: [4] },
    { type: "M", parents: [4] },
    { type: "*", parents: [] },
    { type: "M", parents: [6] },
  ],
  [
    { type: "M", parents: [0] },
    { type: "?", parents: [0] },
    { type: "*", parents: [] },
    { type: "M", parents: [2] },
    { type: "M", parents: [3, 4] },
    { type: "M", parents: [6] },
    { type: "*", parents: [] },
  ],
  [
    { type: "R", parents: [0, 1] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "*", parents: [] },
    { type: "R", parents: [3, 4] },
    { type: "R", parents: [4] },
    { type: "R", parents: [5] },
  ],
];

const path = [
  [3, 0],
  [3, 1],
  [4, 2],
];

interface AppState {
  character: string;
  channel: string;
  relics: string[];
  baseRelicStats: Record<number, (string | number)[]>;
  deck: string[];
  potions: string[];
  additionalTips: { tips: Tip[]; hitbox: HitBox }[];
  mapNodes: { type: string; parents: number[] }[][];
  mapPath: number[][];
}

export default class App extends Component<never, AppState> {
  private readonly twitch: typeof Twitch.ext | null;

  constructor(props: never) {
    super(props);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
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

  componentDidMount() {
    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        const channel = auth.channelId;
        this.setState((prevState) => ({
          ...prevState,
          channel: channel,
        }));
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.twitch.listen("broadcast", (target, contentType, body) => {
        // now that you've got a listener, do something with the result...
        // do something...
      });
    }

    this.setState((prev) => ({ ...prev, character: "ironclad" }));
    this.setState((prevState) => ({
      ...prevState,
      relics: [
        "Akabeko",
        "Tiny House",
        "Sacred Bark",
        "Bottled Flame",
        "Happy Flower",
        "Sundial",
        "Cursed Key",
      ],
    }));
    this.setState((prevState) => ({
      ...prevState,
      baseRelicStats: { 3: ["#yFiend #yFire"] },
    }));

    this.setState((prevState) => ({
      ...prevState,
      deck: [
        "Wraith Form v2",
        "Predator",
        "Glass Knife",
        "Dagger Throw",
        "Backstab",
        "Grand Finale",
        "Deflect",
        "Tools of the Trade",
        "Accuracy",
        "Poisoned Stab+",
        "Heel Hook",
        "Slice",
        "Noxious Fumes",
        "Prepared",
        "Phantasmal Killer",
        "Endless Agony",
        "Poisoned Stab",
        "Blur",
        "Predator",
        "Calculated Gamble",
        "Wraith Form v2",
        "Predator",
        "Glass Knife+",
        "Dagger Throw",
        "Backstab",
        "Grand Finale",
        "Deflect",
        "Tools of the Trade",
        "Accuracy",
        "Poisoned Stab",
        "Heel Hook",
        "Slice",
        "Noxious Fumes",
        "Prepared",
        "Phantasmal Killer+",
        "Endless Agony",
        "Poisoned Stab",
        "Blur",
        "Predator",
        "Calculated Gamble",
      ],
    }));

    this.setState((prevState) => ({
      ...prevState,
      potions: ["", "Energy Potion", "", "Weak Potion"],
    }));

    const playerHitbox: HitBox = {
      x: "19.06%",
      y: "43.15%",
      w: "11.46%",
      h: "33.52%",
      z: 1,
    };
    const playerTips: Tip[] = [
      new Tip("tip 1", "description 1", null),
      new Tip("tip 1", Array(100).fill("a").join(" "), null),
      new Tip("tip 2", "description 2", null),
      new Tip("tip 3", "description 3", null),
      new Tip("tip 4", "description 4", null),
      new Tip("tip 5", "description 5", null),
      new Tip("tip 6", "description 6", null),
      new Tip("tip 1", Array(100).fill("a").join(" "), null),
      new Tip("tip 2", "description 2", null),
      new Tip("tip 3", "description 3", null),
      new Tip("tip 4", "description 4", null),
      new Tip("tip 5", "description 5", null),
      new Tip("tip 6", "description 6", null),
    ];
    this.setState((prevState) => ({
      ...prevState,
      additionalTips: [
        {
          hitbox: playerHitbox,
          tips: playerTips,
        },
      ],
    }));

    this.setState((prevState) => ({
      ...prevState,
      mapNodes: nodes,
      mapPath: path,
    }));
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten("broadcast", () =>
        console.log("successfully unlistened"),
      );
    }
  }

  render() {
    return (
      <div className={"App"}>
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
              hitbox={t.hitbox}
              tips={t.tips}
              offset={66}
            />
          ))}
        </div>
      </div>
    );
  }
}
