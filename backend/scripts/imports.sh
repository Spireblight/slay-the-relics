#!/bin/bash
run_goimports () {
  local files
  files=$(find . \( -name '*.go' -not -path "./tools/*" \))
  ./bin/gosimports -local "github.com/MaT1g3R/slaytherelics" -w $files
}

run_goimports