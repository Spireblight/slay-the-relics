package api

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/exp/slices"
)

const WILDCARDS = "0123456789abcdefghijklmnopqrstvwxyzABCDEFGHIJKLMNOPQRSTVWXYZ_`[]/^%?@><=-+*:;,.()#$!'{}~"

var compressionWildcardRegex []*regexp.Regexp

func init() {
	escapeRegex := regexp.MustCompile(`[-\/\\^$*+?.()|[\]{}]`)

	compressionWildcardRegex = make([]*regexp.Regexp, 0, len(WILDCARDS))
	for i := range WILDCARDS {
		wildCard := fmt.Sprintf("&%c", WILDCARDS[i])
		escaped := escapeRegex.ReplaceAllString(wildCard, "\\$&")
		compressionWildcardRegex = append(compressionWildcardRegex, regexp.MustCompile(escaped))
	}
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

	c.Data(200, "text/plain", []byte(result.String()))
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
		text = compressionWildcardRegex[i].ReplaceAllString(text, word)
	}
	return text, nil
}

func parseCommaDelimitedIntegerArray(s string) ([]int, error) {
	if s == "-" {
		return nil, nil
	}

	currIndex := 0
	result := make([]int, 0, strings.Count(s, ",")+1)
	for currIndex < len(s) {
		nextIndex := currIndex + strings.Index(s[currIndex:], ",")
		if nextIndex < currIndex {
			nextIndex = len(s)
		}

		resultVal, err := strconv.ParseInt(s[currIndex:nextIndex], 10, 64)
		if err != nil {
			return nil, err
		}

		currIndex = nextIndex + 1
		result = append(result, int(resultVal))
	}
	return result, nil
}

func splitDoubleSemicolonArray(s string) []string {
	if s == "-" {
		return nil
	}

	return strings.Split(s, ";;")
}

func parseCards(cardSections []string) []string {
	result := make([]string, 0, len(cardSections))
	for _, cardSection := range cardSections {
		result = append(result, parseCard(cardSection))
	}
	return result
}

func parseCard(cardSection string) string {
	sectionEnd := strings.Index(cardSection, ";")
	if sectionEnd == -1 {
		return cardSection
	}

	return cardSection[:sectionEnd]
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
	cards := parseCards(splitDoubleSemicolonArray(parts[1]))

	deckDict := make(map[string]int, len(cards))
	for _, idx := range d {
		if idx < 0 || idx >= len(cards) {
			return nil, errors.New("card index out of bounds")
		}

		name := cards[idx]
		deckDict[name]++
	}

	return deckDict, nil
}
