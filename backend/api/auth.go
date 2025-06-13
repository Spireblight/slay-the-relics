package api

import (
	"errors"

	"github.com/gin-gonic/gin"

	errors2 "github.com/MaT1g3R/slaytherelics/errors"
	"github.com/MaT1g3R/slaytherelics/o11y"
)

type AuthRequest struct {
	Code string `json:"code"`
}

func (a *API) Auth(c *gin.Context) {
	var err error
	ctx, span := o11y.Tracer.Start(c.Request.Context(), "api: auth")
	defer o11y.End(&span, &err)

	req := AuthRequest{}
	err = c.BindJSON(&req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user, token, err := a.users.AuthenticateTwitch(ctx, req.Code)
	authError := &errors2.AuthError{}
	if errors.As(err, &authError) {
		c.JSON(401, gin.H{"error": authError.Error()})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"user": user.ID, "token": token})
}

type LoginRequest struct {
	ID     string `json:"id"`
	Secret string `json:"secret"`
}

func (a *API) Login(c *gin.Context) {
	var err error
	ctx, span := o11y.Tracer.Start(c.Request.Context(), "api: login")
	defer o11y.End(&span, &err)

	req := LoginRequest{}
	err = c.BindJSON(&req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user, err := a.users.AuthenticateRedis(ctx, req.ID, req.Secret)
	authError := &errors2.AuthError{}

	if errors.As(err, &authError) {
		c.JSON(401, gin.H{"error": authError.Error()})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"user": user.Login})
}
