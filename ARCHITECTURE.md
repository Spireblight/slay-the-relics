# Slay the Relics — Architecture & Codebase Layout

## 1. Executive Summary

**Slay the Relics** is a production Twitch Extension ecosystem that streams real-time, interactive game state from *Slay the Spire* (STS1) and *Slay the Spire 2* (STS2) directly to Twitch viewers. Viewers see an interactive overlay synchronized over the video stream, enabling them to hover over relics, cards, potions, powers, and view the act map, draw pile, discard pile, and exhaust pile as if they were interacting with the game client directly.

The project is structured as a monorepo consisting of:
1. **Game Exporters**: In-game mods for STS1 (Java / ModTheSpire) and STS2 (C# .NET 9 / Godot 4) that poll game state, normalize data into a shared schema, and push compressed JSON payloads over HTTP.
2. **Backend Service (EBS)**: A Go service that authenticates streamers, tracks active game states in memory, computes RFC 7396-inspired partial merge patches, compresses diffs, and broadcasts them via Twitch PubSub.
3. **Twitch Video Overlay Extension**: A React 19 / TypeScript single-page application hosted within the Twitch video player iframe that listens to PubSub broadcasts, reconciles state diffs, and renders interactive hitboxes and UI modals.
4. **Asset & Development Tooling**: Card extraction tools (`ImageExporter`), static localization data, and build scripts.

---

## 2. High-Level Architecture & Data Flow

```mermaid
flowchart TD
    subgraph StreamerGame["Streamer Machine"]
        subgraph STS1["Slay the Spire 1 (Java / LibGDX)"]
            MTS["ModTheSpire / BaseMod"]
            STS1_Mod["SlayTheRelicsExporter.jar"]
            MTS --> STS1_Mod
        end

        subgraph STS2["Slay the Spire 2 (.NET 9 / Godot 4)"]
            GodotEngine["Godot Engine / Core Systems"]
            STS2_Mod["SlayTheRelicsExporter.dll"]
            GodotEngine --> STS2_Mod
        end

        OAuthLocal["Local Auth Server (Port 49000)<br/>Streamer 1-Click Twitch Login"]
        STS1_Mod -.-> OAuthLocal
        STS2_Mod -.-> OAuthLocal
    end

    subgraph EBS["Extension Backend Service (Go / Gin)"]
        API["Gin HTTP Router (:8888)"]
        AuthModule["OAuth Handler (/api/v1/auth)"]
        StateMgr["GameStateManager"]
        DiffEngine["RFC 7396 Merge Patch Engine"]
        Publisher["Publisher (Twitch PubSub / Local SSE)"]
        Redis[(Redis Store)]
        OTel["OpenTelemetry Tracer & Metrics"]

        API --> AuthModule
        API --> StateMgr
        AuthModule <--> Redis
        StateMgr --> DiffEngine
        DiffEngine --> Publisher
        Publisher --> OTel
    end

    subgraph TwitchInfra["Twitch Infrastructure"]
        TwitchOAuth["Twitch OAuth / ID API"]
        TwitchPubSub["Twitch Extension PubSub API"]
    end

    subgraph Viewers["Twitch Viewer Clients (Browser)"]
        subgraph Extension["Twitch Video Overlay (React 19 / Vite)"]
            PubSubListener["Twitch PubSub / Dev SSE Listener"]
            Decompressor["pako (gzip) + base85 decoder"]
            SyncCtrl["GameStateSyncController"]
            StateStore["RunState React State"]
            MapCanvas["Canvas Act Map Renderer"]
            DeckModal["Deck / Pile Viewer"]
            HitboxOverlay["Dynamic Screen Hitboxes"]

            PubSubListener --> Decompressor --> SyncCtrl --> StateStore
            StateStore --> MapCanvas
            StateStore --> DeckModal
            StateStore --> HitboxOverlay
        end
    end

    %% Auth Flow
    OAuthLocal <==>|"1. OAuth Code Exchange"| TwitchOAuth
    STS1_Mod & STS2_Mod ==>|"2. Code -> Bearer Token"| AuthModule
    AuthModule <==>|"3. Verify Token"| TwitchOAuth

    %% Streaming Flow
    STS1_Mod & STS2_Mod ==>|"4. POST /api/v2/game-state (Gzip JSON)"| API
    Publisher ==>|"5. PubSub Broadcast (ASCII85+Gzip)"| TwitchPubSub
    TwitchPubSub ==>|"6. Push Message"| PubSubListener

    %% Snapshot Recovery Flow
    Extension -.->|"7. Initial Load / Resync Fallback<br/>GET /api/v2/game-state/:channel-id"| API
```

### Data Pipeline Walkthrough

1. **Authentication**:
   - Streamer clicks "Connect with Twitch" in game settings.
   - The mod starts a temporary local HTTP server on `http://localhost:49000` and launches the system browser to Twitch's OAuth URL.
   - Twitch redirects to `localhost:49000/?code=...`. The local server captures the authorization code.
   - The mod sends `{ "code": "..." }` to the EBS endpoint `POST /api/v1/auth`.
   - EBS exchanges the code with Twitch, verifies the streamer identity, hashes the access token with `bcrypt`, stores it in Redis, and returns the User ID and Bearer AuthToken.
   - The mod saves credentials locally (`%AppData%/SlayTheRelicsExporter/config.json` on Windows, `$XDG_CONFIG_HOME/SlayTheRelicsExporter/config.json` on Linux, or `$STRE_CONFIG_DIR`; STS2 also supports a separate `config.dev.json` for local dev mode).

2. **Game State Polling & Serialization**:
   - The mod polls game singletons (`RunManager`, `CombatManager`, `RunState`, `Player`) on an interval (default: 1000ms).
   - In STS2, state access is scheduled on the main thread via `Callable.From(...).CallDeferred()` due to Godot thread-safety constraints, and posts are delayed by a configurable stream delay (default: 150ms).
   - Mod builds an `ExportedState` object:
     - Relics: Display titles and resolved hover tips (`relicTipMap`).
     - Deck & Piles: Card keys with optional upgrade (`+`) and variant annotations (`{cardId}[+]\u001F{enchantmentId}:{enchantmentAmount}\u001F{afflictionId}` when enchanted or afflicted).
     - Potions: Display names and hover tips (`potionTips`).
     - Map: Converted into dense row-major grid coordinates (`mapNodes[row][col]`, `mapPath`), plus `boss`, `secondBoss`, and `ancient`.
     - Combat Power Tips & Static Tips: Creature UI hitboxes (`additionalTips`) and Dread Mode top-bar boss dominion tooltips (`staticTips`) converted into screen percentages (`0%` to `100%`).
   - The mod Gzip-compresses the JSON payload and sends `POST /api/v2/game-state` with `Authorization: Bearer <token>` and `User-ID: <channel>`.

3. **Backend Diffing & Compression**:
   - The EBS validates the Bearer token against Redis (using an in-memory `redisUserAuthCache` to skip repeated `bcrypt` comparisons on high-frequency updates).
   - Updates are serialized per channel via `channelLocks`. The EBS tracks the mod's `ingestIndex` separately from the monotonic broadcast `gameStateIndex` so skipped no-op polls never create sequence gaps for viewers.
   - If `ingestIndex == 0` (new run / menu reset) or no prior state exists (e.g., mid-run backend restart), the full state is stored and broadcast.
   - Otherwise, `computeMergePatch` performs an RFC 7396-inspired diff:
     - Map fields (`cardTips`, `relicTipMap`): Per-key diff (only changed or newly added keys are sent).
     - Array / Primitive fields: Replaced if changed, omitted if identical.
     - Unchanged fields are completely omitted from the payload.
   - If nothing changed (patch has only `gameStateIndex` and `channel`), broadcast is skipped while `ingestIndex` is still recorded.
   - The payload is JSON-marshaled, Gzip-compressed (level: `BestCompression`), ASCII85-encoded into `<~...~>`, and sent via the active `Publisher` (Twitch PubSub in production, or `LocalPubSub` SSE in local dev).

4. **Viewer Extension Ingestion & Rendering**:
   - On initial mount, the extension fetches static localization JSON and calls `GET /api/v2/game-state/:channel-id` to load the full snapshot.
   - In real time, `window.Twitch.ext.listen("broadcast", ...)` receives PubSub frames (or `EventSource` on `/api/dev/events/:channel-id` in local SSE dev mode).
   - Frames are decoded via `base85` and decompressed via `pako` (gzip), then handed to `GameStateSyncController` (`sync.ts`).
   - Consecutive indexes (`prevIndex + 1 == newIndex`) are merged into React state (`setStateUpdate`); `index === 0` triggers a full reset snapshot; older/duplicate indexes are ignored.
   - If messages are dropped (`prevIndex + 1 < newIndex`), `GameStateSyncController` coalesces bursts into a single jittered HTTP snapshot fetch (up to 1000ms) and discards stale responses if newer patches or resets arrive while in flight.

---

## 3. Repository Layout

```
slaytherelics/
├── AGENTS.md                        # Repo-level agent rules (lint & architecture pointer)
├── ARCHITECTURE.md                  # This document
├── LICENSE                          # GPL-3.0 License
├── Makefile                         # Unified dev, STS2 mod deploy, and test targets
├── PRIVACY.md                       # Privacy policy for Twitch Extension
├── README.md                        # Project landing page & user install guide
├── scripts/                         # Repo-wide dev and build helper scripts
│   ├── build-sts2-mod.sh            # Build & deploy STS2 mod DLL + manifest to local game mods dir
│   └── dev.sh                       # Local dev orchestrator (Redis + air backend + Vite frontend)
├── assets/                          # Static assets and game media
│   ├── sts1/                        # Slay the Spire 1 assets
│   │   ├── card-images/             # STS1 card portraits (.png, plus1 suffix)
│   │   └── localization/            # STS1 cards.json, keywords.json, potions.json, relics.json
│   └── sts2/                        # Slay the Spire 2 assets
│       └── card-images/             # STS2 card renders exported via ImageExporter (.png, plusone suffix)
├── backend/                         # Go Extension Backend Service (EBS)
│   ├── api/                         # Gin route handlers and auth checks
│   │   ├── api.go                   # API struct, routing table, logger config
│   │   ├── auth.go                  # POST /api/v1/auth handler
│   │   ├── dev_events.go            # GET /api/dev/events/:channel-id SSE handler (local dev)
│   │   ├── dev_events_test.go       # SSE handler unit tests
│   │   └── game_state.go            # POST /api/v2/game-state & GET /api/v2/game-state/:channel-id
│   ├── client/                      # External service clients
│   │   ├── twitch.go                # Twitch Helix API & PubSub client
│   │   └── redis.go                 # Redis client initialization
│   ├── config/                      # Kong environment variable configuration
│   ├── errors/                      # Typed error definitions (AuthError)
│   ├── models/                      # Internal data models (User)
│   ├── o11y/                        # OpenTelemetry tracing, metrics, and HTTP middleware
│   ├── otel_config/                 # Local OpenTelemetry collector configuration
│   ├── scripts/                     # Linting, imports, dev-tools, and test shell scripts
│   ├── slaytherelics/               # Core business logic
│   │   ├── game_state.go            # GameState schema, computeMergePatch, compressJson, GameStateManager
│   │   ├── game_state_test.go       # Diffing, compression, and sequence-tracking tests
│   │   ├── local_pubsub.go          # Publisher interface & local dev SSE fanout hub
│   │   ├── local_pubsub_test.go     # LocalPubSub unit tests
│   │   ├── syncmap.go               # Generic thread-safe SyncMap[K, V]
│   │   └── users.go                 # Twitch OAuth validation, bcrypt hashing, Redis auth cache
│   ├── tools/                       # Go tool dependencies (golangci-lint, air, etc.)
│   ├── .air.toml                    # Air hot-reload config for local backend dev
│   ├── .env.example                 # Example environment variables for local dev
│   ├── Dockerfile                   # Multi-stage production container build
│   ├── docker-compose.yml           # Local dev dependencies (Redis 7 + OTel collector + OpenObserve)
│   ├── Makefile                     # Lint, imports, dev-tools, and test targets
│   ├── go.mod                       # Go 1.26 module definition
│   └── main.go                      # EBS entry point, publisher wiring, and pprof server
├── docs/                            # Design proposals, beta testing guides, review notes
│   ├── BETA.md                      # Beta testing instructions
│   ├── README.md                    # Original redesign proposal (v1 -> v2)
│   └── REVIEW_NOTES.md              # Notes submitted to Twitch Extension Reviewers
├── mod/                             # Slay the Spire 1 Java Mod
│   ├── src/main/java/str_exporter/  # Java source code
│   │   ├── SlayTheRelicsExporter.java# BaseMod entry point & ModPanel UI
│   │   ├── ModStatusImage.java      # Status indicator badge (healthy/error/auth)
│   │   ├── client/                  # EBSClient (HTTP communication with EBS)
│   │   ├── config/                  # Config, AuthManager, local AuthHttpServer
│   │   └── game_state/              # GameState snapshot builder, HitBox, MapNode, TipsBox, integrations
│   ├── src/main/resources/          # ModTheSpire.json, OAuth HTML templates, UI icons
│   ├── build.gradle.kts.example     # Gradle build script template
│   └── release-steam.sh             # Steam Workshop release packaging script
├── slay-the-relics-extension/       # Twitch Video Overlay Frontend (React 19 + TypeScript + Vite)
│   ├── public/                      # Static extension assets (icons, UI textures, power images)
│   │   └── img/                     # Map icons, ancients, afflictions, enchantments, orbs, powers, relics, UI controls
│   ├── src/                         # React components & application logic
│   │   ├── components/
│   │   │   ├── App/                 # App.tsx (root component, Twitch SDK, PubSub/SSE), sync.ts & sync.test.ts
│   │   │   ├── Buttons/             # ReturnButton and UI controls
│   │   │   ├── Deck/                # Deck.tsx (CardGrid, CardView modal, Pile viewers, variant tag parser)
│   │   │   ├── Localization/        # Static localization context and CDN fetcher
│   │   │   ├── Potion/              # Potion.tsx (PotionBar hitboxes and potion tooltips)
│   │   │   ├── Relic/               # Relic.tsx (RelicBar, dynamic hitbox pagination)
│   │   │   ├── SpireMap/            # SpireMap.tsx (HTML5 Canvas map rendering for STS1 & STS2), SpireMap.test.ts
│   │   │   └── Tip/                 # Tip.tsx (PowerTip, Hitbox, BBCode color tag parser, energy orbs)
│   │   ├── main.tsx                 # React DOM bootstrap
│   │   └── react-app-env.d.ts       # Global type definitions (Twitch SDK)
│   ├── video_overlay.html           # Twitch Extension video overlay entry HTML
│   ├── vite.config.mts              # Vite configuration (conditional mkcert HTTPS, /api proxy)
│   ├── tsconfig.json                # TypeScript compiler configuration
│   └── package.json                 # Node dependencies and scripts (Vite, Vitest, ESLint, Prettier)
└── sts2-mod/                        # Slay the Spire 2 C# .NET 9 Godot Mod
    ├── SlayTheRelicsExporter/       # Main STS2 game state exporter mod
    │   ├── mod_manifest.json        # STS2 mod metadata manifest
    │   ├── src/
    │   │   ├── SlayTheRelicsExporterMod.cs # Mod entry point ([ModInitializer]), Harmony init, polling loop
    │   │   ├── StateExporter.cs     # RunManager/CombatManager state extractor & card variant encoder
    │   │   ├── BackendClient.cs     # HTTP POST with Gzip compression and Bearer auth
    │   │   ├── HitBoxReader.cs      # Reflection-based Godot UI node reader (combat creatures & Dread boss icon)
    │   │   ├── MapTransformer.cs    # Extracts STS2 ActMap points (incl. StartingMapPoint) & visited path
    │   │   ├── MapGridBuilder.cs    # Pure grid builder projecting sparse (col, row) points into dense mapNodes
    │   │   ├── DreadBossBuffs.cs    # Dread Mode boss encounter/monster combat buff tooltip lookup
    │   │   ├── MadScienceVariant.cs # Resolves Mad Science TinkerTime card variant asset IDs
    │   │   ├── TipExporter.cs       # HoverTip extractor, mini-card resolver, enchantment tagging
    │   │   ├── InlineImageReplacer.cs# Replaces Godot [img] sprite fonts with [blue]/[gold] BBCode
    │   │   ├── AuthServer.cs        # HttpListener on port 49000 for Twitch OAuth code flow
    │   │   ├── Config.cs            # JSON config persistence (config.json & config.dev.json)
    │   │   ├── SettingsPanel.cs     # Harmony patches on NModInfoContainer for native in-game settings UI
    │   │   ├── Models/              # ExportedState, MapNodeData, TipData, TipsBoxData
    │   │   └── Serialization/       # ModelIdJsonConverter and SerializerOptions
    │   └── steam/                   # Steam Workshop packaging scripts and description
    ├── ImageExporter/               # Godot dev tool to export card renders to PNG
    │   ├── MainFile.cs              # Dev tool entry point
    │   ├── ImageExporterConsoleCmd.cs# Console commands: `imageexporter cards|card|class`
    │   └── project.godot            # Godot project file
    └── SlayTheRelicsExporter.Tests/ # Standalone C# unit tests (no Godot/STS2 assemblies required)
        ├── ConfigTests.cs           # Test config defaults, clamping, live/dev persistence
        ├── DreadBossBuffsTests.cs   # Test Dread Mode boss buff tooltip resolution
        ├── InlineImageReplacerTests.cs # Test BBCode tag conversion
        ├── MadScienceVariantTests.cs# Test Mad Science variant asset ID resolution
        └── MapGridBuilderTests.cs   # Test sparse-to-dense map grid projection
```

---

## 4. Component Deep Dives

### 4.1. Extension Backend Service (`backend/`)

The backend acts as an intelligent stateful relay between game exporters and the Twitch PubSub messaging network.

- **Framework & Dependencies**:
  - Language: Go 1.26
  - Router: Gin (`github.com/gin-gonic/gin`)
  - Storage: Redis 7 (`github.com/redis/go-redis/v9`)
  - Observability: OpenTelemetry Tracing (`go.opentelemetry.io/otel/trace`) and Metrics (`go.opentelemetry.io/otel/metric`)
  - CLI/Config: Kong (`github.com/alecthomas/kong`)

- **State Management & Diffing (`backend/slaytherelics/game_state.go`)**:
  - Maintains `GameStates SyncMap[string, GameState]`, `ingestIndexes SyncMap[string, int]`, and per-channel `channelLocks SyncMap[string, *sync.Mutex]` in memory.
  - Separates the mod's `ingestIndex` from the monotonic broadcast `gameStateIndex`: no-op updates still advance `ingestIndex` for stale-POST rejection without advancing the broadcast index, and mid-run backend restarts initialize the broadcast index to `ingestIndex`.
  - `computeMergePatch(prev *GameState, update GameState) map[string]any`:
    - Evaluates field equality using reflection.
    - Fields with `map[string]` types (`cardTips`, `relicTipMap`) undergo key-by-key comparison via `diffMapKeys`. Only added or modified keys are placed into the patch.
    - Fields that have not changed are completely omitted.
    - Always attaches `gameStateIndex` and `channel`.
    - If the resulting patch contains only those 2 metadata keys, the update is dropped without network transmission.
  - `compressJson(data any) (string, error)`:
    - Encodes data to JSON.
    - Compresses with `gzip.BestCompression`.
    - Encodes with `ascii85` wrapped in `<~` and `~>`.
    - This keeps typical state updates under Twitch PubSub's strict 5 KB message size limit.
  - **Pluggable Publisher (`backend/slaytherelics/local_pubsub.go`)**:
    - `PUBSUB_MODE=twitch` (default): publishes via `client.Twitch.PostExtensionPubSub` to Twitch Helix Extension PubSub.
    - `PUBSUB_MODE=sse`: publishes via in-process `LocalPubSub` and exposes `GET /api/dev/events/:channel-id` for local browser testing without Twitch credentials.

- **Authentication & Security (`backend/slaytherelics/users.go` & `backend/api/game_state.go`)**:
  - Streamers authenticate with Twitch OAuth (`POST /api/v1/auth`).
  - Access tokens are hashed using `bcrypt` and stored in Redis.
  - Game state posts require `Authorization: Bearer <token>` and `User-ID: <channel>`.
  - In-memory `redisUserAuthCache` caches validated tokens per user ID to bypass repeated `bcrypt` comparisons on high-frequency state updates (while still reading the user record from Redis).
  - `DevMode` flag (`DEV_MODE=true`): Bypasses authentication headers and uses the channel ID from the request body for local testing.

---

### 4.2. Slay the Spire 2 Mod (`sts2-mod/`)

The STS2 mod runs inside the Godot 4 / .NET 9 environment of *Slay the Spire 2*.

- **Lifecycle, Harmony & Threading (`SlayTheRelicsExporterMod.cs`, `SettingsPanel.cs`)**:
  - Annotated with `[ModInitializer("Initialize")]` for discovery by STS2's mod loader; applies Harmony patches on startup (`harmony.PatchAll()`).
  - `SettingsPanel.cs` patches `NModInfoContainer.Fill` and `NModInfoContainer.Clear` to render a native Godot settings UI inside STS2's Modding Screen (poll interval, stream delay, Twitch connect/reconnect status, and a runtime Dev Mode toggle when `config.dev.json` exists).
  - Runs a background polling task (`Task.Run` with `CancellationToken`) with a configurable pre-POST stream delay (`Delay`, default 150ms).
  - **Thread Safety**: Godot scene tree and game objects are strictly single-threaded. The polling task delegates state extraction to the main thread via `Callable.From(...).CallDeferred()` using `TaskCompletionSource<T>`.
  - Handles run boundary transitions: resets `gameStateIndex` to 0 when starting a new run or exiting to the main menu.

- **State Extraction (`StateExporter.cs`, `MadScienceVariant.cs`, `DreadBossBuffs.cs`)**:
  - Queries `MegaCrit.Sts2.Core.Runs.RunManager.Instance.DebugOnlyGetState()` to read `RunState`, resolving the local player via `NetService.NetId` (with single-player fallback).
  - Extracts character name, act `boss`, `secondBoss`, `ancient`, and `floor` (`TotalFloor`).
  - **Relics**: Formatted display names and hover tip data (`relicTipMap`).
  - **Deck & Combat Piles**: Card identifiers are serialized with optional `+` upgrade suffix and variant annotations using the unit separator `\u001F` (omitted when neither enchantment nor affliction is present):
    ```
    {cardId}[+]\u001F{enchantmentId}:{enchantmentAmount}\u001F{afflictionId}
    ```
    `MadScienceVariant` maps *Mad Science* cards (`TinkerTimeType` + `TinkerTimeRider`) to their matching asset IDs (`mad_science_<type>[_<rider>]`).
  - **Combat State**: When in combat (`CombatManager.Instance.IsInProgress`), exports `DrawPile`, `DiscardPile`, and `ExhaustPile` (sorted by rarity then ID), plus hand card tips.
  - **Dread Mode**: Exports the top-bar boss dominion tooltip into `staticTips` outside boss rooms, and prepends boss-specific Dread combat buff tooltips (`DreadBossBuffs.cs`) to enemy creatures during Dread boss encounters.

- **UI Hitbox Extraction (`HitBoxReader.cs`)**:
  - Uses reflection to inspect private `_creatureNodes` on `NCombatRoom.Instance` (for combat creature hitboxes) and `NRun.Instance.GlobalUi.TopBar.BossIcon` (for Dread Mode top-bar dominion tooltips).
  - Reads `Control.GlobalPosition` and `Control.Size` from `NCreature.Hitbox`.
  - Converts logical coordinates (1920×1080) into percentage coordinates (`X / 1920 * 100`) compatible with the extension's responsive overlay.

- **Map Projection (`MapTransformer.cs`, `MapGridBuilder.cs`)**:
  - STS2 models maps as sparse coordinate grids (`MapPoint` with `(col, row)`), with `StartingMapPoint` (Ancient at row 0) stored outside `ActMap.Grid`.
  - STS1 models maps as dense row-by-column arrays (`mapNodes[row][col]` with parent column indexes).
  - `MapTransformer` gathers all map points (including `StartingMapPoint`) and delegates to pure `MapGridBuilder` to project them into STS1's matrix format alongside `mapPath`, so the extension map component renders STS2 maps with the same schema.

- **Card Image Exporter (`ImageExporter/`)**:
  - In-game developer utility activated via Godot console: `imageexporter cards [output_path]`, `imageexporter card <card_id> [output_path]`, or `imageexporter class [output_path]`.
  - Dynamically mounts `res://scenes/cards/card.tscn` in a headless `SubViewport`.
  - Upgrades and mutates cards programmatically, waits 3 frames for texture rendering, and extracts high-resolution 734×916 PNG assets with transparency.

---

### 4.3. Slay the Spire 1 Mod (`mod/`)

The STS1 mod runs in Java 8 on top of ModTheSpire and BaseMod.

- **Structure**:
  - `SlayTheRelicsExporter.java`: Implements `StartGameSubscriber`, `PostInitializeSubscriber`, `PostRenderSubscriber`.
  - `GameStateManager.java`: Runs a background thread that invokes `GameState.poll()` and dispatches JSON updates.
  - `GameState.java`: Directly extracts `AbstractDungeon.player.masterDeck`, `relics`, `potions`, and builds the map matrix from `AbstractDungeon.map`.
  - `Integrations.java`: Hooks into third-party mods such as `RelicStats` to include relic counter statistics in tooltips.
  - `EBSClient.java`: HTTP client communicating with `POST /api/v2/game-state`.

---

### 4.4. Twitch Video Overlay Extension (`slay-the-relics-extension/`)

The frontend is a client-side React 19 application built with Vite and TailwindCSS v4, packaged into a zip file for the Twitch Extension CDN.

- **Lifecycle, PubSub & State Sync (`App.tsx`, `sync.ts`)**:
  - Initializes against `window.Twitch.ext` in production (or connects to local SSE at `/api/dev/events/:channel-id` when running standalone in local dev).
  - `onAuthorized`: Receives Twitch channel ID, fetches static localization files, and issues an initial HTTP GET to `/api/v2/game-state/:channel-id`.
  - `listen("broadcast", ...)`: Receives real-time state patches.
  - `decomp(body)`: Decodes ASCII85 and decompresses gzip using `pako`.
  - `GameStateSyncController` (`sync.ts`): Applies contiguous patches directly, resets optional STS2 fields on `gameStateIndex === 0` snapshots, ignores stale patches, and coalesces dropped-index bursts into a single jittered HTTP snapshot fetch (up to 1000ms) while discarding stale responses.

- **Deck & Card Rendering (`Deck/Deck.tsx`)**:
  - Split into `DeckButton`, `CardGrid` (overlay modal), and `CardView` (full-size card inspection with arrow key navigation).
  - Supports 4 pile modes: Master Deck, Draw Pile, Discard Pile, Exhaust Pile.
  - Splits card keys on `\u001F` to dynamically render:
    - Base card image (fetched from Cloudflare R2 CDN `assets/sts1/card-images/` for STS1 or `assets/sts2/card-images/` for STS2).
    - Affliction overlays (`./img/afflictions/`, e.g. `affliction_shattereda.png`).
    - Enchantment badges (`./img/enchantments/`) with count amounts.
    - Bottle relic indicators (Bottled Flame, Lightning, Tornado).
  - Dynamic damage/block calculation for scaling cards (e.g. *Genetic Algorithm*, *Ritual Dagger*, *Searing Blow*).

- **Map Rendering (`SpireMap/SpireMap.tsx`)**:
  - Renders the dungeon map on an HTML5 `<canvas>`.
  - Differentiates STS1 layout (tall, 15+ floors) vs STS2 layout (`computeSts2MapLayout`: wider, shorter room distribution, Ancient node icon `./img/map/ancient/{ancient}.png`, and optional `secondBoss` dual-boss layout).
  - Draws dashed connection lines between rooms and their parents.
  - Highlights visited rooms with glowing blue circular outlines based on `mapPath`.

- **Tooltip System (`Tip/Tip.tsx`)**:
  - Renders floating tooltips using `react-tooltip`.
  - Supports both STS1 formatting (`#y` yellow, `#b` blue, `#r` red, `[E]` energy) and STS2 BBCode tags (`[gold]`, `[blue]`, `[red]`, `[green]`, `[purple]`).
  - Supports `CardHoverTip` mini card images embedded within hover tips.

---

## 5. Key Architecture Patterns & Protocols

### 5.1. Canonical State Schema (`GameState` / `ExportedState`)

Both STS1 and STS2 normalize their internal state into an identical JSON schema:

```json
{
  "gameStateIndex": 42,
  "channel": "12345678",
  "game": "sts2",
  "character": "Ironclad",
  "boss": "cerberus",
  "secondBoss": "",
  "ancient": "neow",
  "floor": 12,
  "relics": ["Burning Blood", "Vajra"],
  "relicTipMap": {
    "Burning Blood": [{ "header": "Burning Blood", "description": "Heal 6 HP at end of combat." }]
  },
  "deck": ["strike_ironclad", "bash+", "strike_ironclad\u001Fburn:2\u001F"],
  "cardTips": {
    "bash+": [{ "header": "Vulnerable", "description": "Takes 50% more damage." }]
  },
  "potions": ["Fire Potion", ""],
  "potionTips": [{ "header": "Fire Potion", "description": "Deal 20 damage." }],
  "drawPile": ["defend_ironclad", "strike_ironclad"],
  "discardPile": ["bash+"],
  "exhaustPile": [],
  "mapNodes": [
    [{"type": "M", "parents": []}, {"type": "?", "parents": []}],
    [{"type": "E", "parents": [0, 1]}]
  ],
  "mapPath": [[0, 0], [0, 1]],
  "bottles": [-1, -1, -1],
  "potionX": 28.0,
  "additionalTips": [
    {
      "hitbox": { "x": 45.2, "y": 62.1, "w": 8.5, "h": 12.0, "z": 1 },
      "tips": [{ "header": "Vulnerable", "description": "Takes 50% more damage." }]
    }
  ],
  "staticTips": []
}
```

### 5.2. RFC 7396-Inspired Merge Patching

To minimize bandwidth over Twitch PubSub (maximum 5 KB per message):
- Unchanged top-level fields are omitted from the broadcast.
- Dictionary fields (`cardTips`, `relicTipMap`) undergo key-level diffing: only modified or newly introduced keys are included in the payload.
- Array fields (`deck`, `drawPile`, `discardPile`, `potions`, `relics`) are replaced in full when changed.
- Streamers with static screens produce no network packets after the first frame.

### 5.3. Multi-Game Support Strategy

The system handles differences between STS1 and STS2 transparently:
1. **Game Detection**: The `game: "sts2"` attribute signals the frontend to adjust layout coordinates (relic bar spacing, map button position, pile button offsets).
2. **Card Images**: Both STS1 (`assets/sts1/card-images/`, `plus1` upgrade suffix) and STS2 (`assets/sts2/card-images/`, `plusone` upgrade suffix, generated by `ImageExporter`) card portraits are served from the Cloudflare R2 CDN (`assets.slay-the-relics.sonoda.moe`).
3. **Rich Text Formatting**: `Tip.tsx` tests for `[` to parse STS2 BBCode color tags, falling back to STS1 space-delimited `#y`/`#b` tokens.
4. **Card Variants**: STS2 enchantments and afflictions are packed into card keys with `\u001F`, preserving string compatibility across the pipeline.

---

## 6. Developer & AI Agent Operations Guide

### 6.1. Building and Running the Components

#### Unified Local Dev & Test (Root `Makefile`)
```bash
# Start local Redis, Go backend (air hot-reload), and Vite frontend (HMR) in local SSE mode
# Frontend: http://localhost:5173/video_overlay.html | Backend: http://localhost:8888
make dev

# Start local dev environment publishing to real Twitch PubSub (HTTPS on :8080)
make dev-twitch

# Build and deploy the STS2 exporter mod to the local Slay the Spire 2 mods directory
make build-sts2-mod

# Run unit tests and type/lint checks across backend, STS2 mod, and extension
make test
```

#### Backend (Go)
```bash
cd backend

# Install dev tools (golangci-lint, goimports, air)
make install-dev-tools

# Run tests
make test

# Run linter and import checker (required for backend changes)
make lint
make imports

# Start local dependencies (Redis 7, OTel collector, OpenObserve)
docker compose up -d

# Run backend locally in dev + SSE mode (skips Twitch auth requirement)
DEV_MODE=true PUBSUB_MODE=sse REDIS_ADDR=localhost:6379 LISTEN_ADDR=:8888 go run main.go
```

#### Twitch Extension Frontend (React / Vite)
```bash
cd slay-the-relics-extension

# Install dependencies
yarn install

# Run Vite dev server (default http://localhost:8080/video_overlay.html; override via VITE_PORT / VITE_HTTPS)
yarn dev

# Run Vitest unit tests (sync.test.ts, SpireMap.test.ts)
yarn vitest run

# Format, typecheck, and lint (required for frontend changes)
yarn lint

# Build production bundle (generates build.zip for Twitch Developer Console upload)
yarn build
```

#### Slay the Spire 2 Mod (C# .NET 9)
```bash
cd sts2-mod/SlayTheRelicsExporter

# Optional: configure local STS2 game/mods directories in Directory.Build.props
# (falls back to BSchneppe.Sts2.ReferenceAssemblies NuGet package in CI when STS2GameDir is absent):
# <Project><PropertyGroup><STS2GameDir>/path/to/game/data</STS2GameDir></PropertyGroup></Project>

# Run unit tests
dotnet test ../SlayTheRelicsExporter.Tests/SlayTheRelicsExporter.Tests.csproj

# Build Release DLL
dotnet build -c Release
```

#### Slay the Spire 1 Mod (Java / Gradle)
```bash
cd mod
./gradlew build
```

---

### 6.2. Common Extension Scenarios (Agent Cheatsheet)

| Task | Files to Touch | Key Considerations |
|---|---|---|
| **Add a new STS2 mechanic (e.g. new card modifier)** | `sts2-mod/.../StateExporter.cs`<br/>`slay-the-relics-extension/.../Deck.tsx` | Extend `GetCardKey()` in C# with `\u001F` delimiter (or add a pure helper like `MadScienceVariant.cs` + unit tests). Parse modifier in `Deck.tsx` and render overlay icon or badge. |
| **Add a new GameState field** | `backend/slaytherelics/game_state.go`<br/>`sts2-mod/.../Models/ExportedState.cs`<br/>`slay-the-relics-extension/.../App.tsx` | Annotate optional fields with `json:"...,omitempty"` in Go. If a map, `computeMergePatch` handles key-level diffing automatically. Clear optional fields in `App.tsx` snapshot reset callbacks (`applyFullState` / `onResetSnapshot`) if omitted when empty. |
| **Adjust Hitbox / UI alignment** | `slay-the-relics-extension/.../Relic.tsx`<br/>`Potion.tsx`<br/>`Deck.tsx`<br/>`SpireMap.tsx` | Check whether alignment condition requires `props.game === "sts2"`. Coordinates are percentages relative to 1920×1080. |
| **Add new backend API endpoint** | `backend/api/api.go`<br/>`backend/api/<feature>.go` | Register in `api.New()`. Include OpenTelemetry span (`o11y.Tracer.Start`). Apply auth check via `users.AuthenticateRedis` unless `devMode`. |
| **Update STS2 Card Images** | `sts2-mod/ImageExporter/` | Run `imageexporter cards` (or `card <id>` / `class`) in the STS2 developer console, copy output PNGs to `assets/sts2/card-images/`. |
