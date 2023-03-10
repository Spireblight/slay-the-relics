package slaytherelics

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"strings"
	"sync"

	"go.opentelemetry.io/otel/attribute"
	"golang.org/x/exp/slices"

	"github.com/MaT1g3R/slaytherelics/client"
	errors2 "github.com/MaT1g3R/slaytherelics/errors"
	"github.com/MaT1g3R/slaytherelics/o11y"
)

type Users struct {
	twitch *client.Twitch

	userIDCache    sync.Map
	userAuthCache  sync.Map
	invalidSecrets sync.Map
}

func NewUsers(twitch *client.Twitch) *Users {
	return &Users{
		twitch:         twitch,
		userIDCache:    sync.Map{},
		userAuthCache:  sync.Map{},
		invalidSecrets: sync.Map{},
	}
}

func (s *Users) GetUserID(ctx context.Context, login string) (_ string, err error) {
	ctx, span := o11y.Tracer.Start(ctx, "users: get user id")
	defer o11y.End(&span, &err)
	span.SetAttributes(attribute.String("login", login))

	cacheCounter, _ := o11y.Meter.Int64Counter("cache.user_id")

	cacheResult, ok := s.userIDCache.Load(login)
	span.SetAttributes(attribute.Bool("cache_hit", ok))
	if cacheCounter != nil {
		cacheCounter.Add(ctx, 1, attribute.Bool("hit", ok), attribute.String("login", login))
	}

	if ok {
		return cacheResult.(string), nil
	}

	user, err := s.twitch.GetUser(ctx, login)
	if err != nil {
		return "", err
	}

	s.userIDCache.Store(login, user.ID)

	return user.ID, err
}

func (s *Users) UserAuth(ctx context.Context, login string, secret string) (_ bool, err error) {
	ctx, span := o11y.Tracer.Start(ctx, "users: auth")
	defer o11y.End(&span, &err)
	span.SetAttributes(attribute.String("login", login))

	cacheCounter, _ := o11y.Meter.Int64Counter("cache.user_auth")

	secretHash := fmt.Sprintf("%x", sha256.Sum256([]byte(secret)))

	invalidSecrets, _ := s.invalidSecrets.LoadOrStore(login, []string{})
	if slices.Contains(invalidSecrets.([]string), secretHash) {
		if cacheCounter != nil {
			cacheCounter.Add(ctx, 1, attribute.Bool("invalid_secret_hit", true), attribute.String("login", login))
		}
		span.SetAttributes(attribute.Bool("invalid_secret", true))
		return false, nil
	}

	cacheResult, ok := s.userAuthCache.Load(login)
	if cacheCounter != nil {
		cacheCounter.Add(ctx, 1, attribute.Bool("hit", ok), attribute.String("login", login))
	}
	span.SetAttributes(attribute.Bool("cache_hit", ok))
	if ok {
		gotSecretHash := cacheResult.(string)
		return secretHash == gotSecretHash, nil
	}

	user, err := s.twitch.GetUsernameFromSecret(ctx, login, secret)
	authErr := &errors2.AuthError{}
	if errors.As(err, &authErr) {
		if cacheCounter != nil {
			cacheCounter.Add(ctx, 1, attribute.Bool("invalid_secret_hit", false), attribute.String("login", login))
		}
		s.invalidSecrets.Store(login, append(invalidSecrets.([]string), secretHash))
	}

	if err != nil {
		return false, err
	}

	span.SetAttributes(attribute.String("user", user))

	if !strings.EqualFold(user, login) {
		span.SetAttributes(attribute.Bool("mismatch_username", true))
		if cacheCounter != nil {
			cacheCounter.Add(ctx, 1, attribute.Bool("invalid_secret_hit", false), attribute.String("login", login))
		}
		s.invalidSecrets.Store(login, append(invalidSecrets.([]string), secretHash))
		return false, nil
	}

	s.userAuthCache.Store(login, secretHash)
	return true, nil
}
