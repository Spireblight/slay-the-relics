#!/bin/sh

reportDir="test-reports"
mkdir -p "${reportDir}"
./bin/gotestsum --junitfile="${reportDir}/junit.xml" -- -count=1 "${@:-./...}"