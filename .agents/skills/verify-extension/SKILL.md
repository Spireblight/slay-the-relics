---
name: verify-extension
description: >-
  End-to-end verification of the Slay the Relics Twitch extension and Go backend.
  Starts an ephemeral dev-mode backend (DEV_MODE=true, PUBSUB_MODE=sse, no auth/Redis)
  and Vite frontend, seeds verified STS2 or STS1 game state for the user's default channel,
  drives Chromium via Playwright to capture 1920x1080 screenshots and Chrome DevTools
  telemetry (console errors, page errors, network/HTTP failures, SSE frames, broken images),
  and tears down cleanly. Use whenever verifying frontend, backend, or game-state changes.
---

# Verify Extension

Use this skill to visually and programmatically verify the Slay the Relics Twitch Video Overlay extension against the local Go backend without needing Twitch OAuth, Redis, Docker, or a live game client.

## Quick Start

Run the full scripted STS2 verification (ephemeral backend + Vite + Chromium Playwright smoke suite + live SSE patch):

```bash
bash .agents/skills/verify-extension/scripts/verify.sh
```

What this does automatically:
1. Resolves your default channel ID via [resolve-channel.sh](./scripts/resolve-channel.sh) (`SlayTheRelicsExporter/config.dev.json` -> `config.json` -> `"59817220"`).
2. Starts an isolated Go backend on a free port with `DEV_MODE=true PUBSUB_MODE=sse` (skips auth, no Redis/Docker/`.env` required).
3. Starts Vite on a free port proxying `/api` to that backend.
4. Seeds [sts2-combat.json](./resources/sts2-combat.json) via `POST /api/v2/game-state`.
5. Launches headless Chromium via `playwright-core` at `1920x1080` and captures:
   - `01-overlay.png` (initial HTTP snapshot load)
   - `02-relic-tooltip.png`, `03-potion-tooltip.png`, `04-hitbox-tooltip.png`
   - `05-map.png` (verifies canvas draws non-blank pixels)
   - `06-deck.png`, `07-card-view.png`, `08-draw-pile.png`
   - `09-after-patch.png`, `10-patched-relic-tooltip.png` (POSTs [sts2-patch.json](./resources/sts2-patch.json) and verifies live CDP SSE frame + DOM update)
6. Writes `report.json` with console errors/warnings, uncaught page errors, failed network requests, HTTP >=400 responses, SSE `broadcast` frames, broken `<img>` elements, and check results. Exits non-zero if any error or failed check occurs.
7. Tears down both servers cleanly on exit.

After running, **inspect `report.json` and view the captured PNG screenshots** (using `read_file`) to visually confirm alignment, tooltips, card renders, and map layout.

## Common Modes

### Verify STS1 layout
```bash
bash .agents/skills/verify-extension/scripts/verify.sh --game sts1
```

### Write screenshots & report to a specific directory
```bash
bash .agents/skills/verify-extension/scripts/verify.sh --out-dir /tmp/my-verify
```

### Verify a custom game-state fixture or feature
1. Pass `--fixture <path.json>` (and optionally `--patch <patch.json>` or `--no-patch`).
2. For custom clicks/hovers/assertions, pass `--actions <my-check.mjs>`:

```js
// my-check.mjs
export default async function ({ page, cdp, backendUrl, channel, outDir, postState, screenshot, addCheck }) {
  // Drive extra UI states, inspect computed styles, or POST resync-gap states
  await screenshot("custom-check.png");
  addCheck("custom-check", true, "verified");
}
```

```bash
bash .agents/skills/verify-extension/scripts/verify.sh \
  --fixture /tmp/custom-state.json \
  --actions /tmp/my-check.mjs
```

### Attach to an already-running `make dev` session
```bash
bash .agents/skills/verify-extension/scripts/verify.sh --reuse-running
```
Override ports if needed with `--backend-url` and `--frontend-url`.

### Manual or `/browser` interactive inspection (`--serve-only`)
Start the ephemeral dev-mode stack, seed state, and keep it running until Ctrl-C (or in a background `hc` terminal) so you or `/browser` can inspect `video_overlay.html` interactively:

```bash
bash .agents/skills/verify-extension/scripts/verify.sh --serve-only
```

### Ad-hoc state POST helper
While servers are running (`--serve-only` or `make dev` with `DEV_MODE=true`), push any JSON payload (including gzip or explicit `gameStateIndex` for gap/resync testing):

```bash
bash .agents/skills/verify-extension/scripts/post-state.sh \
  .agents/skills/verify-extension/resources/sts2-patch.json \
  --backend http://127.0.0.1:8888 \
  --index 5 \
  --gzip
```

## Scripts & Resources

- [scripts/verify.sh](./scripts/verify.sh) — Main orchestrator (ephemeral servers, seeding, Playwright runner, cleanup)
- [scripts/verify-browser.mjs](./scripts/verify-browser.mjs) — Playwright + CDP DevTools inspection and screenshot runner
- [scripts/post-state.sh](./scripts/post-state.sh) — Helper to POST game-state JSON with channel/index overrides and optional gzip
- [scripts/resolve-channel.sh](./scripts/resolve-channel.sh) — Resolves default channel ID from local STS2 mod config or fallback
- [resources/sts2-combat.json](./resources/sts2-combat.json) — Verified STS2 Ironclad combat fixture (relics, potions, enchanted/afflicted cards, dual-boss/ancient map, Dread combat/static tips)
- [resources/sts2-patch.json](./resources/sts2-patch.json) — Incremental STS2 update (`gameStateIndex: 1`) for live SSE diff verification
- [resources/sts1-combat.json](./resources/sts1-combat.json) — STS1 Ironclad combat fixture
