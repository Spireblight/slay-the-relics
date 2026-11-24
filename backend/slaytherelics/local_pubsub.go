package slaytherelics

import (
	"context"
	"sync"
)

// Publisher sends compressed extension broadcast messages for a broadcaster channel.
type Publisher interface {
	PostExtensionPubSub(ctx context.Context, broadcasterID, message string) error
}

// LocalPubSub is an in-process Publisher for local development that fans out
// compressed broadcast frames to subscribed SSE clients instead of Twitch PubSub.
type LocalPubSub struct {
	mu          sync.RWMutex
	subscribers map[string]map[chan string]struct{}
}

func NewLocalPubSub() *LocalPubSub {
	return &LocalPubSub{
		subscribers: make(map[string]map[chan string]struct{}),
	}
}

func (p *LocalPubSub) Subscribe(channelID string) (<-chan string, func()) {
	ch := make(chan string, 16)

	p.mu.Lock()
	if p.subscribers[channelID] == nil {
		p.subscribers[channelID] = make(map[chan string]struct{})
	}
	p.subscribers[channelID][ch] = struct{}{}
	p.mu.Unlock()

	unsubscribe := func() {
		p.mu.Lock()
		if subs, ok := p.subscribers[channelID]; ok {
			delete(subs, ch)
			if len(subs) == 0 {
				delete(p.subscribers, channelID)
			}
		}
		p.mu.Unlock()
	}

	return ch, unsubscribe
}

func (p *LocalPubSub) PostExtensionPubSub(_ context.Context, broadcasterID, message string) error {
	p.mu.RLock()
	defer p.mu.RUnlock()

	for ch := range p.subscribers[broadcasterID] {
		select {
		case ch <- message:
		default:
		}
	}
	return nil
}
