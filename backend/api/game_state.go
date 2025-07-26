package api

import (
	"errors"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"

	errors2 "github.com/MaT1g3R/slaytherelics/errors"
	"github.com/MaT1g3R/slaytherelics/o11y"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

const bearerPrefix = "Bearer"

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

func (a *API) postGameStateHandler(c *gin.Context) {
	var err error
	ctx, span := o11y.Tracer.Start(c.Request.Context(), "api: post game state")
	defer o11y.End(&span, &err)
	token, err := extractBearerToken(c.GetHeader("Authorization"))
	if err != nil {
		c.JSON(401, gin.H{"error": err.Error()})
		return
	}
	userID := c.GetHeader("User-ID")
	if userID == "" {
		c.JSON(401, gin.H{"error": "User-ID header is required"})
		return
	}

	user, err := a.users.AuthenticateRedis(ctx, userID, token)
	authError := &errors2.AuthError{}
	if errors.As(err, &authError) {
		c.JSON(401, gin.H{"error": authError.Error()})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	var gameState slaytherelics.GameState
	if err := c.BindJSON(&gameState); err != nil {
		c.JSON(400, gin.H{"error": "invalid JSON"})
		return
	}
	if gameState.Channel != user.ID {
		c.JSON(403, gin.H{"error": "you can only post game state for your own channel"})
		return
	}

	err = a.gameStateManager.ReceiveUpdate(ctx, user.ID, gameState)
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

	gameState, ok := a.gameStateManager.GetGameState(channel)
	if !ok {
		c.JSON(404, gin.H{"error": "game state not found for the specified channel"})
		return
	}
	c.JSON(200, gameState)
}
