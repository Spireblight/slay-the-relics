package config

import "github.com/alecthomas/kong"

type Config struct {
	ListenAddr      string `env:"LISTEN_ADDR" default:":8080"`
	ClientID        string `env:"CLIENT_ID"`
	ClientSecret    string `env:"CLIENT_SECRET"`
	OwnerUserID     string `env:"OWNER_USER_ID"`
	ExtensionSecret string `env:"EXTENSION_SECRET"`
	OtelEndpoint    string `env:"OTEL_EXPORTER_ENDPOINT"`
}

func Load() Config {
	config := Config{}
	kong.Parse(&config)
	return config
}
