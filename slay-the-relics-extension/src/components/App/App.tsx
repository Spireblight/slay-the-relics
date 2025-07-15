import {Component} from "react";
import './App.css'
import {LookupRelic, RelicBar} from "../Relic/Relic";


export default class App extends Component {
    private readonly twitch: any;


    constructor(props) {
        super(props)

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window["Twitch"] ? window["Twitch"].ext : null;
        this.state = {relics: []};
    }

    componentDidMount() {
        if (this.twitch) {
            this.twitch.listen('broadcast', (target, contentType, body) => {
                // now that you've got a listener, do something with the result...

                // do something...
            })
        }

        this.setState({relics: ["akabeko", "bakabeko", "cakabeko", "dakabeko"]});
    }

    componentWillUnmount() {
        if (this.twitch) {
            this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))
        }
    }

    render() {
        return (
            <div className="App">
                <RelicBar relics={this.state.relics.map((relic, i) => LookupRelic(relic))}
                          multiPage={false}/>
            </div>
        )
    }
}