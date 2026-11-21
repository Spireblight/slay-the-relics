package slaytherelics

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/ascii85"
	"encoding/json"
	"errors"
	"io"
	"strings"
	"sync"
	"testing"
	"time"

	"gotest.tools/v3/assert"

	"github.com/MaT1g3R/slaytherelics/o11y"
)

const burningBlood = "Burning Blood"

func TestSTS1PayloadWithoutNewFields(t *testing.T) {
	gs := GameState{
		Index:     1,
		Channel:   "test",
		Character: "Ironclad",
		Potions:   []string{"Fire Potion"},
	}

	data, err := json.Marshal(gs)
	assert.NilError(t, err)

	var raw map[string]any
	err = json.Unmarshal(data, &raw)
	assert.NilError(t, err)

	// STS1 payloads should not contain the new optional fields
	_, hasCardTips := raw["cardTips"]
	_, hasPotionTips := raw["potionTips"]
	_, hasGame := raw["game"]
	_, hasRelicTipMap := raw["relicTipMap"]
	_, hasSecondBoss := raw["secondBoss"]
	_, hasAncient := raw["ancient"]
	assert.Check(t, !hasCardTips)
	assert.Check(t, !hasPotionTips)
	assert.Check(t, !hasGame)
	assert.Check(t, !hasRelicTipMap)
	assert.Check(t, !hasSecondBoss)
	assert.Check(t, !hasAncient)
}

func TestNewFieldsStoreAndRetrieve(t *testing.T) {
	gsm := &GameStateManager{
		GameStates: SyncMap[string, GameState]{},
	}

	gs := GameState{
		Index:   1,
		Channel: "test",
		Game:    "sts2",
		CardTips: map[string][]Tip{
			"bash": {{Header: "Bash", Description: "Deal 8 damage."}},
		},
		PotionTips: []Tip{{Header: "Fire Potion", Description: "Deal 20 damage."}},
		RelicTipMap: map[string][]Tip{
			burningBlood: {{Header: burningBlood, Description: "Heal 6 HP."}},
		},
	}

	gsm.GameStates.Store("test", gs)

	loaded, ok := gsm.GameStates.Load("test")
	assert.Check(t, ok)
	assert.Equal(t, loaded.Game, "sts2")
	assert.Equal(t, len(loaded.CardTips), 1)
	assert.Equal(t, loaded.CardTips["bash"][0].Header, "Bash")
	assert.Equal(t, len(loaded.PotionTips), 1)
	assert.Equal(t, loaded.PotionTips[0].Header, "Fire Potion")
	assert.Equal(t, len(loaded.RelicTipMap), 1)
	assert.Equal(t, loaded.RelicTipMap[burningBlood][0].Header, burningBlood)
}

func TestNewFieldsJsonRoundTrip(t *testing.T) {
	gs := GameState{
		Index:   1,
		Channel: "test",
		Game:    "sts2",
		CardTips: map[string][]Tip{
			"strike_ironclad": {{Header: "Strike", Description: "Deal 6 damage."}},
		},
		PotionTips: []Tip{{Header: "Block Potion", Description: "Gain 12 block."}},
		RelicTipMap: map[string][]Tip{
			"Vajra": {{Header: "Vajra", Description: "+1 Strength."}},
		},
	}

	data, err := json.Marshal(gs)
	assert.NilError(t, err)

	var loaded GameState
	err = json.Unmarshal(data, &loaded)
	assert.NilError(t, err)

	assert.Equal(t, loaded.Game, "sts2")
	assert.Equal(t, loaded.CardTips["strike_ironclad"][0].Header, "Strike")
	assert.Equal(t, loaded.PotionTips[0].Header, "Block Potion")
	assert.Equal(t, loaded.RelicTipMap["Vajra"][0].Header, "Vajra")
}

func TestMergePatchOmitsUnchangedFields(t *testing.T) {
	tips := map[string][]Tip{"bash": {{Header: "Bash", Description: "Deal 8 damage."}}}
	prev := GameState{
		Index:    1,
		Channel:  "test",
		CardTips: tips,
	}
	update := GameState{
		Index:     2,
		Channel:   "test",
		CardTips:  tips,
		Character: "Ironclad",
	}

	patch := computeMergePatch(&prev, update)

	// CardTips unchanged → should not be in patch
	_, hasCardTips := patch["cardTips"]
	assert.Check(t, !hasCardTips)
	// Character changed → should be in patch
	assert.Equal(t, patch["character"], "Ironclad")
}

func TestMergePatchIncludesChangedFields(t *testing.T) {
	prev := GameState{
		Index:   1,
		Channel: "test",
		CardTips: map[string][]Tip{
			"bash": {{Header: "Bash", Description: "Deal 8 damage."}},
		},
	}
	update := GameState{
		Index:   2,
		Channel: "test",
		CardTips: map[string][]Tip{
			"bash":            {{Header: "Bash", Description: "Deal 8 damage."}},
			"strike_ironclad": {{Header: "Strike", Description: "Deal 6 damage."}},
		},
		PotionTips: []Tip{{Header: "Fire Potion", Description: "Deal 20 damage."}},
	}

	patch := computeMergePatch(&prev, update)

	// CardTips changed → patch should contain only the new key
	cardTips, ok := patch["cardTips"]
	assert.Check(t, ok)
	cardTipsMap := cardTips.(map[string]any)
	assert.Equal(t, len(cardTipsMap), 1) // only strike_ironclad, bash unchanged
	_, hasStrike := cardTipsMap["strike_ironclad"]
	assert.Check(t, hasStrike)
	_, hasBash := cardTipsMap["bash"]
	assert.Check(t, !hasBash) // bash unchanged, not in patch

	// PotionTips changed (was nil) → should be in patch
	_, hasPotionTips := patch["potionTips"]
	assert.Check(t, hasPotionTips)
}

func TestMergePatchPerKeyDiffForRelicTipMap(t *testing.T) {
	prev := GameState{
		Index:   1,
		Channel: "test",
		RelicTipMap: map[string][]Tip{
			burningBlood: {{Header: burningBlood, Description: "Heal 6 HP."}},
			"Vajra":      {{Header: "Vajra", Description: "+1 Strength."}},
		},
	}
	update := GameState{
		Index:   2,
		Channel: "test",
		RelicTipMap: map[string][]Tip{
			burningBlood: {{Header: burningBlood, Description: "Heal 6 HP."}},
			"Vajra":      {{Header: "Vajra", Description: "+2 Strength."}}, // changed
		},
	}

	patch := computeMergePatch(&prev, update)

	relicTipMap, ok := patch["relicTipMap"]
	assert.Check(t, ok)
	tipMap := relicTipMap.(map[string]any)
	// Only Vajra changed
	assert.Equal(t, len(tipMap), 1)
	_, hasVajra := tipMap["Vajra"]
	assert.Check(t, hasVajra)
	_, hasBurning := tipMap[burningBlood]
	assert.Check(t, !hasBurning)
}

func TestMergePatchUnchangedMapOmitted(t *testing.T) {
	tips := map[string][]Tip{
		burningBlood: {{Header: burningBlood, Description: "Heal 6 HP."}},
	}
	prev := GameState{
		Index:       1,
		Channel:     "test",
		RelicTipMap: tips,
	}
	update := GameState{
		Index:       2,
		Channel:     "test",
		RelicTipMap: tips,
	}

	patch := computeMergePatch(&prev, update)

	_, hasRelicTipMap := patch["relicTipMap"]
	assert.Check(t, !hasRelicTipMap)
}

func TestSecondBossAndAncientRoundTripAndClearPatch(t *testing.T) {
	gs := GameState{
		Index:      1,
		Channel:    "test",
		Game:       "sts2",
		Boss:       "queen_boss",
		SecondBoss: "test_subject_boss",
		Ancient:    "vakuu",
	}

	data, err := json.Marshal(gs)
	assert.NilError(t, err)

	var loaded GameState
	err = json.Unmarshal(data, &loaded)
	assert.NilError(t, err)
	assert.Equal(t, loaded.Boss, "queen_boss")
	assert.Equal(t, loaded.SecondBoss, "test_subject_boss")
	assert.Equal(t, loaded.Ancient, "vakuu")

	// Clearing secondBoss on a subsequent update should emit an empty string in the merge patch
	next := loaded
	next.Index = 2
	next.SecondBoss = ""
	next.Ancient = "neow"

	patch := computeMergePatch(&loaded, next)
	assert.Equal(t, patch["secondBoss"], "")
	assert.Equal(t, patch["ancient"], "neow")
}

type recordingPublisher struct {
	mu       sync.Mutex
	messages []map[string]any
	onPost   func(ctx context.Context, broadcasterID string, decoded map[string]any) error
}

func (p *recordingPublisher) PostExtensionPubSub(ctx context.Context, broadcasterID, message string) error {
	// Decode payload without testing.T so it works from goroutines too.
	raw := message[2 : len(message)-2]
	dec := ascii85.NewDecoder(strings.NewReader(raw))
	gzBytes, err := io.ReadAll(dec)
	if err != nil {
		return err
	}
	gz, err := gzip.NewReader(bytes.NewReader(gzBytes))
	if err != nil {
		return err
	}
	defer gz.Close()
	jsonBytes, err := io.ReadAll(gz)
	if err != nil {
		return err
	}
	var out map[string]any
	if err := json.Unmarshal(jsonBytes, &out); err != nil {
		return err
	}

	p.mu.Lock()
	p.messages = append(p.messages, out)
	cb := p.onPost
	p.mu.Unlock()

	if cb != nil {
		return cb(ctx, broadcasterID, out)
	}
	return nil
}

func newTestGameStateManager(t *testing.T, pub Publisher) *GameStateManager {
	t.Helper()
	cleanup, err := o11y.Init("test", "")
	assert.NilError(t, err)
	t.Cleanup(func() { cleanup(context.Background()) })

	gsm, err := NewGameStateManager(pub)
	assert.NilError(t, err)
	return gsm
}

func TestIdlePollsKeepBroadcastIndexContiguous(t *testing.T) {
	pub := &recordingPublisher{}
	gsm := newTestGameStateManager(t, pub)
	ctx := context.Background()

	base := GameState{
		Index:     0,
		Channel:   "chan1",
		Game:      "sts2",
		Character: "Ironclad",
		MapPath:   [][]int{{3, 0}},
	}
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", base))

	// Idle polls with advancing mod ingest index produce zero broadcasts.
	for i := 1; i <= 5; i++ {
		idle := base
		idle.Index = i
		assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", idle))
	}
	assert.Equal(t, len(pub.messages), 1)
	stored, ok := gsm.GetGameState("chan1")
	assert.Check(t, ok)
	assert.Equal(t, stored.Index, 0)

	// Next real change at mod index 6 should emit contiguous broadcastIndex 1.
	change1 := base
	change1.Index = 6
	change1.MapPath = [][]int{{3, 0}, {3, 1}}
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", change1))

	// More idle polls, then another real change at mod index 10 -> broadcastIndex 2.
	for i := 7; i <= 9; i++ {
		idle := change1
		idle.Index = i
		assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", idle))
	}
	change2 := change1
	change2.Index = 10
	change2.Floor = 2
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", change2))

	assert.Equal(t, len(pub.messages), 3)
	assert.Equal(t, int(pub.messages[0]["gameStateIndex"].(float64)), 0)
	assert.Equal(t, int(pub.messages[1]["gameStateIndex"].(float64)), 1)
	assert.Equal(t, int(pub.messages[2]["gameStateIndex"].(float64)), 2)

	stored, ok = gsm.GetGameState("chan1")
	assert.Check(t, ok)
	assert.Equal(t, stored.Index, 2)
	assert.Equal(t, stored.Floor, 2)
}

func TestStoreHappensBeforeBroadcast(t *testing.T) {
	pub := &recordingPublisher{}
	gsm := newTestGameStateManager(t, pub)
	ctx := context.Background()

	var seenDuringBroadcast GameState
	var seenOK bool
	pub.onPost = func(_ context.Context, broadcasterID string, _ map[string]any) error {
		seenDuringBroadcast, seenOK = gsm.GetGameState(broadcasterID)
		return nil
	}

	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   0,
		Channel: "chan1",
		MapPath: [][]int{{3, 0}},
	}))
	assert.Check(t, seenOK)
	assert.Equal(t, seenDuringBroadcast.Index, 0)

	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   5,
		Channel: "chan1",
		MapPath: [][]int{{3, 0}, {3, 1}},
	}))
	assert.Check(t, seenOK)
	assert.Equal(t, seenDuringBroadcast.Index, 1)
	assert.Equal(t, len(seenDuringBroadcast.MapPath), 2)
}

func TestPubSubFailureKeepsStoredStateAndSignalsResync(t *testing.T) {
	pub := &recordingPublisher{}
	gsm := newTestGameStateManager(t, pub)
	ctx := context.Background()

	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   0,
		Channel: "chan1",
		Floor:   1,
	}))

	// Fail change #1 (simulating >5 KB or transient 429).
	pub.onPost = func(_ context.Context, _ string, _ map[string]any) error {
		return errors.New("payload too large")
	}
	err := gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   1,
		Channel: "chan1",
		Floor:   2,
		MapPath: [][]int{{3, 0}, {3, 1}},
	})
	assert.Check(t, err != nil)

	// Stored state should already have change #1 at broadcastIndex 1.
	stored, ok := gsm.GetGameState("chan1")
	assert.Check(t, ok)
	assert.Equal(t, stored.Index, 1)
	assert.Equal(t, stored.Floor, 2)

	// Change #2 succeeds and broadcasts index 2 (viewer at 0 sees 0 -> 2 and fetches full state).
	pub.onPost = nil
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   2,
		Channel: "chan1",
		Floor:   3,
		MapPath: [][]int{{3, 0}, {3, 1}},
	}))
	assert.Equal(t, len(pub.messages), 3)
	assert.Equal(t, int(pub.messages[2]["gameStateIndex"].(float64)), 2)
}

func TestStaleIngestPostsIgnoredAfterIdlePolls(t *testing.T) {
	pub := &recordingPublisher{}
	gsm := newTestGameStateManager(t, pub)
	ctx := context.Background()

	base := GameState{Index: 0, Channel: "chan1", Floor: 1}
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", base))

	// Idle polls advance ingest index to 5 while broadcastIndex stays 0.
	idle := base
	idle.Index = 5
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", idle))

	// Stale mod POST with index 4 (even with different state) must be ignored.
	stale := base
	stale.Index = 4
	stale.Floor = 99
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", stale))

	assert.Equal(t, len(pub.messages), 1)
	stored, ok := gsm.GetGameState("chan1")
	assert.Check(t, ok)
	assert.Equal(t, stored.Floor, 1)
	assert.Equal(t, stored.Index, 0)
}

func TestResetIndexZeroAndDeduplicateMenuPolls(t *testing.T) {
	pub := &recordingPublisher{}
	gsm := newTestGameStateManager(t, pub)
	ctx := context.Background()

	// Run starts and advances to broadcastIndex 1.
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:     0,
		Channel:   "chan1",
		Character: "Ironclad",
	}))
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:     1,
		Channel:   "chan1",
		Character: "Ironclad",
		Floor:     2,
	}))
	assert.Equal(t, len(pub.messages), 2)

	// Exit to menu (index 0 empty state) resets broadcastIndex to 0 and broadcasts.
	empty := GameState{Index: 0, Channel: "chan1"}
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", empty))
	assert.Equal(t, len(pub.messages), 3)
	assert.Equal(t, int(pub.messages[2]["gameStateIndex"].(float64)), 0)

	// Repeated identical index 0 empty menu polls (STS1 menu behavior) are suppressed.
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", empty))
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", empty))
	assert.Equal(t, len(pub.messages), 3)

	// Starting a new run (index 0 with new character) broadcasts full snapshot at index 0.
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:     0,
		Channel:   "chan1",
		Character: "Silent",
	}))
	assert.Equal(t, len(pub.messages), 4)
	assert.Equal(t, int(pub.messages[3]["gameStateIndex"].(float64)), 0)
	assert.Equal(t, pub.messages[3]["character"], "Silent")
}

func TestMidRunBackendRestartPreservesInitialIndexThenIncrementsContiguously(t *testing.T) {
	pub := &recordingPublisher{}
	gsm := newTestGameStateManager(t, pub)
	ctx := context.Background()

	// First update after backend restart has mod index 900.
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   900,
		Channel: "chan1",
		Floor:   10,
	}))
	// Idle polls at 901, 902.
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   901,
		Channel: "chan1",
		Floor:   10,
	}))
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   902,
		Channel: "chan1",
		Floor:   10,
	}))
	// Real change at mod index 903 -> broadcastIndex 901 (contiguous with 900).
	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   903,
		Channel: "chan1",
		Floor:   11,
	}))

	assert.Equal(t, len(pub.messages), 2)
	assert.Equal(t, int(pub.messages[0]["gameStateIndex"].(float64)), 900)
	assert.Equal(t, int(pub.messages[1]["gameStateIndex"].(float64)), 901)
}

func TestConcurrentReceiveUpdateSerializesBroadcastOrder(t *testing.T) {
	pub := &recordingPublisher{}
	pub.onPost = func(_ context.Context, _ string, _ map[string]any) error {
		time.Sleep(2 * time.Millisecond)
		return nil
	}
	gsm := newTestGameStateManager(t, pub)
	ctx := context.Background()

	assert.NilError(t, gsm.ReceiveUpdate(ctx, "chan1", GameState{
		Index:   0,
		Channel: "chan1",
		Floor:   0,
	}))

	var wg sync.WaitGroup
	for i := 1; i <= 15; i++ {
		idx := i
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = gsm.ReceiveUpdate(ctx, "chan1", GameState{
				Index:   idx,
				Channel: "chan1",
				Floor:   idx,
			})
		}()
	}
	wg.Wait()

	// Every broadcast emitted after index 0 must be strictly contiguous (+1) in arrival order.
	assert.Check(t, len(pub.messages) >= 2)
	for i := 1; i < len(pub.messages); i++ {
		prevIdx := int(pub.messages[i-1]["gameStateIndex"].(float64))
		currIdx := int(pub.messages[i]["gameStateIndex"].(float64))
		assert.Equal(t, currIdx, prevIdx+1)
	}
}
