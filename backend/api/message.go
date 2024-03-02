package api

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	errors2 "github.com/MaT1g3R/slaytherelics/errors"
	"github.com/MaT1g3R/slaytherelics/o11y"
)

func (a *API) postMessageHandler(c *gin.Context) {
	var err error
	ctx, span := o11y.Tracer.Start(c.Request.Context(), "api: post message")
	defer o11y.End(&span, &err)

	req := RequestMessage{}
	err = c.BindJSON(&req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	message := make(map[string]any)
	switch t := req.Message.(type) {
	case string:
		if len(t) != 0 {
			c.JSON(400, gin.H{})
			return
		}
	case map[string]any:
		message = t
	default:
		c.JSON(400, gin.H{})
		return
	}

	user, err := a.users.AuthenticateRedis(ctx, req.Streamer.Login, req.Streamer.Secret)
	authError := &errors2.AuthError{}
	if errors.As(err, &authError) {
		c.JSON(401, gin.H{"error": authError.Error()})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if req.MessageType == 4 {
		func() {
			a.deckLock.Lock()
			defer a.deckLock.Unlock()
			a.deckLists[strings.ToLower(user.Login)] = message["k"].(string)
		}()
	}
	err = a.broadcast(c, ctx, req, user.ID, message)
}

func (a *API) broadcast(c *gin.Context,
	ctx context.Context, req RequestMessage, userID string, message map[string]any) error {
	span := trace.SpanFromContext(ctx)
	span.AddEvent("broadcast", trace.WithAttributes(
		attribute.String("streamer", userID),
		attribute.Int("message_type", req.MessageType),
		attribute.Int("delay_ms", req.Delay),
	))

	err := a.broadcaster.Broadcast(ctx, time.Duration(req.Delay)*time.Millisecond, userID, req.MessageType, message)
	timeout := &errors2.Timeout{}
	if errors.As(err, &timeout) {
		c.Data(202, "application/json; charset=utf-8", []byte("Success\n"))
		return err
	}
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return err
	}
	c.Data(200, "application/json; charset=utf-8", []byte("Success\n"))
	return nil
}
