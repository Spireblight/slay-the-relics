import * as React from "react";
import './App.css'

export default class App extends React.Component {
    private readonly twitch: any;

    constructor(props) {
        super(props)

        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window["Twitch"] ? window["Twitch"].ext : null
    }

    contextUpdate(context, delta) {
    }

    componentDidMount() {
        if (this.twitch) {
            this.twitch.listen('broadcast', (target, contentType, body) => {
                // now that you've got a listener, do something with the result...

                // do something...
            })
        }
    }

    componentWillUnmount() {
        if (this.twitch) {
            this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))
        }
    }

    render() {
        return (
            <div className="App">
                <p>Hello world! </p>
            </div>
        )
    }
}