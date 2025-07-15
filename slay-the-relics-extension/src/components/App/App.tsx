import { Component } from "react";
import "./App.css";
import { LookupRelic, RelicBar } from "../Relic/Relic";
import { HitBox, PowerTipBlock, Tip } from "../Tip/Tip";

interface AppState {
  channel: string;
  relics: string[];
  additionalTips: Tip[];
}

export default class App extends Component<any, AppState> {
  private readonly twitch: typeof Twitch.ext | null;

  constructor(props) {
    super(props);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = { relics: [], channel: "", additionalTips: [] };
  }

  componentDidMount() {
    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        const channel = auth.channelId;
        this.setState({ ...this.state, channel });
      });

      this.twitch.listen("broadcast", (target, contentType, body) => {
        // now that you've got a listener, do something with the result...
        // do something...
      });
    }

    // 16:42:06.418 INFO builders.TipsJSONBuilder> Player hitbox: [19.06,43.15,11.46,33.52,

    this.setState({
      ...this.state,
      relics: ["akabeko", "bakabeko", "cakabeko", "dakabeko"],
    });
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
      <div className="App">
        <RelicBar
          relics={this.state.relics.map((relic, i) => LookupRelic(relic))}
          multiPage={false}
        />

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
