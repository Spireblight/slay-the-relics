#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
MOD_DIR="${ROOT_DIR}/sts2-mod/SlayTheRelicsExporter"
CSPROJ="${MOD_DIR}/SlayTheRelicsExporter.csproj"
PROPS_FILE="${MOD_DIR}/Directory.Build.props"
CONFIG="${CONFIGURATION:-Debug}"

extract_prop() {
  local prop="$1"
  [[ -f "${PROPS_FILE}" ]] || return 0
  sed -n "s|.*<${prop}>\\([^<]*\\)</${prop}>.*|\\1|p" "${PROPS_FILE}" | head -n 1
}

MODS_DIR="${STS2_MODS_DIR:-$(extract_prop STS2ModsDir)}"

if [[ -z "${MODS_DIR}" ]]; then
  for candidate in \
    "${HOME}/.local/share/Steam/steamapps/common/Slay the Spire 2" \
    "${HOME}/.steam/steam/steamapps/common/Slay the Spire 2" \
    "${HOME}/Library/Application Support/Steam/steamapps/common/Slay the Spire 2/SlayTheSpire2.app/Contents/MacOS"; do
    if [[ -d "${candidate}" ]]; then
      MODS_DIR="${candidate}/mods"
      break
    fi
  done
fi

if [[ -z "${MODS_DIR}" ]]; then
  echo "[sts2-mod] Could not locate local Slay the Spire 2 mods directory." >&2
  echo "[sts2-mod] Set STS2_MODS_DIR=/path/to/Slay the Spire 2/mods or add <STS2ModsDir> to sts2-mod/SlayTheRelicsExporter/Directory.Build.props." >&2
  exit 1
fi

mkdir -p "${MODS_DIR}/SlayTheRelicsExporter"

BUILD_ARGS=(-c "${CONFIG}" "-p:STS2ModsDir=${MODS_DIR}")
if [[ -n "${STS2_GAME_DIR:-}" ]]; then
  BUILD_ARGS+=("-p:STS2GameDir=${STS2_GAME_DIR}")
fi

dotnet build "${CSPROJ}" "${BUILD_ARGS[@]}" "$@"

DEPLOY_DIR="${MODS_DIR}/SlayTheRelicsExporter"
if [[ ! -f "${DEPLOY_DIR}/SlayTheRelicsExporter.dll" || ! -f "${DEPLOY_DIR}/mod_manifest.json" ]]; then
  echo "[sts2-mod] Build finished, but expected files were not deployed to ${DEPLOY_DIR}." >&2
  exit 1
fi

echo "[sts2-mod] Deployed SlayTheRelicsExporter.dll and mod_manifest.json to ${DEPLOY_DIR}"
