.PHONY: dev dev-twitch build-sts2-mod test

# Start Redis, Go backend (air hot-reload), and Vite frontend (HMR) in local SSE mode.
# Override transport with: make dev PUBSUB=twitch
dev:
	@./scripts/dev.sh

# Start local dev environment publishing to real Twitch PubSub instead of local SSE.
dev-twitch:
	@PUBSUB=twitch ./scripts/dev.sh

# Build and deploy the Slay the Spire 2 exporter mod to the local mods directory.
# Override destination with: make build-sts2-mod STS2_MODS_DIR=/path/to/mods
build-sts2-mod:
	@./scripts/build-sts2-mod.sh

# Run unit tests across backend, STS2 mod, and extension.
test:
	cd backend && go test ./...
	dotnet test sts2-mod/SlayTheRelicsExporter.Tests/SlayTheRelicsExporter.Tests.csproj
	cd slay-the-relics-extension && yarn tsc -b && yarn eslint
