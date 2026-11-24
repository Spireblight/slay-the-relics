package slaytherelics

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/ascii85"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"sync"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"

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
	Type        string `json:"type,omitempty"`
}

type TipsBox struct {
	Tips   []Tip  `json:"tips"`
	HitBox HitBox `json:"hitbox"`
}

type MapNode struct {
	Type    string `json:"type"`
	Parents []int  `json:"parents"`
}

// GameState is the game state format used by both STS1 and STS2.
// The STS2 mod transforms its state to the same shape, with a few extra optional fields.
type GameState struct {
	Index   int    `json:"gameStateIndex"`
	Channel string `json:"channel"`
	Game    string `json:"game,omitempty"`

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
	PotionX        float64       `json:"potionX"`

	DrawPile    []CardData `json:"drawPile"`
	DiscardPile []CardData `json:"discardPile"`
	ExhaustPile []CardData `json:"exhaustPile"`

	CardTips    map[string][]Tip `json:"cardTips,omitempty"`
	PotionTips  []Tip            `json:"potionTips,omitempty"`
	RelicTipMap map[string][]Tip `json:"relicTipMap,omitempty"`
	Floor       int              `json:"floor,omitempty"`
	SecondBoss  string           `json:"secondBoss,omitempty"`
	Ancient     string           `json:"ancient,omitempty"`
}

func computeAdditivePatch(prev *GameState, update GameState) (map[string]any, bool) {
	patch := map[string]any{
		"gameStateIndex": update.Index,
		"channel":        update.Channel,
	}
	changed := false

	prevVal := reflect.ValueOf(*prev)
	updateVal := reflect.ValueOf(update)
	prevType := prevVal.Type()

	for i := 0; i < prevType.NumField(); i++ {
		field := prevType.Field(i)
		jsonTag := field.Tag.Get("json")
		if jsonTag == "" {
			continue
		}
		jsonName := strings.Split(jsonTag, ",")[0]
		if jsonName == "gameStateIndex" || jsonName == "channel" {
			continue
		}

		prevField := prevVal.Field(i)
		updateField := updateVal.Field(i)

		if field.Type.Kind() == reflect.Map && field.Type.Key().Kind() == reflect.String {
			keyDiff := diffAdditiveMapKeys(prevField, updateField)
			if keyDiff != nil {
				patch[jsonName] = keyDiff
				changed = true
			}
			continue
		}

		if !reflect.DeepEqual(prevField.Interface(), updateField.Interface()) {
			patch[jsonName] = updateField.Interface()
			changed = true
		}
	}

	return patch, changed
}

func diffAdditiveMapKeys(prev, update reflect.Value) map[string]any {
	prevNil := !prev.IsValid() || prev.IsNil()
	updateNil := !update.IsValid() || update.IsNil()
	if prevNil && updateNil {
		return nil
	}
	if prevNil {
		result := make(map[string]any, update.Len())
		for _, key := range update.MapKeys() {
			result[key.String()] = update.MapIndex(key).Interface()
		}
		return result
	}
	if updateNil {
		return nil
	}

	result := map[string]any{}
	for _, key := range update.MapKeys() {
		updateEntry := update.MapIndex(key)
		prevEntry := prev.MapIndex(key)
		if !prevEntry.IsValid() || !reflect.DeepEqual(prevEntry.Interface(), updateEntry.Interface()) {
			result[key.String()] = updateEntry.Interface()
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

type GameStateManager struct {
	pub Publisher

	GameStates    SyncMap[string, GameState]
	ingestIndexes SyncMap[string, int]
	channelLocks  SyncMap[string, *sync.Mutex]

	compressedSizeHistogram metric.Int64Histogram
}

func NewGameStateManager(pub Publisher) (*GameStateManager, error) {
	hist, err := o11y.Meter.Int64Histogram("game_state.compressed_size")
	if err != nil {
		return nil, err
	}
	return &GameStateManager{
		pub:                     pub,
		GameStates:              SyncMap[string, GameState]{},
		ingestIndexes:           SyncMap[string, int]{},
		channelLocks:            SyncMap[string, *sync.Mutex]{},
		compressedSizeHistogram: hist,
	}, nil
}

func (gs *GameStateManager) channelLock(userId string) *sync.Mutex {
	mu, _ := gs.channelLocks.LoadOrStore(userId, &sync.Mutex{})
	return mu
}

func compressJson(data any) (_ string, err error) {
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

	err = gs.pub.PostExtensionPubSub(ctx, userId, compressed)
	if err != nil {
		return fmt.Errorf("failed to post game state update: %w", err)
	}
	return nil
}

func (gs *GameStateManager) broadcastPayload(ctx context.Context,
	userId string, ingestIndex, broadcastIndex int, payload any) (err error) {
	ctx, span := o11y.Tracer.Start(ctx, "game_state: broadcast game state update", trace.WithAttributes(
		attribute.String("user_id", userId),
		attribute.Int("gamestate_index", broadcastIndex),
		attribute.Int("ingest_index", ingestIndex),
	))
	defer o11y.End(&span, &err)

	return gs.send(ctx, userId, payload)
}

func (gs *GameStateManager) storeAndBroadcast(
	ctx context.Context,
	userId string,
	state GameState,
	ingestIndex int,
	payload any,
) error {
	gs.GameStates.Store(userId, state)
	gs.ingestIndexes.Store(userId, ingestIndex)
	return gs.broadcastPayload(ctx, userId, ingestIndex, state.Index, payload)
}

func (gs *GameStateManager) applyResetUpdate(
	ctx context.Context,
	userId string,
	current GameState,
	hasCurrent bool,
	update GameState,
) error {
	if hasCurrent && current.Index == 0 {
		if _, changed := computeAdditivePatch(&current, update); !changed {
			gs.ingestIndexes.Store(userId, 0)
			return nil
		}
	}
	update.Index = 0
	return gs.storeAndBroadcast(ctx, userId, update, 0, update)
}

func (gs *GameStateManager) isStaleIngest(userId string, current GameState, ingestIndex int) bool {
	lastIngestIndex, hasIngest := gs.ingestIndexes.Load(userId)
	if !hasIngest {
		lastIngestIndex = current.Index
	}
	return lastIngestIndex >= ingestIndex
}

func (gs *GameStateManager) ReceiveUpdate(ctx context.Context, userId string, update GameState) error {
	mu := gs.channelLock(userId)
	mu.Lock()
	defer mu.Unlock()

	ingestIndex := update.Index
	current, ok := gs.GameStates.Load(userId)

	if ingestIndex == 0 {
		return gs.applyResetUpdate(ctx, userId, current, ok, update)
	}

	if !ok {
		return gs.storeAndBroadcast(ctx, userId, update, ingestIndex, update)
	}

	if gs.isStaleIngest(userId, current, ingestIndex) {
		return nil
	}

	patch, changed := computeAdditivePatch(&current, update)
	if !changed {
		gs.ingestIndexes.Store(userId, ingestIndex)
		return nil
	}

	nextBroadcastIndex := current.Index + 1
	update.Index = nextBroadcastIndex
	patch["gameStateIndex"] = nextBroadcastIndex

	return gs.storeAndBroadcast(ctx, userId, update, ingestIndex, patch)
}

func (gs *GameStateManager) GetGameState(userId string) (GameState, bool) {
	state, ok := gs.GameStates.Load(userId)
	if !ok {
		return GameState{}, false
	}
	return state, true
}
