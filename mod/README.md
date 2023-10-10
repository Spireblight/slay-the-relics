# Slay the Relics

<https://dashboard.twitch.tv/extensions/ebkycs9lir8pbic2r0b7wa6bg6n7ua-0.0.1>

This is a continuation of the now defunct slay the relics extension
(https://dashboard.twitch.tv/extensions/7dgfio8rek8dhju8628riism3fd11p-1.2.1) created by LordAddy.

## Features

- Full deck view with card art, card detail view for displaying upgrades
- Displays descriptions for: relics, potions, player powers, monster powers, orbs
- Near identical UI to the game

## Install

- Install the twitch extension: <https://dashboard.twitch.tv/extensions/ebkycs9lir8pbic2r0b7wa6bg6n7ua-0.0.1>

- Subscribe to the mod on steam workshop: <https://steamcommunity.com/sharedfiles/filedetails/?id=3048891690>

## First time setup

- Start slay the spire, make sure to choose the play with mods option
- Make sure Slay the Relics Exporter mod is enabled
- Start the game and go to the mods menu item. You should see a list of mods.
  - Click Slay the Relics Exporter
  - Click the Config button. It's located to the right of the Return button
  - Click Connect with Twitch
  - Clicking the button will open a new tab in your default browser and prompt you to log in with Twitch.
    If the browser redirect did not work there should be a button to prompt you to click the redirect manually.
    After successful authentication you can close the browser tab.
  - You should see the Twitch icon turn from red to green.
  - You can now click the Close button.
- The extension now should be active and working. As long as you play with the mod everything should be working.
- In order for the extension to be properly visually aligned with the game, the game capture has to perfectly fill the
  whole stream (as if you had the game fullscreen)

## Setting delay

You will likely have issues with the extension being faster than the stream (out-of-sync).
You can fix this once you start streaming with your viewers giving you feedback as follows:
* Click Mods in the menu
* Select Slay The Relics Exporter
* Click Config in the bottom left
* Set a delay and press Save. To find the optimal value, try starting at 0.7 second (700ms) and ask your viewers for
feedback on whether the extension runs before or after the video.

## Troubleshooting

Check the Twitch icon in the mod panel. (main menu -> mods -> Slay The Relics Exporter -> Config)

If it is green, everything should be working.
If it is red, you can try to Connect with Twitch again.

## FAQ

- Where did `slaytherelics_config.txt` go?

  It is no longer used, you can delete it.

- What about the `SlayTheRelicsExporter.jar` in the `mods` folder?

  It is no longer used, you should delete it.

