package slaytherelics

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
	"golang.org/x/crypto/bcrypt"

	"github.com/MaT1g3R/slaytherelics/client"
	errors2 "github.com/MaT1g3R/slaytherelics/errors"
	"github.com/MaT1g3R/slaytherelics/models"
	"github.com/MaT1g3R/slaytherelics/o11y"
)

type Users struct {
	twitch *client.Twitch
	rdb    *redis.Client

	redisUserAuthCache SyncMap[string, string]
}

func NewUsers(twitch *client.Twitch, rdb *redis.Client) *Users {
	return &Users{
		twitch:             twitch,
		rdb:                rdb,
		redisUserAuthCache: SyncMap[string, string]{},
	}
}

func (s *Users) Oauth(ctx context.Context, code string) (_ models.User, _ string, err error) {
	ctx, span := o11y.Tracer.Start(ctx, "users: oauth")
	defer o11y.End(&span, &err)

	oauthToken, err := s.twitch.GetOauthToken(ctx, code)
	if err != nil {
		return models.User{}, "", err
	}
	user, err := s.twitch.VerifyToken(ctx, oauthToken.Data.AccessToken)
	if err != nil {
		return models.User{}, "", err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(oauthToken.Data.AccessToken), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, "", err
	}
	user.Hash = string(hash)
	return user, oauthToken.Data.AccessToken, nil
}

func (s *Users) AuthenticateTwitch(ctx context.Context, code string) (user models.User, _ string, err error) {
	ctx, span := o11y.Tracer.Start(ctx, "users: authenticate twitch")
	defer o11y.End(&span, &err)
	authCounter, _ := o11y.Meter.Int64Counter("users.authenticate.twitch")
	defer func() {
		if authCounter != nil {
			authCounter.Add(ctx, 1,
				metric.WithAttributes(
					attribute.Bool("success", err == nil),
					attribute.String("user_login", user.Login),
					attribute.String("user_id", user.ID)),
			)
		}
	}()

	user, token, err := s.Oauth(ctx, code)
	if err != nil {
		return models.User{}, "", err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, "", err
	}
	user.Hash = string(hash)
	userBytes, err := json.Marshal(user)
	if err != nil {
		return models.User{}, "", err
	}

	err = s.rdb.Set(ctx, user.ID, userBytes, 0).Err()
	if err != nil {
		return user, token, err
	}

	s.redisUserAuthCache.Store(user.ID, token)
	return user, token, nil
}

func (s *Users) AuthenticateRedis(ctx context.Context, userID, token string) (user models.User, err error) {
	ctx, span := o11y.Tracer.Start(ctx, "users: authenticate redis")
	defer o11y.End(&span, &err)
	authCounter, _ := o11y.Meter.Int64Counter("users.authenticate.redis")
	defer func() {
		if authCounter != nil {
			authCounter.Add(ctx, 1,
				metric.WithAttributes(
					attribute.Bool("success", err == nil),
					attribute.String("user_login", user.Login),
					attribute.String("user_id", user.ID)),
			)
		}
	}()

	span.SetAttributes(attribute.String("user_id", userID))

	userBytes, err := s.rdb.Get(ctx, userID).Bytes()
	if errors.Is(err, redis.Nil) {
		return models.User{}, &errors2.AuthError{Err: errors.New("user not found")}
	}
	if err != nil {
		return models.User{}, err
	}
	user = models.User{}
	err = json.Unmarshal(userBytes, &user)
	if err != nil {
		return models.User{}, err
	}

	// Attempt to check for a cached token value.
	cachedToken, ok := s.redisUserAuthCache.Load(userID)
	if ok {
		if cachedToken == token {
			span.SetAttributes(attribute.String("user_login", user.Login))
			return user, nil
		}
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Hash), []byte(token))
	if err != nil {
		return models.User{}, &errors2.AuthError{Err: err}
	}

	// Successful authentication, so cache this token as a valid value.
	s.redisUserAuthCache.Store(userID, token)

	span.SetAttributes(attribute.String("user_login", user.Login))
	return user, nil
}
