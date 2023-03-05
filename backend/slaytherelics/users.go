package slaytherelics

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"
	"sync"

	"github.com/MaT1g3R/slaytherelics/client"
)

type Users struct {
	twitch *client.Twitch

	userIDCache   sync.Map
	userAuthCache sync.Map
}

func NewUsers(twitch *client.Twitch) *Users {
	return &Users{
		twitch:      twitch,
		userIDCache: sync.Map{},
	}
}

func (s *Users) GetUserID(ctx context.Context, login string) (string, error) {
	cacheResult, ok := s.userIDCache.Load(login)

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

func (s *Users) UserAuth(ctx context.Context, login string, secret string) (bool, error) {
	secretHash := fmt.Sprintf("%x", sha256.Sum256([]byte(secret)))

	cacheResult, ok := s.userAuthCache.Load(login)
	if ok {
		gotSecretHash := cacheResult.(string)
		return secretHash == gotSecretHash, nil
	}

	user, err := s.twitch.VerifyUserName(ctx, login, secret)
	if err != nil {
		return false, err
	}
	if !strings.EqualFold(user, login) {
		return false, nil
	}

	s.userAuthCache.Store(login, secretHash)
	return true, nil
}
