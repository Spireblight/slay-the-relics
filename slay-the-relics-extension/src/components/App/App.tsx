import { Component } from "react";
import "./App.css";
import { LookupRelic, RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";
import { DeckView } from "../deck/Deck";
import PotionBar from "../Potion/Potion";

interface AppState {
  channel: string;
  relics: string[];
  deck: string[];
  potions: string[];
  additionalTips: Tip[];
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
      relics: ["akabeko", "bakabeko", "cakabeko", "dakabeko"],
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
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten("broadcast", () =>
        console.log("successfully unlistened"),
      );
    }
  }

  render() {
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

    return (
      <div className={"App"}>
        <RelicBar
          relics={this.state.relics.map((relic, i) => LookupRelic(relic))}
          multiPage={false}
        />
        <PotionBar potions={this.state.potions} />

        <DeckView cards={this.state.deck} />
        <PowerTipBlock
          magGlass={false}
          hitbox={playerHitbox}
          tips={playerTips}
          offset={{ x: "0", y: "0" }}
        />
      </div>
    );
  }
}
