export type CardData = string | [string, number];

// Card keys may contain \u001F-separated variant info: "id\u001FenchantmentId:amount\u001FafflictionId"
// For STS1, the key is the display name. For STS2, the key is the card ID (e.g. "strike_ironclad").
// cardKey returns the full key (for dictionary lookups), cardName returns the base name/id only.
export const KEY_SEPARATOR = "\u001F";

export function cardKey(card: CardData): string {
  if (typeof card === "string") {
    return card;
  }
  return card[0];
}

export function cardName(card: CardData): string {
  const key = cardKey(card);
  const sep = key.indexOf(KEY_SEPARATOR);
  return sep === -1 ? key : key.substring(0, sep);
}

export function formatForSlaytabase(val: string): string {
  return val
    .split("+")[0]
    .replaceAll(":", "-")
    .replaceAll("'", "")
    .replaceAll(" ", "")
    .toLowerCase();
}
