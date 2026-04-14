package o11y

import (
	"context"
	"errors"
	"log" //nolint:depguard
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
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

func Init(serviceName, endpoint string) (func(context.Context), error) {
	if endpoint == "" {
		return func(context.Context) {}, nil
	}
	ctx := context.Background()

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
		),
	)
	if err != nil {
		return nil, err
	}

	// Set up a trace exporter
	traceExporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(endpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	// Register the trace exporter with a TracerProvider, using a batch
	// span processor to aggregate spans before export.
	bsp := sdktrace.NewBatchSpanProcessor(traceExporter)
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(bsp),
	)
	otel.SetTracerProvider(tracerProvider)

	// Set up a metric exporter
	metricExporter, err := otlpmetricgrpc.New(ctx,
		otlpmetricgrpc.WithEndpoint(endpoint),
		otlpmetricgrpc.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
	)
	otel.SetMeterProvider(meterProvider)

	// Set global propagator to tracecontext (the default is no-op).
	otel.SetTextMapPropagator(propagation.TraceContext{})

	Tracer = otel.Tracer(serviceName)
	Meter = otel.GetMeterProvider().Meter(serviceName)

	return func(ctx context.Context) {
		// Shutdown will flush any remaining spans/metrics and shut down the exporters.
		handleCtx, cancel := context.WithTimeout(ctx, time.Second*5)
		defer cancel()
		if err := tracerProvider.Shutdown(handleCtx); err != nil {
			log.Printf("failed to shutdown tracer provider: %v", err)
		}
		if err := meterProvider.Shutdown(handleCtx); err != nil {
			log.Printf("failed to shutdown meter provider: %v", err)
		}
	}, nil
}
