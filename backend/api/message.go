package api

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
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

	time.Sleep(time.Duration(req.Delay) * time.Millisecond)
	err = a.messages.SendMessage(ctx, streamer, req.MessageType, message)
	if err != nil {
		log.Println(err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{})
}
