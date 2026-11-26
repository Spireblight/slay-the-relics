#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"

usage() {
  cat <<'EOF'
Usage: post-state.sh <fixture.json> [options]

Options:
  --backend <url>   Backend base URL (default: $BACKEND_URL or http://127.0.0.1:8888)
  --channel <id>    Override Twitch channel ID (default: auto-detected)
  --index <n>       Override gameStateIndex with integer N
  --gzip            Send request body gzip-compressed
  -h, --help        Show this help
EOF
}

require_arg() {
  if [[ $# -lt 2 || -z "$2" ]]; then
    echo "Option '$1' requires a value" >&2
    usage >&2
    exit 1
  fi
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

FIXTURE="$1"
shift

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8888}"
CHANNEL=""
INDEX_OVERRIDE=""
USE_GZIP=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend)
      require_arg "$@"
      BACKEND_URL="$2"
      shift 2
      ;;
    --channel)
      require_arg "$@"
      CHANNEL="$2"
      shift 2
      ;;
    --index)
      require_arg "$@"
      INDEX_OVERRIDE="$2"
      shift 2
      ;;
    --gzip)
      USE_GZIP=1
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

if [[ -n "${INDEX_OVERRIDE}" && ! "${INDEX_OVERRIDE}" =~ ^-?[0-9]+$ ]]; then
  echo "Invalid --index '${INDEX_OVERRIDE}' (expected an integer)" >&2
  exit 1
fi

if [[ -z "${CHANNEL}" ]]; then
  CHANNEL="$("${SCRIPT_DIR}/resolve-channel.sh")"
fi

if [[ ! -f "${FIXTURE}" ]]; then
  echo "Fixture not found: ${FIXTURE}" >&2
  exit 1
fi

PAYLOAD="$(python3 - "${FIXTURE}" "${CHANNEL}" "${INDEX_OVERRIDE}" <<'PY'
import json, sys
fixture, channel, idx = sys.argv[1], sys.argv[2], sys.argv[3]
with open(fixture, "r", encoding="utf-8") as f:
    data = json.load(f)
data["channel"] = channel
if idx != "":
    data["gameStateIndex"] = int(idx)
print(json.dumps(data))
PY
)"

ENDPOINT="${BACKEND_URL%/}/api/v2/game-state"

if [[ "${USE_GZIP}" -eq 1 ]]; then
  printf '%s' "${PAYLOAD}" | gzip -c | curl -fsS -X POST "${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "Content-Encoding: gzip" \
    --data-binary @-
else
  curl -fsS -X POST "${ENDPOINT}" \
    -H "Content-Type: application/json" \
    --data-raw "${PAYLOAD}"
fi
printf '\n'
