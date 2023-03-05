# Slay the Relics

This is a continuation of the now defunct slay the relics extension
(https://dashboard.twitch.tv/extensions/7dgfio8rek8dhju8628riism3fd11p-1.2.1) created by LordAddy.

If you encounter any issues, please open a GitHub issues in this repository.

## Features

- Full deck view with card art, card detail view for displaying upgrades
- Displays descriptions for: relics, potions, player powers, monster powers, orbs
- Near identical UI to the game

## Setup

- Download the modified [SlayTheRelicsExporter.jar](./mod/SlayTheRelicsExporter.jar) file and place it in your mod
  folder.
  Disable the original slay the relics mod when launching slay the spire.

- Obtain an OAuth key from <https://twitchapps.com/tmi>

- Open the Slay the Spire folder on your disk (PathToYourSteamLibrary/steamapps/common/SlayTheSpire)

  Create a file in this folder named slaytherelics_config.txt (it's supposed to be in the same folder as
  SlayTheSpire.exe),
  if you have file extensions hidden on your system just create a text file with the name slaytherelics_config
  Copy the following 2 lines into the file, put your login into it
  (be careful, your display name might not be the same as your login name, your login is for example in the url of your
  channel)
  and save it:

  ```
  login:<put_your_login_here_without_the_brackets>
  secret:<your_oauth_key (without the :oauth part)>
  ```

- The extension now should be active and working. As long as you play with the mod everything should be working.
  You will however most likely have issues with the extension being faster than the stream (out-of-sync).
  You can fix this once you start streaming with your viewers giving you feedback as follows:
    * Click Mods in the menu
    * Select Slay The Relics Exporter
    * Click Config in the bottom left
    * Set a delay and press Save. To find the optimal value, try starting at 0.7 second (700ms) and ask your viewers for
      feedback on whether the extension runs before or after the video.

- In order for the extension to be properly visually aligned with the game, the game capture has to perfectly fill the
  whole stream (as if you had the game fullscreen)