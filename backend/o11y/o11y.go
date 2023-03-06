package o11y

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var Tracer trace.Tracer

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

func Init(ctx context.Context, serviceName, otelEndpoint string) (func(), error) {
	shutdown := func() {}

	exp, err := newExporter(ctx, otelEndpoint)
	if err != nil {
		return shutdown, err
	}

	tp, err := newTraceProvider(exp, serviceName)
	if err != nil {
		return shutdown, err
	}

	shutdown = func() { _ = tp.Shutdown(ctx) }
	otel.SetTracerProvider(tp)

	Tracer = tp.Tracer(serviceName)
	return shutdown, nil
}

func newExporter(ctx context.Context, otelEndpoint string) (sdktrace.SpanExporter, error) {
	if otelEndpoint == "" {
		return stdouttrace.New(
			stdouttrace.WithWriter(os.Stderr),
		)
	}

	ctx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()

	conn, err := grpc.DialContext(ctx, otelEndpoint,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create gRPC connection to collector: %w", err)
	}
	traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
	if err != nil {
		return nil, fmt.Errorf("failed to create trace exporter: %w", err)
	}
	return traceExporter, nil
}

func newTraceProvider(exp sdktrace.SpanExporter, serviceName string) (*sdktrace.TracerProvider, error) {
	// Ensure default SDK resources and the required service name are set.
	r, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(serviceName),
		),
	)

	if err != nil {
		return nil, err
	}

	return sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(r),
	), nil
}
