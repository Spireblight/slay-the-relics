package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/MaT1g3R/slaytherelics/client"
	"github.com/MaT1g3R/slaytherelics/o11y"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

type API struct {
	Router *gin.Engine

	twitch *client.Twitch
	users  *slaytherelics.Users

	gameStateManager *slaytherelics.GameStateManager
	localPubSub      *slaytherelics.LocalPubSub
	devMode          bool
}

type Options struct {
	DevMode     bool
	LocalPubSub *slaytherelics.LocalPubSub
}

func New(
	t *client.Twitch,
	u *slaytherelics.Users,
	g *slaytherelics.GameStateManager,
	opts ...Options,
) (*API, error) {
	r := gin.New()
	loggerConfig := gin.LoggerConfig{}
	loggerConfig.Skip = func(c *gin.Context) bool {
		if c.Writer.Status() == http.StatusNotFound {
			return true
		}
		return c.Writer.Status() < http.StatusBadRequest
	}

	r.Use(gin.LoggerWithConfig(loggerConfig))
	r.Use(gin.Recovery())
	r.Use(o11y.Middleware)

	err := r.SetTrustedProxies(nil)
	if err != nil {
		return nil, err
	}

	var opt Options
	if len(opts) > 0 {
		opt = opts[0]
	}

	api := &API{
		Router: r,

		twitch:           t,
		users:            u,
		gameStateManager: g,
		localPubSub:      opt.LocalPubSub,
		devMode:          opt.DevMode,
	}

	r.POST("/api/v1/auth", api.Auth)
	r.POST("/api/v2/game-state", api.postGameStateHandler)
	r.GET("/api/v2/game-state/:channel-id", api.getGameStateHandler)
	if api.localPubSub != nil {
		r.GET("/api/dev/events/:channel-id", api.devEventsHandler)
	}
	return api, nil
}
