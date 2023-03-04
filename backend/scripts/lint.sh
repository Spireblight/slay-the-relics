#!/bin/bash
lint() {
    ./bin/golangci-lint run "${@:-./...}"

    local files
    files=$(find . \( -name '*.go' -not -path "./tools/*" \))
    if [ -n "$(./bin/gosimports -local "github.com/MaT1g3R/slaytherelics" -d $files)" ]; then
        echo "Go imports check failed, please run make goimports"
        exit 1
    fi
}

lint "$@"