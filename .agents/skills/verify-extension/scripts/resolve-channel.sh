#!/usr/bin/env bash
set -euo pipefail

DEFAULT_CHANNEL_ID="59817220"

if [[ -n "${CHANNEL_ID:-}" ]]; then
  printf '%s\n' "${CHANNEL_ID}"
  exit 0
fi

CONFIG_BASE="${STRE_CONFIG_DIR:-${XDG_CONFIG_HOME:-${HOME}/.config}}"
MOD_CONFIG_DIR="${CONFIG_BASE}/SlayTheRelicsExporter"

read_channel() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  if command -v jq >/dev/null 2>&1; then
    jq -r '.Channel // empty' "$file" 2>/dev/null || true
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json, sys
try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        val = json.load(f).get("Channel", "")
        if val:
            print(val)
except Exception:
    pass' "$file"
  fi
}

for cfg in "${MOD_CONFIG_DIR}/config.dev.json" "${MOD_CONFIG_DIR}/config.json"; do
  ch="$(read_channel "$cfg")"
  if [[ -n "$ch" ]]; then
    printf '%s\n' "$ch"
    exit 0
  fi
done

printf '%s\n' "${DEFAULT_CHANNEL_ID}"
