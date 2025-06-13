package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/exp/slices"
)

const WILDCARDS = "0123456789abcdefghijklmnopqrstvwxyzABCDEFGHIJKLMNOPQRSTVWXYZ_`[]/^%?@><=-+*:;,.()#$!'{}~"

func (a *API) getPlayersHandler(c *gin.Context) {
	a.deckLock.RLock()
	defer a.deckLock.RUnlock()

	var players []string
	for user := range a.deckLists {
		deck := a.deckLists[user]
		if strings.TrimSpace(deck) == "" {
			continue
		}
		players = append(players, user)
	}

	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.JSON(200, gin.H{"players": players})
}

func (a *API) getDeckHandler(c *gin.Context) {
	name := c.Param("name")
	name = strings.ToLower(name)

	deck, ok := func() (string, bool) {
		a.deckLock.RLock()
		defer a.deckLock.RUnlock()
		deck, ok := a.deckLists[name]
		return deck, ok
	}()

	if !ok {
		c.JSON(404, gin.H{"error": "deck not found"})
		return
	}
	d, err := decompressDeck(deck)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	keys := make([]string, 0, len(d))
	for k := range d {
		keys = append(keys, k)
	}

	slices.SortFunc(keys, func(i, j string) bool {
		if i == "Ascender's Bane" {
			return false
		}
		if j == "Ascender's Bane" {
			return true
		}
		return i < j
	})

	result := strings.Builder{}
	for _, k := range keys {
		result.WriteString(k)
		result.WriteString(" x")
		result.WriteString(fmt.Sprint(d[k]))
		result.WriteString("\n")
	}

	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.Data(200, "text/plain", []byte(result.String()))
}

func escapeRegexp(s string) string {
	r := regexp.MustCompile(`[-\/\\^$*+?.()|[\]{}]`)
	return r.ReplaceAllString(s, "\\$&")
}

func decompress(s string) (string, error) {
	parts := strings.Split(s, "||")
	if len(parts) < 2 {
		return "", errors.New("invalid deck")
	}

	compressionDict := strings.Split(parts[0], "|")
	text := parts[1]

	for i := len(compressionDict) - 1; i >= 0; i-- {
		word := compressionDict[i]
		wildCard := fmt.Sprintf("&%c", WILDCARDS[i])
		r, err := regexp.Compile(escapeRegexp(wildCard))
		if err != nil {
			return "", err
		}
		text = r.ReplaceAllString(text, word)
	}
	return text, nil
}

func parseCommaDelimitedIntegerArray(s string) ([]int, error) {
	if s == "-" {
		return make([]int, 0), nil
	}
	//nolint:prealloc
	var result []int
	err := json.Unmarshal([]byte(fmt.Sprintf("[%s]", s)), &result)
	return result, err
}

func splitSemicolonDelimited2DArray(s string) [][]string {
	if s == "-" {
		return make([][]string, 0)
	}

	//nolint:prealloc
	var result [][]string
	split := strings.Split(s, ";;")
	for _, element := range split {
		result = append(result, strings.Split(element, ";"))
	}
	return result
}

func parseCards(cards [][]string) []string {
	//nolint:prealloc
	var result []string
	for _, card := range cards {
		result = append(result, parseCard(card))
	}
	return result
}

func parseCard(c []string) string {
	return c[0]
}

func decompressDeck(deck string) (map[string]int, error) {
	deck, err := decompress(deck)
	if err != nil {
		return nil, err
	}

	parts := strings.Split(deck, ";;;")
	d, err := parseCommaDelimitedIntegerArray(parts[0])
	if err != nil {
		return nil, err
	}
	cards := parseCards(splitSemicolonDelimited2DArray(parts[1]))

	deckDict := make(map[string]int)
	for _, idx := range d {
		if idx < 0 || idx >= len(cards) {
			return nil, errors.New("card index out of bounds")
		}

		name := cards[idx]
		deckDict[name]++
	}

	return deckDict, nil
}
