package slaytherelics

import (
	"encoding/json"
	"reflect"
	"testing"

	"gotest.tools/v3/assert"
)

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
	assert.Check(t, !hasCardTips)
	assert.Check(t, !hasPotionTips)
	assert.Check(t, !hasGame)
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
	}

	gsm.GameStates.Store("test", gs)

	loaded, ok := gsm.GameStates.Load("test")
	assert.Check(t, ok)
	assert.Equal(t, loaded.Game, "sts2")
	assert.Equal(t, len(loaded.CardTips), 1)
	assert.Equal(t, loaded.CardTips["bash"][0].Header, "Bash")
	assert.Equal(t, len(loaded.PotionTips), 1)
	assert.Equal(t, loaded.PotionTips[0].Header, "Fire Potion")
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
	}

	data, err := json.Marshal(gs)
	assert.NilError(t, err)

	var loaded GameState
	err = json.Unmarshal(data, &loaded)
	assert.NilError(t, err)

	assert.Equal(t, loaded.Game, "sts2")
	assert.Equal(t, loaded.CardTips["strike_ironclad"][0].Header, "Strike")
	assert.Equal(t, loaded.PotionTips[0].Header, "Block Potion")
}

func TestDeltaCompressionOmitsUnchangedNewFields(t *testing.T) {
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

	delta := computeDelta(&prev, update)

	// CardTips unchanged → should be nil
	assert.Check(t, delta.CardTips == nil)
	// Character changed → should be set
	assert.Check(t, delta.Character != nil)
	assert.Equal(t, *delta.Character, "Ironclad")
}

func TestDeltaCompressionIncludesChangedNewFields(t *testing.T) {
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

	delta := computeDelta(&prev, update)

	assert.Check(t, delta.CardTips != nil)
	assert.Equal(t, len(*delta.CardTips), 2)
	assert.Check(t, delta.PotionTips != nil)
	assert.Equal(t, len(*delta.PotionTips), 1)
}

// computeDelta mirrors the comparison logic in broadcastUpdate for testing.
func computeDelta(prev *GameState, update GameState) GameStateUpdate {
	u := GameStateUpdate{
		Index:   update.Index,
		Channel: update.Channel,
	}
	if prev.Character != update.Character {
		u.Character = &update.Character
	}
	if prev.Boss != update.Boss {
		u.Boss = &update.Boss
	}
	if !reflect.DeepEqual(prev.CardTips, update.CardTips) {
		u.CardTips = &update.CardTips
	}
	if !reflect.DeepEqual(prev.PotionTips, update.PotionTips) {
		u.PotionTips = &update.PotionTips
	}
	return u
}
