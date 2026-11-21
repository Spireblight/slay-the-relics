package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"time"

	jwt2 "github.com/golang-jwt/jwt"
	"github.com/nicklaw5/helix"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"

	errors2 "github.com/MaT1g3R/slaytherelics/errors"
	"github.com/MaT1g3R/slaytherelics/models"
	"github.com/MaT1g3R/slaytherelics/o11y"
)

type Twitch struct {
	client       *helix.Client
	httpClient   *http.Client
	timeout      time.Duration
	clientID     string
	clientSecret string
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

	return &Twitch{
		client:       client,
		timeout:      time.Second * 5,
		clientID:     clientID,
		clientSecret: clientSecret,
		httpClient: &http.Client{
			Timeout: time.Second * 5,
		},
	}, nil
}

//nolint:funlen
func (t *Twitch) PostExtensionPubSub(ctx context.Context, broadcasterID, message string) (err error) {
	ctx, span := o11y.Tracer.Start(ctx, "twitch: post extension pubsub")
	defer o11y.End(&span, &err)
	span.SetAttributes(attribute.String("broadcaster_id", broadcasterID))

	counter, _ := o11y.Meter.Int64Counter("twitch.post_extension_pubsub.count")

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
	req.Header.Set("Client-ID", t.clientID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		if counter != nil {
			counter.Add(
				ctx, 1,
				metric.WithAttributes(
					attribute.String("error", err.Error()),
					attribute.Int("status_code", -1),
					attribute.String("broadcaster_id", broadcasterID),
				),
			)
		}
		return err
	}
	defer func() {
		_ = resp.Body.Close()
	}()
	if counter != nil {
		counter.Add(
			ctx, 1,
			metric.WithAttributes(
				attribute.String("error", ""),
				attribute.Int("status_code", resp.StatusCode),
				attribute.String("broadcaster_id", broadcasterID)),
		)
	}

	span.SetAttributes(attribute.Int("http.status_code", resp.StatusCode))
	if resp.StatusCode > 399 {
		msg, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		span.SetAttributes(attribute.String("error_message", string(msg)))
		return errors.New(string(msg))
	}

	return err
}

func (t *Twitch) GetOauthToken(ctx context.Context, code string) (_ helix.UserAccessTokenResponse, err error) {
	ctx, span := o11y.Tracer.Start(ctx, "twitch: get access token")
	defer o11y.End(&span, &err)

	res := helix.UserAccessTokenResponse{}
	body := url.Values{}
	body.Set("client_id", t.clientID)
	body.Set("client_secret", t.clientSecret)
	body.Set("code", code)
	body.Set("grant_type", "authorization_code")
	body.Set("redirect_uri", "http://localhost:49000")

	req, err := http.NewRequestWithContext(ctx, "POST", "https://id.twitch.tv/oauth2/token", bytes.NewBufferString(body.Encode()))
	if err != nil {
		return res, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := t.httpClient.Do(req)
	if err != nil {
		return res, err
	}
	defer func() {
		cErr := resp.Body.Close()
		if err == nil && cErr != nil {
			err = cErr
		}
	}()
	if resp.StatusCode > 399 && resp.StatusCode < 500 {
		s, _ := io.ReadAll(resp.Body)
		return res, &errors2.AuthError{Err: errors.New(string(s))}
	} else if resp.StatusCode > 499 {
		return res, errors.New("unknown error")
	}
	err = json.NewDecoder(resp.Body).Decode(&res.Data)
	return res, err
}

func (t *Twitch) VerifyToken(ctx context.Context, token string) (_ models.User, err error) {
	ctx, span := o11y.Tracer.Start(ctx, "twitch: verify token")
	defer o11y.End(&span, &err)

	req, err := http.NewRequestWithContext(ctx, "GET", "https://id.twitch.tv/oauth2/validate", nil)
	if err != nil {
		return models.User{}, err
	}
	req.Header.Set("Authorization", "OAuth "+token)
	resp, err := t.httpClient.Do(req)
	if err != nil {
		return models.User{}, err
	}
	defer func() {
		cErr := resp.Body.Close()
		if err == nil && cErr != nil {
			err = cErr
		}
	}()
	if resp.StatusCode > 399 && resp.StatusCode < 500 {
		s, _ := io.ReadAll(resp.Body)
		return models.User{}, &errors2.AuthError{Err: errors.New(string(s))}
	} else if resp.StatusCode > 499 {
		return models.User{}, errors.New("unknown error")
	}

	res := helix.ValidateTokenResponse{}
	err = json.NewDecoder(resp.Body).Decode(&res.Data)
	if err != nil {
		return models.User{}, err
	}
	return models.User{
		Login: res.Data.Login,
		ID:    res.Data.UserID,
	}, nil
}
