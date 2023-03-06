package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	jwt2 "github.com/golang-jwt/jwt"
	"github.com/gorilla/websocket"
	"github.com/nicklaw5/helix"

	errors2 "github.com/MaT1g3R/slaytherelics/errors"
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
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+jwt)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Client-ID", "ebkycs9lir8pbic2r0b7wa6bg6n7ua")

	resp, err := http.DefaultClient.Do(req)
	defer func() {
		_ = resp.Body.Close()
	}()
	return err
}

func parseMessage(message []byte) (string, error) {
	msg := strings.Split(string(message), "\r\n")

	for _, m := range msg {
		parts := strings.Split(m, " ")
		if len(parts) < 2 {
			continue
		}
		switch parts[1] {
		case "001":
			if len(parts) < 4 {
				continue
			}
			if parts[3] != ":Welcome," {
				continue
			}

			return parts[2], nil
		case "NOTICE":
			return "", &errors2.AuthError{Err: errors.New("failed to authenticate")}
		}
	}

	return "", nil
}

//nolint:funlen
func (t *Twitch) VerifyUserName(ctx context.Context,
	login string, secret string) (_ string, err error) {

	log.Printf("Authenticating via Twitch IRC for %s\n", login)
	ctx, cancel := context.WithTimeout(ctx, t.timeout)
	defer cancel()

	addr := "irc-ws.chat.twitch.tv:80"
	u := url.URL{Scheme: "ws", Host: addr, Path: "/"}
	c, resp, err := websocket.DefaultDialer.Dial(u.String(), nil)

	defer func() {
		cErr := resp.Body.Close()
		if err == nil && cErr != nil {
			err = cErr
		}
	}()
	defer func() {
		cErr := c.Close()
		if err == nil && cErr != nil {
			err = cErr
		}
	}()

	if err != nil {
		return "", err
	}

	username := make(chan string, 1)
	failed := make(chan error, 1)

	go func() {
		for {
			_, message, err := c.ReadMessage()
			if err != nil {
				failed <- err
				return
			}
			uName, err := parseMessage(message)
			if err != nil {
				failed <- err
				return
			}
			if uName != "" {
				username <- uName
				return
			}
		}
	}()
	if err := c.WriteMessage(websocket.TextMessage, []byte("PASS oauth:"+secret)); err != nil {
		return "", err
	}
	if err := c.WriteMessage(websocket.TextMessage, []byte("NICK "+login)); err != nil {
		return "", err
	}

	select {
	case err := <-failed:
		return "", err
	case u := <-username:
		return u, nil
	case <-ctx.Done():
		return "", &errors2.Timeout{Err: ctx.Err()}
	}
}
