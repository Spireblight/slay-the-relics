---
name: verify-extension
description: >-
  End-to-end visual and DevTools verification of the Twitch extension and Go
  backend using ephemeral dev servers and Playwright. Use when verifying
  frontend, backend, or game-state changes.
---

# Verify Extension

Verify the Twitch Video Overlay extension against the local Go backend (`DEV_MODE=true`, `PUBSUB_MODE=sse`) without Twitch OAuth, Redis, Docker, or a live game client.

## Run Verification

```bash
bash .agents/skills/verify-extension/scripts/verify.sh
```

Run `bash .agents/skills/verify-extension/scripts/verify.sh --help` for all options (`--game sts1|sts2`, `--fixture`, `--patch`, `--no-patch`, `--actions`, `--out-dir`, `--reuse-running`, `--serve-only`, etc.).

The script starts ephemeral backend and Vite servers, seeds the fixture for your resolved channel, runs Playwright + CDP checks, writes `report.json` and PNG screenshots to the output directory, and tears down cleanly. It exits non-zero on any failed check, console/page error, failed request, HTTP `>=400`, or broken `<img>`.

## Visual Inspection (Required for UI Changes)

Text summaries and `report.json` do not catch layout regressions. After running `verify.sh`:

1. Read `report.json` in the output directory if any check failed or produced warnings.
2. Open the relevant captured PNGs directly with `read_file` to inspect alignment, clipped or wrapped text, tooltip placement, card renders, and map canvas output.
3. If the user supplied a reference screenshot or recording, compare the rendered PNGs against it before finishing.

## Ad-Hoc State Updates & Custom Checks

- **Push state to running servers** (`--serve-only` or `make dev`): use [scripts/post-state.sh](./scripts/post-state.sh) (`--help` for flags including `--backend`, `--channel`, `--index`, `--gzip`).
- **Custom Playwright checks**: pass `--actions <file.mjs>` with a default-exported async function receiving `{ page, cdp, backendUrl, channel, outDir, postState, screenshot, addCheck, report }` (see `runCustomActions` in [scripts/verify-browser.mjs](./scripts/verify-browser.mjs)).

## Files

- [scripts/verify.sh](./scripts/verify.sh) — Ephemeral server orchestrator and Playwright runner
- [scripts/verify-browser.mjs](./scripts/verify-browser.mjs) — Playwright + CDP telemetry and screenshot runner
- [scripts/post-state.sh](./scripts/post-state.sh) — Game-state POST helper
- [scripts/resolve-channel.sh](./scripts/resolve-channel.sh) — Channel ID resolver (mod config -> fallback)
- [resources/sts2-combat.json](./resources/sts2-combat.json), [resources/sts2-patch.json](./resources/sts2-patch.json), [resources/sts1-combat.json](./resources/sts1-combat.json) — Bundled fixtures
