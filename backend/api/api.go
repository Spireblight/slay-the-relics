package api

import (
	"sync"

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

	deckLists map[string]string
	deckLock  *sync.RWMutex
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
		deckLists:   make(map[string]string),
		deckLock:    &sync.RWMutex{},
	}

	r.POST("/", api.postOldMessageHandler)
	r.POST("/api/v1/auth", api.Auth)
	r.POST("/api/v1/message", api.postMessageHandler)
	r.GET("/deck/:name", api.getDeckHandler)
	return api, nil
}
