#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/slay-the-relics-extension"

PUBSUB_OVERRIDE="${PUBSUB:-${PUBSUB_MODE:-}}"
for arg in "$@"; do
  case "$arg" in
    --pubsub=*)
      PUBSUB_OVERRIDE="${arg#*=}"
      ;;
    -h|--help)
      echo "Usage: $0 [--pubsub=sse|twitch]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

# 1. Ensure STS2 mod config.dev.json exists (without touching live config.json)
CONFIG_BASE="${STRE_CONFIG_DIR:-${XDG_CONFIG_HOME:-${HOME}/.config}}"
MOD_CONFIG_DIR="${CONFIG_BASE}/SlayTheRelicsExporter"
LIVE_CONFIG="${MOD_CONFIG_DIR}/config.json"
DEV_CONFIG="${MOD_CONFIG_DIR}/config.dev.json"

mkdir -p "${MOD_CONFIG_DIR}"
if [[ ! -f "${DEV_CONFIG}" ]]; then
  cat > "${DEV_CONFIG}" <<'EOF'
{
  "BackendUrl": "http://localhost:8888",
  "Channel": "",
  "AuthToken": "",
  "PollIntervalMs": 1000,
  "Delay": 150
}
EOF
  echo "[dev] Created ${DEV_CONFIG} pointing at http://localhost:8888"
fi

# 2. Load backend/.env
ENV_FILE="${BACKEND_DIR}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[dev] Missing ${ENV_FILE}." >&2
  echo "[dev] Copy backend/.env.example to backend/.env and fill in your Twitch credentials." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

# Default local dev to mutually exclusive SSE mode unless explicitly overridden
export PUBSUB_MODE="${PUBSUB_OVERRIDE:-sse}"
if [[ "${PUBSUB_MODE}" != "sse" && "${PUBSUB_MODE}" != "twitch" ]]; then
  echo "[dev] Invalid PUBSUB_MODE='${PUBSUB_MODE}' (must be 'sse' or 'twitch')." >&2
  exit 1
fi

# Use plain HTTP on port 5173 in standalone SSE mode (avoids port 8080 conflicts and cert errors);
# use HTTPS on port 8080 for Twitch iframe/Dev Rig testing unless overridden.
export VITE_PUBSUB_MODE="${PUBSUB_MODE}"
if [[ -z "${VITE_HTTPS:-}" ]]; then
  if [[ "${PUBSUB_MODE}" == "twitch" ]]; then
    export VITE_HTTPS="true"
  else
    export VITE_HTTPS="false"
  fi
fi
if [[ -z "${FRONTEND_PORT:-}" ]]; then
  if [[ "${PUBSUB_MODE}" == "twitch" ]]; then
    FRONTEND_PORT="8080"
  else
    FRONTEND_PORT="5173"
  fi
fi
export VITE_PORT="${FRONTEND_PORT}"

FRONTEND_SCHEME="http"
if [[ "${VITE_HTTPS}" == "true" ]]; then
  FRONTEND_SCHEME="https"
fi

# 3. Start local Redis via docker compose
echo "[dev] Starting local Redis..."
if docker compose version >/dev/null 2>&1; then
  docker compose -f "${BACKEND_DIR}/docker-compose.yml" up -d redis
else
  docker-compose -f "${BACKEND_DIR}/docker-compose.yml" up -d redis
fi

# 4. Ensure air is installed in backend/bin
AIR_BIN="${BACKEND_DIR}/bin/air"
if [[ ! -x "${AIR_BIN}" ]]; then
  echo "[dev] Installing air into backend/bin..."
  (cd "${BACKEND_DIR}/tools" && GOBIN="${BACKEND_DIR}/bin" go install github.com/air-verse/air)
fi

# 5. Auto-detect dev channel from config.dev.json (falling back to live config.json)
read_channel() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json, sys
try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        print(json.load(f).get("Channel", "") or "")
except Exception:
    pass' "$file"
  fi
}

if [[ -z "${VITE_DEV_CHANNEL:-}" ]]; then
  DETECTED_CHANNEL="$(read_channel "${DEV_CONFIG}")"
  if [[ -z "${DETECTED_CHANNEL}" ]]; then
    DETECTED_CHANNEL="$(read_channel "${LIVE_CONFIG}")"
  fi
  if [[ -n "${DETECTED_CHANNEL}" ]]; then
    export VITE_DEV_CHANNEL="${DETECTED_CHANNEL}"
  fi
fi

# Derive backend target URL and port for Vite proxy from LISTEN_ADDR (default :8888)
LISTEN_ADDR="${LISTEN_ADDR:-:8888}"
BACKEND_HOST="127.0.0.1"
BACKEND_PORT="8888"
if [[ "${LISTEN_ADDR}" == :* ]]; then
  BACKEND_PORT="${LISTEN_ADDR#:}"
  export VITE_BACKEND_URL="http://localhost:${BACKEND_PORT}"
elif [[ "${LISTEN_ADDR}" == 0.0.0.0:* ]]; then
  BACKEND_PORT="${LISTEN_ADDR#0.0.0.0:}"
  export VITE_BACKEND_URL="http://localhost:${BACKEND_PORT}"
elif [[ "${LISTEN_ADDR}" == "[::]:"* ]]; then
  BACKEND_PORT="${LISTEN_ADDR#\[::\]:}"
  export VITE_BACKEND_URL="http://localhost:${BACKEND_PORT}"
elif [[ "${LISTEN_ADDR}" != http://* && "${LISTEN_ADDR}" != https://* ]]; then
  BACKEND_HOST="${LISTEN_ADDR%:*}"
  BACKEND_PORT="${LISTEN_ADDR##*:}"
  export VITE_BACKEND_URL="http://${LISTEN_ADDR}"
else
  export VITE_BACKEND_URL="${LISTEN_ADDR}"
  hostport="${LISTEN_ADDR#*://}"
  hostport="${hostport%%/*}"
  BACKEND_HOST="${hostport%:*}"
  BACKEND_PORT="${hostport##*:}"
fi

echo ""
echo "============================================================"
echo " Slay the Relics Local Dev"
echo "  Backend:     ${VITE_BACKEND_URL} (air hot-reload)"
echo "  Frontend:    ${FRONTEND_SCHEME}://localhost:${FRONTEND_PORT}/video_overlay.html (Vite HMR)"
echo "  PubSub mode: ${PUBSUB_MODE}"
echo "  Dev channel: ${VITE_DEV_CHANNEL:-<not set yet; use ?channel=<id> or connect STS2 mod>}"
echo "  STS2 config: ${DEV_CONFIG}"
echo "               (toggle 'Dev Mode' in STS2 Mod Settings panel)"
echo "============================================================"
echo ""

PIDS=()
kill_tree() {
  local pid="$1"
  local child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child"
  done
  kill -TERM "$pid" 2>/dev/null || true
}

STOPPING=0
stop_children() {
  if [[ "${STOPPING}" -eq 1 ]]; then
    return
  fi
  STOPPING=1
  echo ""
  echo "[dev] Shutting down backend and frontend..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill_tree "$pid"
    fi
  done
  wait 2>/dev/null || true
}

on_signal() {
  trap - INT TERM EXIT
  stop_children
  exit 0
}

on_exit() {
  local exit_code=$?
  trap - INT TERM EXIT
  stop_children
  exit "$exit_code"
}
trap on_signal INT TERM
trap on_exit EXIT

# Start Go backend (air) first and wait until it is accepting connections before starting Vite
(
  cd "${BACKEND_DIR}"
  exec "${AIR_BIN}" -c .air.toml
) > >(sed -u 's/^/[backend]  /') 2>&1 &
BACKEND_PID=$!
PIDS+=("${BACKEND_PID}")

echo "[dev] Waiting for backend on ${BACKEND_HOST}:${BACKEND_PORT}..."
BACKEND_READY=0
for _ in $(seq 1 300); do
  if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
    echo "[dev] Backend process exited before becoming ready." >&2
    exit 1
  fi
  if (echo > "/dev/tcp/${BACKEND_HOST}/${BACKEND_PORT}") >/dev/null 2>&1; then
    BACKEND_READY=1
    break
  fi
  sleep 0.1
done

if [[ "${BACKEND_READY}" -ne 1 ]]; then
  echo "[dev] Timed out waiting for backend on ${BACKEND_HOST}:${BACKEND_PORT}; starting frontend anyway." >&2
fi

(
  cd "${FRONTEND_DIR}"
  exec ./node_modules/.bin/vite
) > >(sed -u 's/^/[frontend] /') 2>&1 &
PIDS+=($!)

# Wait until either process exits
wait -n "${PIDS[@]}" 2>/dev/null || wait "${PIDS[@]}"
