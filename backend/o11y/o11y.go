package o11y

import (
	"context"
	"errors"
	"log/slog" //nolint:depguard
	"os"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
)

var Tracer trace.Tracer
var Meter metric.Meter

type customTracerProvider struct {
}

func (p customTracerProvider) Tracer(name string, opts ...trace.TracerOption) trace.Tracer {
	return customTracer{}
}

type customTracer struct {
}

func (t customTracer) Start(ctx context.Context,
	spanName string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
	config := trace.NewSpanStartConfig(opts...)
	startTime := config.Timestamp()
	if startTime.IsZero() {
		startTime = time.Now()
	}

	s := &Span{
		Span:       trace.SpanFromContext(ctx), // Maintain context link if any
		name:       spanName,
		startTime:  startTime,
		attributes: make(map[string]any),
	}

	for _, kv := range config.Attributes() {
		s.attributes[string(kv.Key)] = kv.Value.AsInterface()
	}

	return trace.ContextWithSpan(ctx, s), s
}

type Span struct {
	trace.Span
	name       string
	startTime  time.Time
	attributes map[string]any
	status     codes.Code
	statusMsg  string
}

func (s *Span) End(options ...trace.SpanEndOption) {
	duration := time.Since(s.startTime)
	attrs := make([]any, 0, len(s.attributes)*2+4)
	for k, v := range s.attributes {
		attrs = append(attrs, slog.Any(k, v))
	}
	attrs = append(attrs, slog.Duration("duration", duration))
	if s.status != codes.Unset {
		attrs = append(attrs, slog.String("status", s.status.String()))
		if s.statusMsg != "" {
			attrs = append(attrs, slog.String("status_message", s.statusMsg))
		}
	}

	//level := slog.LevelInfo
	if s.status == codes.Error {
		level := slog.LevelError
		slog.Log(context.Background(), level, "span: "+s.name, attrs...)
	}

	//slog.Log(context.Background(), level, "span: "+s.name, attrs...)
}

func (s *Span) SetAttributes(kv ...attribute.KeyValue) {
	for _, v := range kv {
		s.attributes[string(v.Key)] = v.Value.AsInterface()
	}
}

func (s *Span) SetStatus(code codes.Code, msg string) {
	s.status = code
	s.statusMsg = msg
}

func (s *Span) AddEvent(name string, opts ...trace.EventOption) {
	config := trace.NewEventConfig(opts...)
	attrs := make([]any, 0, len(config.Attributes())*2+1)
	for _, kv := range config.Attributes() {
		attrs = append(attrs, slog.Any(string(kv.Key), kv.Value.AsInterface()))
	}
	slog.Info("event: "+name, attrs...)
}

func (s *Span) IsRecording() bool {
	return true
}

func End(span *trace.Span, err *error) {
	var actualErr error
	if err != nil {
		actualErr = *err
	}

	s, ok := (*span).(*Span)
	if !ok {
		(*span).End()
		return
	}

	switch {
	case errors.Is(actualErr, context.Canceled) || errors.Is(actualErr, context.DeadlineExceeded):
		s.SetAttributes(
			attribute.String("result", "ok"),
			attribute.String("warning", actualErr.Error()),
		)
		s.SetStatus(codes.Ok, actualErr.Error())
	case actualErr != nil:
		s.SetAttributes(
			attribute.String("result", "err"),
			attribute.String("error", actualErr.Error()),
		)
		s.SetStatus(codes.Error, actualErr.Error())
	default:
		s.SetAttributes(
			attribute.String("result", "ok"),
		)
		s.SetStatus(codes.Ok, "")
	}
	s.End()
}

func Init(serviceName string) func(context.Context) {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	provider := customTracerProvider{}
	otel.SetTracerProvider(provider)

	Tracer = provider.Tracer(serviceName)
	Meter = otel.GetMeterProvider().Meter(serviceName)

	return func(ctx context.Context) {}
}
