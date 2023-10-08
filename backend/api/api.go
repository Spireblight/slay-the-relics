package api

import (
	"github.com/gin-gonic/gin"

	"github.com/MaT1g3R/slaytherelics/client"
	"github.com/MaT1g3R/slaytherelics/o11y"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

type API struct {
	Router *gin.Engine

	twitch      *client.Twitch
	users       *slaytherelics.Users
	broadcaster *slaytherelics.Broadcaster
}

func New(t *client.Twitch, u *slaytherelics.Users, b *slaytherelics.Broadcaster) (*API, error) {
	r := gin.Default()
	r.Use(o11y.Middleware)

	err := r.SetTrustedProxies(nil)
	if err != nil {
		return nil, err
	}

	api := &API{
		Router: r,

		twitch:      t,
		users:       u,
		broadcaster: b,
	}

	r.POST("/", api.postOldMessageHandler)
	r.POST("/api/v1/auth", api.Auth)
	r.POST("/api/v1/message", api.postMessageHandler)

	return api, nil
}
