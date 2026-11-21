package slaytherelics

import (
	"context"
	"testing"

	"gotest.tools/v3/assert"
)

func TestLocalPubSubFanOutAndUnsubscribe(t *testing.T) {
	hub := NewLocalPubSub()

	ch1, unsub1 := hub.Subscribe("chan1")
	ch2, unsub2 := hub.Subscribe("chan1")
	chOther, unsubOther := hub.Subscribe("chan2")
	defer unsub2()
	defer unsubOther()

	err := hub.PostExtensionPubSub(context.Background(), "chan1", "<~payload1~>")
	assert.NilError(t, err)

	assert.Equal(t, <-ch1, "<~payload1~>")
	assert.Equal(t, <-ch2, "<~payload1~>")

	select {
	case msg := <-chOther:
		t.Fatalf("unexpected message for chan2: %q", msg)
	default:
	}

	unsub1()

	err = hub.PostExtensionPubSub(context.Background(), "chan1", "<~payload2~>")
	assert.NilError(t, err)

	assert.Equal(t, <-ch2, "<~payload2~>")
	select {
	case msg := <-ch1:
		t.Fatalf("unsubscribed channel still received message: %q", msg)
	default:
	}
}

func TestGameStateManagerPublishesToLocalPubSub(t *testing.T) {
	hub := NewLocalPubSub()
	gsm, err := NewGameStateManager(hub)
	assert.NilError(t, err)

	ch, unsub := hub.Subscribe("12345")
	defer unsub()

	err = gsm.ReceiveUpdate(context.Background(), "12345", GameState{
		Index:   0,
		Channel: "12345",
		Game:    "sts2",
		Boss:    "queen_boss",
	})
	assert.NilError(t, err)

	frame := <-ch
	assert.Check(t, len(frame) > 4)
	assert.Equal(t, frame[:2], "<~")
	assert.Equal(t, frame[len(frame)-2:], "~>")
}
