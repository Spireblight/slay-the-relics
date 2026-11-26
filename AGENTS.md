# Slay the Relics

Slay the Relics is a Twitch Extension and Slay the Spire 1/2 mod that streams live, interactive run state to viewers.

## Checks & Gotchas

- **Frontend (`slay-the-relics-extension/`)**: Run `yarn lint` (Prettier, `tsc -b`, ESLint) and `yarn test` after frontend changes.
- **Backend (`backend/`)**: Run `make lint` and `make imports` after backend changes (plus `go test ./...`).
- **STS2 mod (`sts2-mod/`)**: Run `dotnet test sts2-mod/SlayTheRelicsExporter.Tests/SlayTheRelicsExporter.Tests.csproj` (runs standalone without Godot/STS2 assemblies).
- **Shared state schema**: Keep `GameState` / `ExportedState` aligned across `backend/slaytherelics/game_state.go`, `sts2-mod/SlayTheRelicsExporter/src/Models/ExportedState.cs`, and `slay-the-relics-extension/src/components/App/App.tsx` (clear optional `omitempty` fields on full-snapshot resets in `App.tsx`).
- **Visual verification**: For extension UI, layout, or game-state rendering changes, use the `verify-extension` skill and inspect the captured PNG screenshots directly before finishing.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) when you need detailed component or protocol context.

