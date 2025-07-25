# Notes for reviewers from Twitch

This is an extension that tries to bring part of the experience of Slay the Spire to the viewer. It
imitates part of the GUI of the game on stream. It displays descriptions of various items the
player owns and also of player and monster powers in combat. The data only flows one way for the
viewer (from the game to the extension), they receive the data from the game and that is displayed
on stream. All they have to do is to hover over various areas exactly as if they were playing the
game themselves. The extension provides no further interaction for the viewer, all they can do is
display info about the state of the game of the streamer, they do not have any ability to interact
with the streamer or the game through the extension.

The data is being extracted using a mod of Slay the Spire and through my EBS sent to the extension
using PubSub messaging.

## Version History/Changelog:

### version 0.0.2 - under review

- Added features: Map view, draw/discard/exhaust view
- Fixed a lot of issues of the previous version where the tooltips are not consistently displayed
- Optimized message size sent to Twitch pub/sub, it is now much smaller

### version 0.0.1 - currently released

- Initial implementation of the extension. Features include deck viewer, tool tips for relics,
monsters, and the player.