package main

import (
	"context"
	"fmt"
	"net/http"
	_ "net/http/pprof" // nolint:gosec
	"strings"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"github.com/MaT1g3R/slaytherelics/api"
	"github.com/MaT1g3R/slaytherelics/client"
	"github.com/MaT1g3R/slaytherelics/config"
	"github.com/MaT1g3R/slaytherelics/o11y"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	a, cancel, err := initialize(ctx, cfg)
	defer cancel(ctx)
	if err != nil {
		panic(err)
	}

	err = a.Router.Run(cfg.ListenAddr)
	if err != nil {
		panic(err)
	}
}

func initialize(ctx context.Context, cfg config.Config) (_ *api.API, cancel func(context.Context), err error) {
	cancel, err = o11y.Init("slay-the-relics", cfg.OtelEndpoint)
	if err != nil {
		return nil, nil, err
	}

	ctx, span := o11y.Tracer.Start(ctx, "init")
	defer o11y.End(&span, &err)

	span.AddEvent("initializing",
		trace.WithAttributes(attribute.String("listen-addr", cfg.ListenAddr)),
	)

	span.AddEvent("starting pprof listener")
	setupPprofListener(cfg)

	twitchClient, err := client.New(
		cfg.ClientID,
		cfg.ClientSecret,
		cfg.OwnerUserID,
		cfg.ExtensionSecret,
	)
	if err != nil {
		return nil, cancel, err
	}

	rdb := client.NewRedis(cfg.RedisAddr)
	users := slaytherelics.NewUsers(twitchClient, rdb)
	publisher, localPubSub, err := newPublisher(cfg.PubSubMode, twitchClient)
	if err != nil {
		return nil, cancel, err
	}

	gameStateManager, err := slaytherelics.NewGameStateManager(publisher)
	if err != nil {
		return nil, cancel, err
	}

	span.AddEvent("starting server")
	a, err := api.New(
		twitchClient,
		users,
		gameStateManager,
		api.Options{DevMode: cfg.DevMode, LocalPubSub: localPubSub},
	)
	return a, cancel, err
}

func newPublisher(
	mode string,
	twitchClient *client.Twitch,
) (slaytherelics.Publisher, *slaytherelics.LocalPubSub, error) {
	switch strings.ToLower(strings.TrimSpace(mode)) {
	case "", "twitch":
		return twitchClient, nil, nil
	case "sse":
		localPubSub := slaytherelics.NewLocalPubSub()
		return localPubSub, localPubSub, nil
	default:
		return nil, nil, fmt.Errorf("invalid PUBSUB_MODE %q: expected \"twitch\" or \"sse\"", mode)
	}
}

// setupPprofListener runs a background listener for handling pprof requests. This is done separately from any other
// router to avoid middleware conflicts or auth confusion. This also allows us to easily expose this port locally for
// our debugging but not to the wider web.
func setupPprofListener(cfg config.Config) {
	go func() {
		_ = http.ListenAndServe(cfg.PprofAddr, nil) //nolint:gosec
	}()
}
