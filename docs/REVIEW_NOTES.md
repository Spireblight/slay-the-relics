# Notes for reviewers from Twitch

This is an extension that tries to bring part of the experience of Slay the Spire and Slay the Spire 2
to the viewer. It imitates part of the GUI of the game on stream. It displays descriptions of various
items the player owns and also of player and monster powers in combat. The data only flows one way for
the viewer (from the game to the extension), they receive the data from the game and that is displayed
on stream. All they have to do is to hover over various areas exactly as if they were playing the
game themselves. The extension provides no further interaction for the viewer, all they can do is
display info about the state of the game of the streamer, they do not have any ability to interact
with the streamer or the game through the extension.

The data is being extracted using a mod of Slay the Spire / Slay the Spire 2 and through my EBS sent to
the extension using PubSub messaging.

## Version History/Changelog:

### version 2.0.2 - under review

- Performance / infrastructure: Migrated external card images and STS1 localisation JSON from `raw.githubusercontent.com` to a Cloudflare R2 CDN and switched STS2 card images to WebP for faster loading
- Bug fix: Fixed STS2 boss/ancient map icons, double-boss map layout, and visited node highlights
- Bug fix: Improved real-time state sync and resync handling when PubSub messages are dropped
- Bug fix: Hid the "View Upgrade" toggle in the card inspector for un-upgradable cards
- Bug fix: Aligned the STS2 deck overlay and top-bar deck/map buttons to the 80px top bar
- Bug fix: Fixed missing keyword tooltips on upgraded cards in the deck view
- Bug fix: Removed duplicate keyword tooltips on STS2 relics

### version 2.0.1 - currently released

- Bug fix: Fixed an issue related to initial run state fetch

### version 2.0.0 - currently released

- Added feature: support Slay the Spire 2

### version 0.0.2 - currently released

- Added features: Map view, draw/discard/exhaust view
- Fixed a lot of issues of the previous version where the tooltips are not consistently displayed
- Optimized message size sent to Twitch pub/sub, it is now much smaller

### version 0.0.1 - currently released

- Initial implementation of the extension. Features include deck viewer, tool tips for relics,
monsters, and the player.
