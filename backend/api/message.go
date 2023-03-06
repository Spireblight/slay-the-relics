package api

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	errors2 "github.com/MaT1g3R/slaytherelics/errors"
)

type RequestMessage struct {
	MessageType int `json:"msg_type"`
	Streamer    struct {
		Login  string `json:"login"`
		Secret string `json:"secret"`
	} `json:"streamer"`
	Metadata map[string]any `json:"meta"`
	Delay    int            `json:"delay"`
	Message  any            `json:"message"`
}

func (a *API) authenticate(c *gin.Context, ctx context.Context, login, secret string) (string, error) {
	if login == "" || secret == "" {
		err := &errors2.AuthError{Err: errors.New("missing login or secret")}
		c.JSON(400, gin.H{"error": err.Error()})
		return "", err
	}

	auth, err := a.users.UserAuth(ctx, login, secret)
	authError := &errors2.AuthError{}
	if errors.As(err, &authError) {
		c.JSON(401, gin.H{"error": authError.Error()})
		return "", err
	}
	if err != nil {
		log.Println(err)
		c.JSON(500, gin.H{"error": err.Error()})
		return "", err
	}
	if !auth {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return "", err
	}

	streamer, err := a.users.GetUserID(ctx, login)
	if err != nil {
		log.Println(err)
		c.JSON(500, gin.H{"error": err.Error()})
		return "", err
	}
	return streamer, nil
}

func (a *API) postMessageHandler(c *gin.Context) {
	ctx := c.Request.Context()

	req := RequestMessage{}
	err := c.BindJSON(&req)
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

	login := strings.ToLower(req.Streamer.Login)
	streamer, err := a.authenticate(c, ctx, login, req.Streamer.Secret)
	if err != nil {
		return
	}

	err = a.broadcaster.Broadcast(ctx, time.Duration(req.Delay)*time.Millisecond, streamer, req.MessageType, message)
	timeout := &errors2.Timeout{}
	if errors.As(err, &timeout) {
		c.JSON(429, gin.H{"error": err.Error()})
		return
	}

	if err != nil {
		log.Println(err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{})
}
