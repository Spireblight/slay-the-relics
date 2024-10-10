package api

import (
	"fmt"
	"strings"
	"testing"

	"gotest.tools/v3/assert"
)

func TestDecompress(t *testing.T) {
	testCases := []struct {
		desc        string
		input       string
		output      string
		shouldError bool
	}{
		{
			desc:        "Empty",
			input:       "",
			output:      "",
			shouldError: true,
		},
		{
			desc:        "Single |",
			input:       "|",
			output:      "",
			shouldError: true,
		},
		{
			desc:        "Minimal Valid",
			input:       "||",
			output:      "",
			shouldError: false,
		},
		{
			desc:        "No compression",
			input:       "||I love love slay the relics and slay the spire",
			output:      "I love love slay the relics and slay the spire",
			shouldError: false,
		},
		{
			desc:        "Unused compression",
			input:       "Foo|Bar||I love love slay the relics and slay the spire",
			output:      "I love love slay the relics and slay the spire",
			shouldError: false,
		},
		{
			desc:        "Basic compression",
			input:       "love|slay the||I &0 &0 &1 relics and &1 spire",
			output:      "I love love slay the relics and slay the spire",
			shouldError: false,
		},
		{
			desc:        "Basic compression",
			input:       "love|slay the||I &0 &0 &1 relics and &1 spire",
			output:      "I love love slay the relics and slay the spire",
			shouldError: false,
		},
		{
			desc:        "Small Deck",
			input:       "card|junk||0,1,1,0,2,0;;;&01;&1;x;;&02;&1;y;;&03;&1;z",
			output:      "0,1,1,0,2,0;;;card1;junk;x;;card2;junk;y;;card3;junk;z",
			shouldError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.desc, func(t *testing.T) {
			actualOutput, err := decompress(tc.input)
			if tc.shouldError {
				assert.Equal(t, true, err != nil)
				return
			}

			assert.NilError(t, err)
			assert.Equal(t, actualOutput, tc.output)
		})
	}
}

func TestParseCommaDelimitedIntegerArray(t *testing.T) {
	testCases := []struct {
		desc        string
		input       string
		output      []int
		shouldError bool
	}{
		{
			desc:        "Empty",
			input:       "",
			output:      []int{},
			shouldError: false,
		},
		{
			desc:        "Dash",
			input:       "-",
			output:      []int{},
			shouldError: false,
		},
		{
			desc:        "Invalid",
			input:       "{",
			output:      []int{},
			shouldError: true,
		},
		{
			desc:        "Single",
			input:       "19",
			output:      []int{19},
			shouldError: false,
		},
		{
			desc:        "Many",
			input:       "1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9",
			output:      []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9},
			shouldError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.desc, func(t *testing.T) {
			actualOutput, err := parseCommaDelimitedIntegerArray(tc.input)
			if tc.shouldError {
				assert.Equal(t, true, err != nil)
				return
			}

			assert.NilError(t, err)
			assert.Equal(t, len(actualOutput), len(tc.output))
			for i := range actualOutput {
				assert.Equal(t, actualOutput[i], tc.output[i])
			}
		})
	}
}

func TestDecompressDeck(t *testing.T) {
	testCases := []struct {
		desc        string
		input       string
		output      map[string]int
		shouldError bool
	}{
		{
			desc:        "Empty",
			input:       "",
			output:      map[string]int{},
			shouldError: true,
		},
		{
			desc:        "Invalid card index",
			input:       "card|junk||};;;&01;&1;x;;&02;&1;y;;&03;&1;z",
			output:      map[string]int{},
			shouldError: true,
		},
		{
			desc:        "Negative card index",
			input:       "card|junk||-1;;;&01;&1;x;;&02;&1;y;;&03;&1;z",
			output:      map[string]int{},
			shouldError: true,
		},
		{
			desc:        "Out of bounds card index",
			input:       "card|junk||3;;;&01;&1;x;;&02;&1;y;;&03;&1;z",
			output:      map[string]int{},
			shouldError: true,
		},
		{
			desc:  "Simple deck",
			input: "card|junk||0,1,1,0,2,0;;;&01;&1;x;;&02;&1;y;;&03;&1;z",
			output: map[string]int{
				"card1": 3,
				"card2": 2,
				"card3": 1,
			},
			shouldError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.desc, func(t *testing.T) {
			actualOutput, err := decompressDeck(tc.input)
			if tc.shouldError {
				assert.Equal(t, true, err != nil)
				return
			}

			assert.NilError(t, err)
			assert.Equal(t, len(actualOutput), len(tc.output))
			for i := range actualOutput {
				assert.Equal(t, actualOutput[i], tc.output[i])
			}
		})
	}
}

// getBigDeckString makes us a 52 card compressed deck string for testing with.
func getBigDeckString() string {
	compressionDict := make([]string, 0, 128)

	// Generate cards.
	compressedCards := make([]string, 0, 52)
	for i := 0; i < 52; i++ {
		compressionDict = append(compressionDict, fmt.Sprintf("Card Name %d;other details;junk", i))
		compressedCards = append(compressionDict, fmt.Sprintf("%c", WILDCARDS[i]))
	}
	cardsPart := strings.Join(compressedCards, ";;")

	// Generate deck.
	deckIndices := make([]string, 0, 100)
	for i := 0; i < 52; i++ {
		deckIndices = append(deckIndices, fmt.Sprintf("%d", i))
	}
	for i := 0; i < 48; i++ {
		deckIndices = append(deckIndices, "17")
	}
	deckPart := strings.Join(deckIndices, ",")

	// Put it all together.
	compressionPart := strings.Join(compressionDict, "|")
	compressedPart := fmt.Sprintf("%s;;;%s", deckPart, cardsPart)
	return fmt.Sprintf("%s||%s", compressionPart, compressedPart)
}

func TestDecompressBigDeck(t *testing.T) {
	output, err := decompressDeck(getBigDeckString())
	assert.NilError(t, err)

	assert.Equal(t, len(output), 52)
	for card, count := range output {
		switch card {
		case "Card Name 17":
			assert.Equal(t, count, 49, card)
		default:
			assert.Equal(t, count, 1, card)
		}
	}
}

func BenchmarkDecompressDeck(b *testing.B) {
	testCases := []struct {
		desc  string
		input string
	}{
		{
			desc:  "Simple deck",
			input: "card|junk||0,1,1,0,2,0;;;&01;&1;x;;&02;&1;y;;&03;&1;z",
		},
		{
			desc:  "Big deck",
			input: getBigDeckString(),
		},
	}

	b.ResetTimer()
	for _, tc := range testCases {
		b.Run(tc.desc, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				decompressDeck(tc.input)
			}
		})
	}
}
