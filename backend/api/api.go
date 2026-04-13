package api

import (
	"net/http"
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

	gameStateManager *slaytherelics.GameStateManager
	devMode          bool
}

type Options struct {
	DevMode bool
}

func New(
	t *client.Twitch,
	u *slaytherelics.Users,
	b *slaytherelics.Broadcaster,
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
		broadcaster:      b,
		gameStateManager: g,
		deckLists:        make(map[string]string),
		deckLock:         &sync.RWMutex{},
		devMode:          opt.DevMode,
	}

	r.POST("/", api.postOldMessageHandler)
	r.POST("/api/v1/auth", api.Auth)
	r.POST("/api/v1/message", api.postMessageHandler)
	r.GET("/deck/:name", api.getDeckHandler)

	r.POST("/api/v1/login", api.Login)
	r.POST("/api/v2/game-state", api.postGameStateHandler)
	r.GET("/api/v2/game-state/:channel-id", api.getGameStateHandler)
	return api, nil
}
