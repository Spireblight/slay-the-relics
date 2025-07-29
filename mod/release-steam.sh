#!/bin/sh

set -xe

pandoc -t "bbcode_steam.lua" -f "markdown_github" ../README.md > output.bbcode
cd steam || exit 1
rm -f ./content/SlayTheRelicsExporter.jar
cp ../build/libs/SlayTheRelicsExporter.jar ./content/SlayTheRelicsExporter.jar
python3 -c '
import json
with open("config-template.json") as f:
    data = json.load(f)
with open("../output.bbcode") as f:
    des = f.read()
data["description"] = des
with open("config.json", "w+") as f:
    json.dump(data, f, indent=2)
'
java -jar ~/.steam/steam/steamapps/common/SlayTheSpire/mod-uploader.jar upload -w .
rm -f ../output.bbcode
