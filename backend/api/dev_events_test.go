package api

import (
	"bufio"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"gotest.tools/v3/assert"

	"github.com/MaT1g3R/slaytherelics/o11y"
	"github.com/MaT1g3R/slaytherelics/slaytherelics"
)

func TestDevEventsEndpointOnlyMountedWithLocalPubSub(t *testing.T) {
	cleanup, err := o11y.Init("test", "")
	assert.NilError(t, err)
	defer cleanup(context.Background())

	a, err := New(nil, nil, nil, nil, Options{DevMode: false})
	assert.NilError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/dev/events/12345", nil)
	rec := httptest.NewRecorder()
	a.Router.ServeHTTP(rec, req)
	assert.Equal(t, rec.Code, http.StatusNotFound)
}

func TestDevEventsStreamsBroadcastFrames(t *testing.T) {
	cleanup, err := o11y.Init("test", "")
	assert.NilError(t, err)
	defer cleanup(context.Background())

	hub := slaytherelics.NewLocalPubSub()
	gsm, err := slaytherelics.NewGameStateManager(hub)
	assert.NilError(t, err)

	a, err := New(nil, nil, nil, gsm, Options{DevMode: true, LocalPubSub: hub})
	assert.NilError(t, err)

	srv := httptest.NewServer(a.Router)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, srv.URL+"/api/dev/events/12345", nil)
	assert.NilError(t, err)

	resp, err := http.DefaultClient.Do(req)
	assert.NilError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, resp.StatusCode, http.StatusOK)
	assert.Check(t, strings.HasPrefix(resp.Header.Get("Content-Type"), "text/event-stream"))

	reader := bufio.NewReader(resp.Body)
	// First line should be the initial ": connected" comment so subscriber is registered
	line, err := reader.ReadString('\n')
	assert.NilError(t, err)
	assert.Equal(t, strings.TrimSpace(line), ": connected")

	// Publish a game state update through GameStateManager
	err = gsm.ReceiveUpdate(ctx, "12345", slaytherelics.GameState{
		Index:   0,
		Channel: "12345",
		Game:    "sts2",
		Boss:    "queen_boss",
	})
	assert.NilError(t, err)

	var eventLine, dataLine string
	for eventLine == "" || dataLine == "" {
		l, readErr := reader.ReadString('\n')
		assert.NilError(t, readErr)
		l = strings.TrimSpace(l)
		if strings.HasPrefix(l, "event:") {
			eventLine = l
		} else if strings.HasPrefix(l, "data:") {
			dataLine = l
		}
	}

	assert.Equal(t, eventLine, "event: broadcast")
	payload := strings.TrimSpace(strings.TrimPrefix(dataLine, "data:"))
	assert.Check(t, strings.HasPrefix(payload, "<~"))
	assert.Check(t, strings.HasSuffix(payload, "~>"))
}
