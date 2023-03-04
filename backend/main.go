package main

import (
	"log"
	"time"

	"github.com/MaT1g3R/slaytherelics/api"
	"github.com/MaT1g3R/slaytherelics/client"
	"github.com/MaT1g3R/slaytherelics/config"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

func main() {
	cfg := config.Load()

	twitchClient, err := client.New(
		cfg.ClientID,
		cfg.ClientSecret,
		cfg.OwnerUserID,
		cfg.ExtensionSecret,
	)
	if err != nil {
		log.Fatal(err)
	}

	users := slaytherelics.NewUsers(twitchClient)
	messages := slaytherelics.NewMessages(twitchClient)
	broadcaster := slaytherelics.NewBroadcaster(messages, 20, time.Second*3, time.Minute)
	a := api.New(twitchClient, users, broadcaster)

	err = a.Router.Run(cfg.ListenAddr)
	if err != nil {
		log.Fatal(err)
	}
}
