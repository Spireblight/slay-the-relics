package slaytherelics

import (
	"encoding/json"
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
	_, hasRelicTipMap := raw["relicTipMap"]
	assert.Check(t, !hasCardTips)
	assert.Check(t, !hasPotionTips)
	assert.Check(t, !hasGame)
	assert.Check(t, !hasRelicTipMap)
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
			"Burning Blood": {{Header: "Burning Blood", Description: "Heal 6 HP."}},
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
	assert.Equal(t, loaded.RelicTipMap["Burning Blood"][0].Header, "Burning Blood")
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
			"Burning Blood": {{Header: "Burning Blood", Description: "Heal 6 HP."}},
			"Vajra":         {{Header: "Vajra", Description: "+1 Strength."}},
		},
	}
	update := GameState{
		Index:   2,
		Channel: "test",
		RelicTipMap: map[string][]Tip{
			"Burning Blood": {{Header: "Burning Blood", Description: "Heal 6 HP."}},
			"Vajra":         {{Header: "Vajra", Description: "+2 Strength."}}, // changed
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
	_, hasBurning := tipMap["Burning Blood"]
	assert.Check(t, !hasBurning)
}

func TestMergePatchUnchangedMapOmitted(t *testing.T) {
	tips := map[string][]Tip{
		"Burning Blood": {{Header: "Burning Blood", Description: "Heal 6 HP."}},
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
