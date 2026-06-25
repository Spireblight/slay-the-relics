#!/bin/sh

cp "$HOME/.steam/steam/steamapps/common/Slay the Spire 2/mods/SlayTheRelicsExporter"/* ./content

ModUploader upload -w .
