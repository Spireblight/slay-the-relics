#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <fixture.json> [--backend URL] [--channel ID] [--index N] [--gzip]" >&2
  exit 1
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
      BACKEND_URL="$2"
      shift 2
      ;;
    --channel)
      CHANNEL="$2"
      shift 2
      ;;
    --index)
      INDEX_OVERRIDE="$2"
      shift 2
      ;;
    --gzip)
      USE_GZIP=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

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
