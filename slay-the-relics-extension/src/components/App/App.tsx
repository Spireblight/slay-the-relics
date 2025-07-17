import { Component } from "react";
import "./App.css";
import { RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";
import { DeckView } from "../Deck/Deck";
import PotionBar from "../Potion/Potion";
import SpireMap from "../SpireMap/SpireMap";

const nodes = [
  ["M", "*", "M", "*", "M", "*", "*"],
  ["*", "?", "?", "*", "?", "M", "*"],
  ["*", "M", "?", "M", "*", "*", "M"],
  ["M", "?", "$", "*", "M", "*", "M"],
  ["M", "?", "*", "M", "M", "M", "*"],
  ["E", "R", "*", "*", "E", "R", "E"],
  ["$", "E", "?", "*", "?", "*", "M"],
  ["*", "M", "*", "E", "M", "*", "R"],
  ["*", "T", "T", "*", "T", "T", "*"],
  ["*", "M", "M", "$", "*", "M", "*"],
  ["*", "R", "?", "*", "M", "*", "R"],
  ["M", "*", "?", "R", "?", "*", "E"],
  ["M", "E", "*", "M", "E", "*", "?"],
  ["M", "*", "M", "*", "M", "?", "M"],
  ["R", "*", "R", "*", "R", "*", "R"],
  ["*", "*", "*", "B", "*", "*", "*"],
];
const edges = [
  [
    [0, 0],
    [1, 1],
  ],
  [
    [2, 0],
    [2, 1],
  ],
  [
    [4, 0],
    [4, 1],
  ],
  [
    [4, 0],
    [5, 1],
  ],
  [
    [1, 1],
    [1, 2],
  ],
  [
    [2, 1],
    [1, 2],
  ],
  [
    [2, 1],
    [2, 2],
  ],
  [
    [4, 1],
    [3, 2],
  ],
  [
    [5, 1],
    [6, 2],
  ],
  [
    [1, 2],
    [0, 3],
  ],
  [
    [1, 2],
    [1, 3],
  ],
  [
    [1, 2],
    [2, 3],
  ],
  [
    [2, 2],
    [2, 3],
  ],
  [
    [3, 2],
    [4, 3],
  ],
  [
    [6, 2],
    [6, 3],
  ],
  [
    [0, 3],
    [0, 4],
  ],
  [
    [1, 3],
    [1, 4],
  ],
  [
    [2, 3],
    [1, 4],
  ],
  [
    [2, 3],
    [3, 4],
  ],
  [
    [4, 3],
    [4, 4],
  ],
  [
    [6, 3],
    [5, 4],
  ],
  [
    [0, 4],
    [0, 5],
  ],
  [
    [1, 4],
    [1, 5],
  ],
  [
    [3, 4],
    [4, 5],
  ],
  [
    [4, 4],
    [5, 5],
  ],
  [
    [5, 4],
    [6, 5],
  ],
  [
    [0, 5],
    [0, 6],
  ],
  [
    [1, 5],
    [1, 6],
  ],
  [
    [1, 5],
    [2, 6],
  ],
  [
    [4, 5],
    [4, 6],
  ],
  [
    [5, 5],
    [4, 6],
  ],
  [
    [6, 5],
    [6, 6],
  ],
  [
    [0, 6],
    [1, 7],
  ],
  [
    [1, 6],
    [1, 7],
  ],
  [
    [2, 6],
    [3, 7],
  ],
  [
    [4, 6],
    [3, 7],
  ],
  [
    [4, 6],
    [4, 7],
  ],
  [
    [6, 6],
    [6, 7],
  ],
  [
    [1, 7],
    [1, 8],
  ],
  [
    [1, 7],
    [2, 8],
  ],
  [
    [3, 7],
    [2, 8],
  ],
  [
    [3, 7],
    [4, 8],
  ],
  [
    [4, 7],
    [4, 8],
  ],
  [
    [6, 7],
    [5, 8],
  ],
  [
    [1, 8],
    [1, 9],
  ],
  [
    [2, 8],
    [2, 9],
  ],
  [
    [2, 8],
    [3, 9],
  ],
  [
    [4, 8],
    [5, 9],
  ],
  [
    [5, 8],
    [5, 9],
  ],
  [
    [1, 9],
    [1, 10],
  ],
  [
    [2, 9],
    [2, 10],
  ],
  [
    [3, 9],
    [2, 10],
  ],
  [
    [5, 9],
    [4, 10],
  ],
  [
    [5, 9],
    [6, 10],
  ],
  [
    [1, 10],
    [0, 11],
  ],
  [
    [2, 10],
    [2, 11],
  ],
  [
    [4, 10],
    [3, 11],
  ],
  [
    [4, 10],
    [4, 11],
  ],
  [
    [6, 10],
    [6, 11],
  ],
  [
    [0, 11],
    [0, 12],
  ],
  [
    [2, 11],
    [1, 12],
  ],
  [
    [2, 11],
    [3, 12],
  ],
  [
    [3, 11],
    [3, 12],
  ],
  [
    [4, 11],
    [4, 12],
  ],
  [
    [6, 11],
    [6, 12],
  ],
  [
    [0, 12],
    [0, 13],
  ],
  [
    [1, 12],
    [2, 13],
  ],
  [
    [3, 12],
    [4, 13],
  ],
  [
    [4, 12],
    [5, 13],
  ],
  [
    [6, 12],
    [6, 13],
  ],
  [
    [0, 13],
    [0, 14],
  ],
  [
    [2, 13],
    [2, 14],
  ],
  [
    [4, 13],
    [4, 14],
  ],
  [
    [5, 13],
    [6, 14],
  ],
  [
    [6, 13],
    [6, 14],
  ],
  [
    [0, 14],
    [3, 16],
  ],
  [
    [2, 14],
    [3, 16],
  ],
  [
    [4, 14],
    [3, 16],
  ],
  [
    [6, 14],
    [3, 16],
  ],
];

const path = [
  [0, 0],
  [1, 1],
  [1, 2],
];

interface AppState {
  channel: string;
  relics: string[];
  deck: string[];
  potions: string[];
  additionalTips: { tips: Tip[]; hitbox: HitBox }[];
  mapNodes: string[][];
  mapEdges: number[][][];
  mapPath: number[][];
}

export default class App extends Component<any, AppState> {
  private readonly twitch: typeof Twitch.ext | null;

  constructor(props: any) {
    super(props);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      relics: [],
      channel: "",
      additionalTips: [],
      deck: [],
      potions: [],
      mapNodes: nodes,
      mapEdges: edges,
      mapPath: path,
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

      this.twitch.listen("broadcast", (target, contentType, body) => {
        // now that you've got a listener, do something with the result...
        // do something...
      });
    }

    this.setState((prevState) => ({
      ...prevState,
      relics: [
        "akabeko",
        "bakabeko",
        "cakabeko",
        "dakabeko",
        "ekabeko",
        "fakabeko",
        "gakabeko",
        "hakabeko",
        "ikabeko",
        "jakabeko",
        "kakabeko",
        "lakabeko",
        "makabeko",
        "nakabeko",
        "oakabeko",
        "pakabeko",
        "qakabeko",
        "rakabeko",
        "sakabeko",
        "takabeko",
        "uakabeko",
        "vakabeko",
        "wakabeko",
        "xakabeko",
        "yakabeko",
        // "zakabeko",
      ],
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
      mapEdges: edges,
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
        <SpireMap
          nodes={this.state.mapNodes}
          edges={this.state.mapEdges}
          path={this.state.mapPath}
        />
        <RelicBar relics={this.state.relics} />
        <PotionBar potions={this.state.potions} />
        <DeckView cards={this.state.deck} />
        <div>
          {this.state.additionalTips.map((t, i) => (
            <PowerTipBlock
              key={"additional-tips-" + i}
              magGlass={false}
              hitbox={t.hitbox}
              tips={t.tips}
            />
          ))}
        </div>
      </div>
    );
  }
}
