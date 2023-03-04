package slaytherelics

import (
	"context"
	"log"
	"sync"
	"sync/atomic"
	"time"
)

const keepAlive = 5

var sentinel = struct{}{}

type SendTimeout struct {
	err error
}

func (s *SendTimeout) Error() string {
	return s.err.Error()
}

type PubSub interface {
	SendMessage(ctx context.Context, broadcasterID string, messageType int, message map[string]any) error
}

type Broadcaster struct {
	messages PubSub

	maxQueueSize      int
	keepAliveInterval time.Duration
	keepAliveTimeout  time.Duration

	senders sync.Map // map[string]*Sender
}

func NewBroadcaster(m PubSub, maxQueueSize int, keepAliveInterval, keepAliveTimeout time.Duration) *Broadcaster {
	return &Broadcaster{m, maxQueueSize, keepAliveInterval, keepAliveTimeout, sync.Map{}}
}

func (b *Broadcaster) Broadcast(ctx context.Context,
	delay time.Duration, broadcasterID string, messageType int, message map[string]any) error {
	s, ok := b.senders.LoadOrStore(broadcasterID, newSender(broadcasterID, b))
	sender := s.(*sender)
	if !ok {
		sender.init()
	}

	time.Sleep(delay)
	return sender.send(ctx, messageType, message)
}

type sender struct {
	// message type -> latest message
	state sync.Map

	broadcasterID string

	broadcaster *Broadcaster

	queue chan struct{}

	terminated atomic.Bool
}

func newSender(id string, b *Broadcaster) *sender {
	return &sender{
		state:         sync.Map{},
		broadcasterID: id,
		broadcaster:   b,
		terminated:    atomic.Bool{},
	}
}

func (s *sender) init() {
	s.queue = make(chan struct{}, s.broadcaster.maxQueueSize)
	go s.keepAliveWorker()
}

func (s *sender) terminate() {
	s.terminated.Store(true)
	s.broadcaster.senders.Delete(s.broadcasterID)
}

func (s *sender) keepAliveWorker() {
	ctx := context.Background()
	for {
		if s.terminated.Load() {
			return
		}
		log.Printf("keepalive worker for %s\n", s.broadcasterID)

		time.Sleep(s.broadcaster.keepAliveInterval)

		select {
		case <-s.queue:
			s.state.Range(func(typ, msg interface{}) bool {
				err := s.broadcaster.messages.SendMessage(ctx, s.broadcasterID, typ.(int), msg.(map[string]any))
				if err != nil {
					log.Println(err)
				}
				return true
			})
			continue
		case <-time.After(s.broadcaster.keepAliveTimeout):
			log.Printf("keepalive worker killed for %s\n", s.broadcasterID)
			s.terminate()
			return
		}
	}
}

func (s *sender) send(ctx context.Context, typ int, m map[string]any) error {
	if typ != keepAlive {
		s.state.Store(typ, m)
		return s.broadcaster.messages.SendMessage(ctx, s.broadcasterID, typ, m)
	}

	ctx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()

	select {
	case s.queue <- sentinel:
		return nil
	case <-ctx.Done():
		return &SendTimeout{ctx.Err()}
	}
}
