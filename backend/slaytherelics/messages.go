package slaytherelics

import (
	"context"
	"encoding/json"
	"github.com/MaT1g3R/slaytherelics/client"
	"github.com/google/uuid"
	"unicode/utf8"
)

type Messages struct {
	twitch *client.Twitch
}

func NewMessages(twitch *client.Twitch) *Messages {
	return &Messages{twitch: twitch}
}

func stringChunks(s string, chunkSize int) []string {
	var chunks []string
	for len(s) > chunkSize {
		i := chunkSize
		for i >= chunkSize-utf8.UTFMax && !utf8.RuneStart(s[i]) {
			i--
		}
		chunks = append(chunks, s[:i])
		s = s[i:]
	}
	if len(s) > 0 {
		chunks = append(chunks, s)
	}
	return chunks
}

func (m *Messages) SendMessage(ctx context.Context, broadcasterID string, messageType int, message map[string]any) error {
	msg := make([]any, 3, 3)
	msg[0] = 0
	msg[1] = messageType
	msg[2] = message

	bs, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	messageStr := string(bs)
	updateID := uuid.NewString()
	chunks := stringChunks(messageStr, 4000)
	numChunks := len(chunks)

	for i, chunk := range chunks {
		err := m.sendChunk(ctx, updateID, broadcasterID, i, numChunks, chunk)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *Messages) sendChunk(ctx context.Context, updateID, broadcasterID string, chunkID, chunkCount int, chunk string) error {
	msg := make([]any, 4, 4)
	msg[0] = chunkID
	msg[1] = chunkCount
	msg[2] = updateID
	msg[3] = chunk

	js, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	return m.twitch.PostExtensionPubSub(ctx, broadcasterID, string(js))
}
