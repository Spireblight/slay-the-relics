package main

import (
	"github.com/MaT1g3R/slaytherelics/config"
	"log"

	"github.com/MaT1g3R/slaytherelics/api"
	"github.com/MaT1g3R/slaytherelics/client"
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
	a := api.New(twitchClient, users, messages)

	err = a.Router.Run(cfg.ListenAddr)
	if err != nil {
		log.Fatal(err)
	}
}
