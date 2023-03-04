package api

import (
	"errors"
	"log"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/MaT1g3R/slaytherelics/slaytherelics"
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

	streamer, err := a.users.GetUserID(ctx, req.Streamer.Login)
	if err != nil {
		log.Println(err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	err = a.broadcaster.Broadcast(ctx, time.Duration(req.Delay)*time.Millisecond, streamer, req.MessageType, message)
	timeout := &slaytherelics.SendTimeout{}
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
