package o11y

import (
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

func Middleware(c *gin.Context) {
	var err error

	ctx, span := Tracer.Start(c.Request.Context(), "http.request", trace.WithSpanKind(trace.SpanKindServer))
	defer End(&span, &err)

	req := c.Request.WithContext(ctx)
	c.Request = req

	target := req.URL.Path
	method := req.Method
	contentLength := req.ContentLength

	span.SetAttributes(
		attribute.String("http.url", req.URL.String()),
		attribute.String("http.target", target),
		attribute.String("http.method", method),
		attribute.String("http.user_agent", req.UserAgent()),
		attribute.String("http.host", req.Host),
		attribute.String("http.scheme", req.URL.Scheme),
		attribute.Int64("http.request_content_length", contentLength),
	)

	c.Next()

	err = c.Err()
	status := c.Writer.Status()

	requestCounter, _ := Meter.Int64Counter("http.requests")
	requestHistogram, _ := Meter.Int64Histogram("http.requests.content_length")
	if requestCounter != nil {
		requestCounter.Add(ctx, 1,
			attribute.String("target", target),
			attribute.String("method", method),
			attribute.Int("status_code", status),
		)
	}
	if requestHistogram != nil {
		requestHistogram.Record(ctx, contentLength,
			attribute.String("target", target),
			attribute.String("method", method),
			attribute.Int("status_code", status),
		)
	}

	span.SetAttributes(attribute.Int("http.status_code", status))
}
