package main

import (
	"context"
	"time"

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
	cancel = o11y.Init("slay-the-relics")

	ctx, span := o11y.Tracer.Start(ctx, "init")
	defer o11y.End(&span, &err)

	span.AddEvent("initializing",
		trace.WithAttributes(attribute.String("listen-addr", cfg.ListenAddr)),
	)

	twitchClient, err := client.New(
		ctx,
		cfg.ClientID,
		cfg.ClientSecret,
		cfg.OwnerUserID,
		cfg.ExtensionSecret,
	)
	if err != nil {
		return nil, cancel, err
	}

	users := slaytherelics.NewUsers(twitchClient)
	messages := slaytherelics.NewMessages(twitchClient)
	broadcaster, err := slaytherelics.NewBroadcaster(messages, 20, time.Second*3, time.Minute)
	if err != nil {
		return nil, cancel, err
	}

	span.AddEvent("starting server")
	a, err := api.New(twitchClient, users, broadcaster)
	return a, cancel, err
}
