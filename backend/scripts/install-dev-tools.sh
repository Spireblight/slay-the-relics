#!/bin/bash
install_go_bin() {
    local binDir="$PWD/bin"
    for pkg in "${@}"; do
        echo "${pkg}"
        (
          cd tools || exit
          GOBIN="${binDir}" go install "${pkg}"
        )
    done
}

install_devtools() {
    local tools=()
    while IFS='' read -r value; do
        tools+=("$value")
    done < <(grep _ tools/tools.go | awk -F'"' '{print $2}')

    install_go_bin "${tools[@]}"
}

install_devtools