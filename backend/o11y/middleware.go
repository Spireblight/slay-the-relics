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

	span.SetAttributes(
		attribute.String("http.url", req.URL.String()),
		attribute.String("http.target", req.URL.Path),
		attribute.String("http.method", req.Method),
		attribute.String("http.user_agent", req.UserAgent()),
		attribute.String("http.host", req.Host),
		attribute.String("http.scheme", req.URL.Scheme),
		attribute.Int64("http.request_content_length", req.ContentLength),
	)

	c.Next()

	err = c.Err()
	status := c.Writer.Status()
	span.SetAttributes(attribute.Int("http.status_code", status))
}
