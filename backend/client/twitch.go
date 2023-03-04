package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	jwt2 "github.com/golang-jwt/jwt"
	"github.com/nicklaw5/helix"
	"net/http"
	"time"
)

type Twitch struct {
	client  *helix.Client
	timeout time.Duration
}

func New(clientID, clientSecret, ownerUserID, extensionSecret string) (*Twitch, error) {
	client, err := helix.NewClient(&helix.Options{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		ExtensionOpts: helix.ExtensionOptions{
			OwnerUserID: ownerUserID,
			Secret:      extensionSecret,
		},
	})

	if err != nil {
		return nil, err
	}

	t := &Twitch{
		client:  client,
		timeout: time.Second * 5,
	}

	err = t.setToken()
	if err != nil {
		return nil, err
	}

	return t, nil
}

func (t *Twitch) setToken() error {
	resp, err := t.client.RequestAppAccessToken([]string{})
	if err != nil {
		return err
	}
	t.client.SetAppAccessToken(resp.Data.AccessToken)
	return nil
}

func (t *Twitch) GetUser(ctx context.Context, login string) (helix.User, error) {
	ctx, cancel := context.WithTimeout(ctx, t.timeout)
	defer cancel()

	resp, err := t.client.GetUsers(&helix.UsersParams{
		Logins: []string{login},
	})
	if err != nil {
		return helix.User{}, err
	}

	if len(resp.Data.Users) == 0 {
		return helix.User{}, fmt.Errorf("twitch API returned no users with login: %s", login)
	}

	return resp.Data.Users[0], err
}

func (t *Twitch) PostExtensionPubSub(ctx context.Context, broadcasterID, message string) error {
	ctx, cancel := context.WithTimeout(ctx, t.timeout)
	defer cancel()

	expiresAt := time.Now().Add(time.Second * 10)
	jwt, err := t.client.ExtensionJWTSign(&helix.TwitchJWTClaims{
		UserID:    broadcasterID,
		ChannelID: broadcasterID,
		Role:      "external",

		Permissions: &helix.PubSubPermissions{
			Send: []helix.ExtensionPubSubPublishType{"broadcast"},
		},
		StandardClaims: jwt2.StandardClaims{
			ExpiresAt: expiresAt.Unix(),
		},
	})
	if err != nil {
		return err
	}

	reqBody := helix.ExtensionSendPubSubMessageParams{
		BroadcasterID:     broadcasterID,
		Message:           message,
		Target:            []helix.ExtensionPubSubPublishType{"broadcast"},
		IsGlobalBroadcast: false,
	}
	bs, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.twitch.tv/helix/extensions/pubsub", bytes.NewBuffer(bs))
	req.Header.Set("Authorization", "Bearer "+jwt)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Client-ID", "ebkycs9lir8pbic2r0b7wa6bg6n7ua")

	_, err = http.DefaultClient.Do(req)
	return err
}
