package o11y

import (
	"context"
	"errors"

	"github.com/uptrace/uptrace-go/uptrace"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
)

var Tracer trace.Tracer
var Meter metric.Meter

func End(span *trace.Span, err *error) {
	defer (*span).End()

	var actualErr error
	if err != nil {
		actualErr = *err
	}

	switch {
	case errors.Is(actualErr, context.Canceled) || errors.Is(actualErr, context.DeadlineExceeded):
		(*span).SetAttributes(
			attribute.String("result", "ok"),
			attribute.String("warning", actualErr.Error()),
		)
		(*span).SetStatus(codes.Ok, actualErr.Error())
	case actualErr != nil:
		(*span).SetAttributes(
			attribute.String("result", "err"),
			attribute.String("error", actualErr.Error()),
		)
		(*span).SetStatus(codes.Error, actualErr.Error())
	default:
		(*span).SetAttributes(
			attribute.String("result", "ok"),
		)
		(*span).SetStatus(codes.Ok, "")
	}
}

func Init(serviceName string) func(context.Context) {
	uptrace.ConfigureOpentelemetry(
		uptrace.WithServiceName(serviceName),
	)
	shutdown := func(ctx context.Context) { _ = uptrace.Shutdown(ctx) }
	Tracer = otel.Tracer(serviceName)
	Meter = otel.Meter(serviceName)

	return shutdown
}
