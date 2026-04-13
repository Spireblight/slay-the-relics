package client

import (
	"github.com/redis/go-redis/v9"
)

func NewRedis(addr string) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:       addr,
		ClientName: "slay-the-relics",
	})
	return rdb
}
