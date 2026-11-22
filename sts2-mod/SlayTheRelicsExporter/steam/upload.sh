#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
MOD_DIR="$(CDPATH='' cd -- "${SCRIPT_DIR}/.." && pwd)"
CONTENT_DIR="${SCRIPT_DIR}/content"

dotnet build "${MOD_DIR}/SlayTheRelicsExporter.csproj" -c Release -p:STS2ModsDir=

cp "${MOD_DIR}/bin/Release/net9.0/SlayTheRelicsExporter.dll" "${CONTENT_DIR}/SlayTheRelicsExporter.dll"
cp "${MOD_DIR}/mod_manifest.json" "${CONTENT_DIR}/mod_manifest.json"

cd "${SCRIPT_DIR}"
ModUploader upload -w .
