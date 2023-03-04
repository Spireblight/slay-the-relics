package slaytherelics

import (
	"context"
	"sync"

	"github.com/MaT1g3R/slaytherelics/client"
)

type Users struct {
	twitch *client.Twitch

	userIDCache map[string]string
	userIDMutex *sync.RWMutex
}

func NewUsers(twitch *client.Twitch) *Users {
	return &Users{
		twitch:      twitch,
		userIDCache: make(map[string]string),
		userIDMutex: &sync.RWMutex{},
	}
}

func (s *Users) GetUserID(ctx context.Context, login string) (string, error) {
	cacheResult, ok := func() (string, bool) {
		s.userIDMutex.RLock()
		defer s.userIDMutex.RUnlock()

		r, ok := s.userIDCache[login]
		return r, ok
	}()

	if ok {
		return cacheResult, nil
	}

	user, err := s.twitch.GetUser(ctx, login)
	if err != nil {
		return "", err
	}

	func() {
		s.userIDMutex.Lock()
		defer s.userIDMutex.Unlock()
		s.userIDCache[login] = user.ID
	}()

	return user.ID, err
}
