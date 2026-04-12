# Slay the Relics Exporter — Slay the Spire 2

A mod that exports game state to the [Slay the Relics](https://dashboard.twitch.tv/extensions/ebkycs9lir8pbic2r0b7wa6bg6n7ua) Twitch extension, allowing viewers to see tooltips for relics, potions, cards, and more.

## Install

1. Install the Twitch extension on your channel: <https://dashboard.twitch.tv/extensions/ebkycs9lir8pbic2r0b7wa6bg6n7ua>
2. Download the latest `SlayTheRelicsExporter` mod release
3. Place the mod folder in the `mods/` directory inside your STS2 install:
   - **Windows:** `<Steam library>/steamapps/common/Slay the Spire 2/mods/`
   - **macOS:** `<Steam library>/steamapps/common/Slay the Spire 2/SlayTheSpire2.app/Contents/MacOS/mods/`
   - **Linux:** `<Steam library>/steamapps/common/Slay the Spire 2/mods/`

## Building from source

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- Slay the Spire 2 installed via Steam

### Setup

Create a `Directory.Build.props` file in `sts2-mod/SlayTheRelicsExporter/` pointing to your game's data directory:

```xml
<Project>
  <PropertyGroup>
    <STS2GameDir>path/to/data/dir</STS2GameDir>
  </PropertyGroup>
</Project>
```

The data directory contains `sts2.dll`, `0Harmony.dll`, and `GodotSharp.dll`. Typical locations:

- **Windows:** `<Steam library>/steamapps/common/Slay the Spire 2/data_sts2_windows_x86_64`
- **macOS:** `<Steam library>/steamapps/common/Slay the Spire 2/SlayTheSpire2.app/Contents/Resources/data_sts2_macos_arm64`
- **Linux:** `<Steam library>/steamapps/common/Slay the Spire 2/data_sts2_linuxbsd_x86_64`

### Build

```sh
cd sts2-mod/SlayTheRelicsExporter
dotnet build
```

The output DLL (`bin/Debug/net9.0/SlayTheRelicsExporter.dll`) and `mod_manifest.json` need to be copied inside the mods directory (see Install above). (Rename mod_manifest.json.example to SlayTheRelicsExporter.json)

## First time setup

- Launch Slay the Spire 2 with mods enabled
- The mod will automatically open your browser to authenticate with Twitch on first launch
- After logging in, you can close the browser tab — the mod will start exporting game state automatically
- If you previously used the STS1 mod, your credentials will be migrated automatically

## Configuration

If [ModConfig-STS2](https://github.com/xhyrzldf/ModConfig-STS2) is installed, a settings panel is available under Settings → Mods → Slay The Relics Exporter with the following options:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Poll Interval (ms) | Slider (200–5000) | 1000 | How often game state is sent to the backend |
| Delay (ms) | Slider (0–10000) | 150 | Stream encoding delay — aligns extension output with what viewers see |
| Connect with Twitch | Button | — | Triggers the Twitch OAuth authentication flow |

ModConfig is optional — the mod works normally without it using built-in defaults. Authentication credentials (Channel, AuthToken) are stored separately in `%AppData%/SlayTheRelicsExporter/config.json` and are not exposed in the ModConfig UI.

## Notes

- In order for the extension to be properly visually aligned with the game, the game capture has to perfectly fill the whole stream (as if you had the game fullscreen)
- If the extension is out of sync with the stream, you may need to configure a delay

## Troubleshooting
- The game logs are accessible at `%AppData%/SlayTheSpire2/logs/godot.log` (Windows) or `~/Library/Application Support/SlayTheSpire2/godot.log` (macOS). Check for any error messages related to `SlayTheRelicsExporter`.
