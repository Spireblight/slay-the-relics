#!/bin/sh

reportDir="test-reports"
mkdir -p "${reportDir}"
# -count=1 is used to forcibly disable test result caching
./bin/gotestsum --junitfile="${reportDir}/junit.xml" -- -count=1 "${@:-./...}"