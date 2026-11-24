#!/usr/bin/env bash
# End-to-end verification harness for the Slay the Relics Twitch extension.
# Starts an isolated dev-mode backend (DEV_MODE=true PUBSUB_MODE=sse, no auth/Redis needed)
# and Vite frontend on ephemeral local ports, seeds a game-state fixture, drives Chromium via
# Playwright to capture screenshots + DevTools telemetry, and cleans up on exit.
set -euo pipefail

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
SKILL_DIR="$(CDPATH='' cd -- "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(CDPATH='' cd -- "${SKILL_DIR}/../../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/slay-the-relics-extension"

GAME="sts2"
FIXTURE=""
PATCH=""
NO_PATCH=0
CHANNEL=""
OUT_DIR=""
VIEWPORT="1920x1080"
SERVE_ONLY=0
REUSE_RUNNING=0
BACKEND_URL=""
FRONTEND_URL=""
ACTIONS=""
NO_FAIL=0
SKIP_DEFAULT_CHECKS=0
CHROMIUM_BIN="${CHROMIUM_BIN:-}"

usage() {
  cat <<'EOF'
Usage: verify.sh [options]

Options:
  --game sts2|sts1          Select bundled fixture set (default: sts2)
  --fixture <path>          Custom initial game-state JSON fixture
  --patch <path>            Custom live SSE patch JSON fixture
  --no-patch                Skip the live SSE patch step
  --channel <id>            Override Twitch channel ID (default: auto-detected)
  --out-dir <dir>           Output directory for screenshots and report.json
  --viewport <WxH>          Browser viewport (default: 1920x1080)
  --actions <file.mjs>      Custom Playwright verification module
  --skip-default-checks     Run only --actions without the built-in smoke checks
  --serve-only              Start servers + seed state and keep running until Ctrl-C
  --reuse-running           Attach to already-running dev servers (default :8888 / :5173)
  --backend-url <url>       Backend URL when using --reuse-running
  --frontend-url <url>      Frontend URL when using --reuse-running
  --chromium <path>         Path to Chromium executable
  --no-fail                 Exit 0 even if verification finds errors
  -h, --help                Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --game)
      GAME="$2"
      shift 2
      ;;
    --fixture)
      FIXTURE="$2"
      shift 2
      ;;
    --patch)
      PATCH="$2"
      shift 2
      ;;
    --no-patch)
      NO_PATCH=1
      shift
      ;;
    --channel)
      CHANNEL="$2"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="$2"
      shift 2
      ;;
    --viewport)
      VIEWPORT="$2"
      shift 2
      ;;
    --actions)
      ACTIONS="$2"
      shift 2
      ;;
    --skip-default-checks)
      SKIP_DEFAULT_CHECKS=1
      shift
      ;;
    --serve-only)
      SERVE_ONLY=1
      shift
      ;;
    --reuse-running)
      REUSE_RUNNING=1
      shift
      ;;
    --backend-url)
      BACKEND_URL="$2"
      shift 2
      ;;
    --frontend-url)
      FRONTEND_URL="$2"
      shift 2
      ;;
    --chromium)
      CHROMIUM_BIN="$2"
      shift 2
      ;;
    --no-fail)
      NO_FAIL=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "${CHANNEL}" ]]; then
  CHANNEL="$("${SCRIPT_DIR}/resolve-channel.sh")"
fi

if [[ -z "${FIXTURE}" ]]; then
  case "${GAME}" in
    sts2)
      FIXTURE="${SKILL_DIR}/resources/sts2-combat.json"
      if [[ -z "${PATCH}" && "${NO_PATCH}" -eq 0 ]]; then
        PATCH="${SKILL_DIR}/resources/sts2-patch.json"
      fi
      ;;
    sts1)
      FIXTURE="${SKILL_DIR}/resources/sts1-combat.json"
      ;;
    *)
      echo "Invalid --game '${GAME}' (expected 'sts2' or 'sts1')" >&2
      exit 1
      ;;
  esac
fi

if [[ "${NO_PATCH}" -eq 1 ]]; then
  PATCH=""
fi

if [[ -z "${OUT_DIR}" ]]; then
  OUT_DIR="/tmp/slay-the-relics-verify/$(date +%Y%m%d-%H%M%S)"
fi
mkdir -p "${OUT_DIR}"

pick_free_port() {
  python3 -c 'import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()'
}

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
cleanup() {
  if [[ "${STOPPING}" -eq 1 ]]; then
    return
  fi
  STOPPING=1
  for pid in "${PIDS[@]:-}"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill_tree "$pid"
    fi
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ "${REUSE_RUNNING}" -eq 1 ]]; then
  BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8888}"
  FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
else
  BACKEND_PORT="$(pick_free_port)"
  FRONTEND_PORT="$(pick_free_port)"
  BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
  FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

  BACKEND_LOG="${OUT_DIR}/backend.log"
  FRONTEND_LOG="${OUT_DIR}/frontend.log"

  echo "[verify] Starting ephemeral backend (DEV_MODE=true PUBSUB_MODE=sse) on ${BACKEND_URL}..."
  (
    cd "${BACKEND_DIR}"
    exec env \
      DEV_MODE=true \
      PUBSUB_MODE=sse \
      CLIENT_ID="${CLIENT_ID:-dev-client-id}" \
      LISTEN_ADDR="127.0.0.1:${BACKEND_PORT}" \
      PPROF_ADDR="127.0.0.1:0" \
      go run .
  ) >"${BACKEND_LOG}" 2>&1 &
  BACKEND_PID=$!
  PIDS+=("${BACKEND_PID}")

  BACKEND_READY=0
  for _ in $(seq 1 200); do
    if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
      echo "[verify] Backend exited early. Log:" >&2
      cat "${BACKEND_LOG}" >&2
      exit 1
    fi
    if (echo > "/dev/tcp/127.0.0.1/${BACKEND_PORT}") >/dev/null 2>&1; then
      BACKEND_READY=1
      break
    fi
    sleep 0.1
  done

  if [[ "${BACKEND_READY}" -ne 1 ]]; then
    echo "[verify] Timed out waiting for backend on ${BACKEND_URL}" >&2
    cat "${BACKEND_LOG}" >&2
    exit 1
  fi

  echo "[verify] Starting ephemeral Vite frontend on ${FRONTEND_URL}..."
  (
    cd "${FRONTEND_DIR}"
    exec env \
      BROWSER=none \
      VITE_PUBSUB_MODE=sse \
      VITE_HTTPS=false \
      VITE_PORT="${FRONTEND_PORT}" \
      VITE_BACKEND_URL="${BACKEND_URL}" \
      VITE_DEV_CHANNEL="${CHANNEL}" \
      ./node_modules/.bin/vite --host localhost --port "${FRONTEND_PORT}" --strictPort --open=false
  ) >"${FRONTEND_LOG}" 2>&1 &
  FRONTEND_PID=$!
  PIDS+=("${FRONTEND_PID}")

  FRONTEND_READY=0
  for _ in $(seq 1 150); do
    if ! kill -0 "${FRONTEND_PID}" 2>/dev/null; then
      echo "[verify] Frontend exited early. Log:" >&2
      cat "${FRONTEND_LOG}" >&2
      exit 1
    fi
    if curl -fsS "${FRONTEND_URL}/video_overlay.html" >/dev/null 2>&1; then
      FRONTEND_READY=1
      break
    fi
    sleep 0.1
  done

  if [[ "${FRONTEND_READY}" -ne 1 ]]; then
    echo "[verify] Timed out waiting for frontend on ${FRONTEND_URL}" >&2
    cat "${FRONTEND_LOG}" >&2
    exit 1
  fi
fi

echo "[verify] Seeding initial state (${FIXTURE}) for channel ${CHANNEL}..."
"${SCRIPT_DIR}/post-state.sh" "${FIXTURE}" \
  --backend "${BACKEND_URL}" \
  --channel "${CHANNEL}" >/dev/null

PAGE_URL="${FRONTEND_URL%/}/video_overlay.html?channel=${CHANNEL}"

if [[ "${SERVE_ONLY}" -eq 1 ]]; then
  echo ""
  echo "============================================================"
  echo " Slay the Relics Verification Server Ready (--serve-only)"
  echo "  Overlay URL: ${PAGE_URL}"
  echo "  Backend URL: ${BACKEND_URL} (DEV_MODE=true, PUBSUB_MODE=sse)"
  echo "  Channel ID:  ${CHANNEL}"
  echo "  Logs dir:    ${OUT_DIR}"
  echo "  Press Ctrl-C to stop."
  echo "============================================================"
  wait
  exit 0
fi

BROWSER_ARGS=(
  --url "${PAGE_URL}"
  --backend-url "${BACKEND_URL}"
  --channel "${CHANNEL}"
  --out-dir "${OUT_DIR}"
  --viewport "${VIEWPORT}"
)

if [[ -n "${PATCH}" ]]; then
  BROWSER_ARGS+=(--patch "${PATCH}")
fi
if [[ -n "${ACTIONS}" ]]; then
  BROWSER_ARGS+=(--actions "${ACTIONS}")
fi
if [[ -n "${CHROMIUM_BIN}" ]]; then
  BROWSER_ARGS+=(--chromium "${CHROMIUM_BIN}")
fi
if [[ "${NO_FAIL}" -eq 1 ]]; then
  BROWSER_ARGS+=(--no-fail)
fi
if [[ "${SKIP_DEFAULT_CHECKS}" -eq 1 ]]; then
  BROWSER_ARGS+=(--skip-default-checks)
fi

echo "[verify] Running Playwright browser verification..."
node "${SCRIPT_DIR}/verify-browser.mjs" "${BROWSER_ARGS[@]}"
