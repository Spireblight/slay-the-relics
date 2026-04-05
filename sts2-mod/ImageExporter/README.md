# Image Exporter Mod

Dev tool for Slay the Spire 2 that exports card images as PNGs using the game's own rendering pipeline. The output matches the format used by the Slay the Relics Twitch extension.

## Prerequisites

- Slay the Spire 2 with mod support enabled
- [BaseLib](https://github.com/Alchyr/BaseLib) mod installed
- .NET 9 SDK

## Building

```bash
cd sts2-mod/ImageExporter
dotnet build
```

The build automatically copies the DLL and mod manifest to the game's mods directory. Override the paths if needed:

```bash
dotnet build -p:STS2GameDir=/path/to/game/data -p:STS2ModsDir=/path/to/mods
```

## Usage

Open the in-game developer console (`^` key) and run:

### Export a single card

```
imageexporter card <card_id> [output_path]
```

Example:
```
imageexporter card abrasive
imageexporter card relax /Users/me/Desktop/cards
```

### Export all cards

```
imageexporter cards [output_path]
```

This exports every card in the game (base + upgraded variants). Takes a few minutes.

The default output path is `user://card-images` which resolves to the game's user data directory (e.g. `~/Library/Application Support/SlayTheSpire2/card-images` on macOS).

## Output

- **Format**: 734×916 PNG with transparent background
- **Naming**: `{card_id}.png` for base cards, `{card_id}plusone.png` for upgraded variants
- **Card IDs**: lowercase, matching `CardModel.Id.Entry` (e.g. `abrasive`, `adaptive_strike`)

## How it works

1. Instantiates an `NCard` from `res://scenes/cards/card.tscn` inside a `SubViewport`
2. Sets the card model (mutable clone) and calls `UpdateVisuals` to populate title, description, cost, and portrait
3. Waits 3 frames for the card to fully render
4. Captures the viewport texture and saves as PNG
5. For upgraded cards, clones the base card, calls `UpgradeInternal()` + `FinalizeUpgradeInternal()`, and exports with `plusone` suffix

Cards are exported sequentially to avoid memory pressure. The batch exporter processes one card at a time, waiting for each to finish before starting the next.

## Limitations

- Animated VFX (particles, sparkles) will vary between renders — this is cosmetic and expected
- **MadScience (Tinker Time)**: This card has dynamic type (Attack/Skill/Power) and rider effects that change its appearance and description. The exporter renders all three type variants (`mad_science_attack.png`, `mad_science_skill.png`, `mad_science_power.png`) plus a default `mad_science.png` (Attack). Rider effects are not captured in the image — they only affect the card description which is handled by tooltips at runtime
- The mod must be loaded in-game; it cannot run headless
