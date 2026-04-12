package api

import (
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/gin-gonic/gin"

	errors2 "github.com/MaT1g3R/slaytherelics/errors"
	"github.com/MaT1g3R/slaytherelics/o11y"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

const bearerPrefix = "Bearer"

// readBody reads the request body, decompressing gzip if Content-Encoding indicates it.
func readBody(c *gin.Context) ([]byte, error) {
	reader := c.Request.Body
	if strings.EqualFold(c.GetHeader("Content-Encoding"), "gzip") {
		gz, err := gzip.NewReader(reader)
		if err != nil {
			return nil, err
		}
		defer gz.Close()
		reader = gz
	}
	return io.ReadAll(reader)
}

func extractBearerToken(header string) (string, error) {
	if header == "" {
		return "", fmt.Errorf("authorization header is missing")
	}

	tok := strings.Fields(header)
	if len(tok) != 2 || !strings.EqualFold(tok[0], bearerPrefix) {
		return "", fmt.Errorf("invalid authorization header format")
	}
	return tok[1], nil
}

//nolint:funlen
func (a *API) postGameStateHandler(c *gin.Context) {
	var err error
	ctx, span := o11y.Tracer.Start(c.Request.Context(), "api: post game state")
	defer o11y.End(&span, &err)

	body, err := readBody(c)
	if err != nil {
		c.JSON(400, gin.H{"error": "failed to read request body"})
		return
	}

	var userID string

	// Dev mode: skip auth, use channel from body.
	if a.devMode {
		var channelEnvelope struct {
			Channel string `json:"channel"`
		}
		if err := json.Unmarshal(body, &channelEnvelope); err != nil || channelEnvelope.Channel == "" {
			c.JSON(400, gin.H{"error": "channel field is required"})
			return
		}
		userID = channelEnvelope.Channel
	} else {
		token, err := extractBearerToken(c.GetHeader("Authorization"))
		if err != nil {
			c.JSON(401, gin.H{"error": err.Error()})
			return
		}
		headerUserID := c.GetHeader("User-ID")
		if headerUserID == "" {
			c.JSON(401, gin.H{"error": "User-ID header is required"})
			return
		}

		user, err := a.users.AuthenticateRedis(ctx, headerUserID, token)
		authError := &errors2.AuthError{}
		if errors.As(err, &authError) {
			c.JSON(401, gin.H{"error": authError.Error()})
			return
		}
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		userID = user.ID
	}

	var gameState slaytherelics.GameState
	if err = json.Unmarshal(body, &gameState); err != nil {
		c.JSON(400, gin.H{"error": "invalid JSON"})
		return
	}
	if gameState.Channel != userID {
		c.JSON(403, gin.H{"error": "you can only post game state for your own channel"})
		return
	}

	err = a.gameStateManager.ReceiveUpdate(ctx, userID, gameState)
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("failed to post game state update: %v", err)})
		return
	}
	c.JSON(200, gin.H{"status": "success"})
}

func (a *API) getGameStateHandler(c *gin.Context) {
	var err error
	_, span := o11y.Tracer.Start(c.Request.Context(), "api: get game state")
	defer o11y.End(&span, &err)

	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	channel := c.Param("channel-id")
	if channel == "" {
		c.JSON(400, gin.H{"error": "channel-id parameter is required"})
		return
	}

	if gameState, ok := a.gameStateManager.GetGameState(channel); ok {
		c.JSON(200, gameState)
		return
	}
	c.JSON(404, gin.H{"error": "game state not found for the specified channel"})
}
