package slaytherelics

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/ascii85"
	"encoding/json"
	"fmt"
	"reflect"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"

	"github.com/MaT1g3R/slaytherelics/client"
	"github.com/MaT1g3R/slaytherelics/o11y"
)

type CardData any

func CardName(c CardData) string {
	switch v := c.(type) {
	case string:
		return v
	case []any:
		return v[0].(string)
	default:
		return fmt.Sprintf("%v", v)
	}
}

type HitBox struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
	Z float64 `json:"z"`
}

type Tip struct {
	Header      string `json:"header"`
	Description string `json:"description"`
	Img         string `json:"img"`
}

type TipsBox struct {
	Tips   []Tip  `json:"tips"`
	HitBox HitBox `json:"hitbox"`
}

type MapNode struct {
	Type    string `json:"type"`
	Parents []int  `json:"parents"`
}

type GameState struct {
	Index   int    `json:"gameStateIndex"`
	Channel string `json:"channel"`

	Character      string        `json:"character"`
	Boss           string        `json:"boss"`
	Relics         []string      `json:"relics"`
	BaseRelicStats map[int][]any `json:"baseRelicStats"`
	RelicTips      []Tip         `json:"relicTips"`
	Deck           []CardData    `json:"deck"`
	Potions        []string      `json:"potions"`
	AdditionalTips []TipsBox     `json:"additionalTips"`
	StaticTips     []TipsBox     `json:"staticTips"`
	MapNodes       [][]MapNode   `json:"mapNodes"`
	MapPath        [][]int       `json:"mapPath"`
	Bottles        []int         `json:"bottles"`

	DrawPile    []CardData `json:"drawPile"`
	DiscardPile []CardData `json:"discardPile"`
	ExhaustPile []CardData `json:"exhaustPile"`
}

type GameStateUpdate struct {
	Index   int    `json:"gameStateIndex"`
	Channel string `json:"channel"`

	Character      *string        `json:"character"`
	Boss           *string        `json:"boss"`
	Relics         *[]string      `json:"relics"`
	BaseRelicStats *map[int][]any `json:"baseRelicStats"`
	RelicTips      *[]Tip         `json:"relicTips"`
	Deck           *[]CardData    `json:"deck"`
	Potions        *[]string      `json:"potions"`
	AdditionalTips *[]TipsBox     `json:"additionalTips"`
	StaticTips     *[]TipsBox     `json:"staticTips"`
	MapNodes       *[][]MapNode   `json:"mapNodes"`
	MapPath        *[][]int       `json:"mapPath"`
	Bottles        *[]int         `json:"bottles"`

	DrawPile    *[]CardData `json:"drawPile"`
	DiscardPile *[]CardData `json:"discardPile"`
	ExhaustPile *[]CardData `json:"exhaustPile"`
}

type GameStateManager struct {
	tw *client.Twitch

	GameStates map[string]GameState

	compressedSizeHistogram metric.Int64Histogram
}

func NewGameStateManager(tw *client.Twitch) (*GameStateManager, error) {
	hist, err := o11y.Meter.Int64Histogram("game_state.compressed_size")
	if err != nil {
		return nil, err
	}
	return &GameStateManager{
		tw:                      tw,
		GameStates:              make(map[string]GameState),
		compressedSizeHistogram: hist,
	}, nil
}

func compressJson(data any) (_ string, err error) {
	// marshal the data to JSON then compress it with gzip
	js, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal data to JSON: %w", err)
	}
	var buf bytes.Buffer
	w, err := gzip.NewWriterLevel(&buf, gzip.BestCompression)
	if err != nil {
		return "", fmt.Errorf("failed to create gzip writer: %w", err)
	}
	if _, err := w.Write(js); err != nil {
		return "", fmt.Errorf("failed to compress data to JSON: %w", err)
	}
	if err := w.Close(); err != nil {
		return "", fmt.Errorf("failed to close gzip: %w", err)
	}

	// ascii 85 encoding
	var b85Buf bytes.Buffer
	b85 := ascii85.NewEncoder(&b85Buf)
	_, err = b85.Write(buf.Bytes())
	if err != nil {
		return "", fmt.Errorf("failed to write b85 %w", err)
	}
	err = b85.Close()
	if err != nil {
		return "", fmt.Errorf("failed to close b85: %w", err)
	}
	return "<~" + b85Buf.String() + "~>", nil
}

func (gs *GameStateManager) send(ctx context.Context, userId string, data any) (err error) {
	ctx, span := o11y.Tracer.Start(ctx, "game_state: send")
	defer o11y.End(&span, &err)
	compressed, err := compressJson(data)
	if err != nil {
		return fmt.Errorf("failed to compress game state: %w", err)
	}
	span.SetAttributes(attribute.String("user_id", userId))
	span.SetAttributes(attribute.Int("compressed_size", len(compressed)))

	gs.compressedSizeHistogram.Record(
		ctx, int64(len(compressed)),
		metric.WithAttributes(attribute.String("user_id", userId)),
	)

	err = gs.tw.PostExtensionPubSub(ctx, userId, compressed)
	if err != nil {
		return fmt.Errorf("failed to post game state update: %w", err)
	}
	return nil
}

//nolint:funlen
func (gs *GameStateManager) broadcastUpdate(ctx context.Context,
	userId string, prev *GameState, update GameState) (err error) {
	ctx, span := o11y.Tracer.Start(ctx, "game_state: broadcast game state update")
	defer o11y.End(&span, &err)

	if prev == nil {
		return gs.send(ctx, userId, update)
	}

	updateValue := GameStateUpdate{
		Index:          update.Index,
		Channel:        update.Channel,
		Character:      nil,
		Boss:           nil,
		Relics:         nil,
		RelicTips:      nil,
		BaseRelicStats: nil,
		Deck:           nil,
		Potions:        nil,
		AdditionalTips: nil,
		StaticTips:     nil,
		MapNodes:       nil,
		MapPath:        nil,
		DiscardPile:    nil,
		DrawPile:       nil,
		ExhaustPile:    nil,
		Bottles:        nil,
	}
	if prev.Character != update.Character {
		updateValue.Character = &update.Character
	}
	if prev.Boss != update.Boss {
		updateValue.Boss = &update.Boss
	}
	if !reflect.DeepEqual(prev.Relics, update.Relics) {
		updateValue.Relics = &update.Relics
	}
	if !reflect.DeepEqual(prev.BaseRelicStats, update.BaseRelicStats) {
		updateValue.BaseRelicStats = &update.BaseRelicStats
	}
	if !reflect.DeepEqual(prev.RelicTips, update.RelicTips) {
		updateValue.RelicTips = &update.RelicTips
	}
	if !reflect.DeepEqual(prev.Deck, update.Deck) {
		updateValue.Deck = &update.Deck
	}
	if !reflect.DeepEqual(prev.DrawPile, update.DrawPile) {
		updateValue.DrawPile = &update.DrawPile
	}
	if !reflect.DeepEqual(prev.DiscardPile, update.DiscardPile) {
		updateValue.DiscardPile = &update.DiscardPile
	}
	if !reflect.DeepEqual(prev.ExhaustPile, update.ExhaustPile) {
		updateValue.ExhaustPile = &update.ExhaustPile
	}
	if !reflect.DeepEqual(prev.Potions, update.Potions) {
		updateValue.Potions = &update.Potions
	}
	if !reflect.DeepEqual(prev.AdditionalTips, update.AdditionalTips) {
		updateValue.AdditionalTips = &update.AdditionalTips
	}
	if !reflect.DeepEqual(prev.StaticTips, update.StaticTips) {
		updateValue.StaticTips = &update.StaticTips
	}
	if !reflect.DeepEqual(prev.MapNodes, update.MapNodes) {
		updateValue.MapNodes = &update.MapNodes
	}
	if !reflect.DeepEqual(prev.MapPath, update.MapPath) {
		updateValue.MapPath = &update.MapPath
	}
	if !reflect.DeepEqual(prev.Bottles, update.Bottles) {
		updateValue.Bottles = &update.Bottles
	}

	return gs.send(ctx, userId, updateValue)
}

func (gs *GameStateManager) ReceiveUpdate(ctx context.Context, userId string, update GameState) error {
	current, ok := gs.GameStates[userId]
	if !ok || update.Index == 0 {
		gs.GameStates[userId] = update
		return gs.broadcastUpdate(ctx, userId, nil, update)
	}
	err := gs.broadcastUpdate(ctx, userId, &current, update)
	gs.GameStates[userId] = update
	return err
}

func (gs *GameStateManager) GetGameState(userId string) (GameState, bool) {
	state, ok := gs.GameStates[userId]
	if !ok {
		return GameState{}, false
	}
	return state, true
}
