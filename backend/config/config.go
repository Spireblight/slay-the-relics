package config

import "github.com/alecthomas/kong"

type Config struct {
	ListenAddr      string `env:"LISTEN_ADDR" default:":8888"`
	PprofAddr       string `env:"PPROF_ADDR" default:":8081"`
	ClientID        string `env:"CLIENT_ID"`
	ClientSecret    string `env:"CLIENT_SECRET"`
	OwnerUserID     string `env:"OWNER_USER_ID"`
	ExtensionSecret string `env:"EXTENSION_SECRET"`
	OtelEndpoint    string `env:"OTEL_EXPORTER_ENDPOINT"`
	RedisAddr       string `env:"REDIS_ADDR" default:"localhost:6379"`
	DevMode         bool   `env:"DEV_MODE" default:"false"`
	PubSubMode      string `env:"PUBSUB_MODE" default:"twitch"`
}

func Load() Config {
	config := Config{}
	kong.Parse(&config)
	return config
}
