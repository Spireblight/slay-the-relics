//go:build tools

package tools

import (
	_ "github.com/golangci/golangci-lint/v2/cmd/golangci-lint"
	_ "github.com/rinchsan/gosimports/cmd/gosimports"
	_ "golang.org/x/perf/cmd/benchstat"
	_ "gotest.tools/gotestsum"
)
