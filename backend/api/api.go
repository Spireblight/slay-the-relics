package api

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/MaT1g3R/slaytherelics/client"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

type API struct {
	Router *gin.Engine

	twitch   *client.Twitch
	users    *slaytherelics.Users
	messages *slaytherelics.Messages
}

func New(twitch *client.Twitch, users *slaytherelics.Users, messages *slaytherelics.Messages) *API {
	r := gin.Default()

	err := r.SetTrustedProxies(nil)
	if err != nil {
		log.Fatal(err)
		return nil
	}

	api := &API{
		Router: r,

		twitch:   twitch,
		users:    users,
		messages: messages,
	}

	r.POST("/", api.postMessageHandler)

	return api
}
