import { createContext } from "react";

export type Cards = Record<
  string,
  {
    NAME: string;
    DESCRIPTION: string;
    UPGRADE_DESCRIPTION?: string;
    EXTENDED_DESCRIPTION?: string[];
  }
>;

export type Keywords = Record<string, { NAMES: string[]; DESCRIPTION: string }>;

export type Relics = Record<string, { NAME: string; DESCRIPTIONS: string[] }>;

export type Potions = Record<string, { NAME: string; DESCRIPTIONS: string[] }>;

enum LocalizationKind {
  Cards = "cards",
  Keywords = "keywords",
  Relics = "relics",
  Potions = "potions",
}

enum GameKind {
  Sts1 = "sts1",
}

export function localizationURL(
  game: GameKind,
  kind: LocalizationKind,
): string {
  return `https://raw.githubusercontent.com/Spireblight/STR-Backend/refs/heads/master/assets/${game}/localization/${kind}.json`;
}

export interface LocalizationData extends Record<LocalizationKind, unknown> {
  cards: Cards;
  keywords: Keywords;
  relics: Relics;
  potions: Potions;
}

export const LocalizationContext = createContext({
  cards: {},
  keywords: {},
  relics: {},
  potions: {},
} as LocalizationData);

export async function fetchLocalizationData() {
  const localizationData: Record<LocalizationKind, unknown> = {
    cards: {},
    keywords: {},
    relics: {},
    potions: {},
  };
  for (const kind of Object.values(LocalizationKind)) {
    const response = await fetch(localizationURL(GameKind.Sts1, kind));
    if (!response.ok) {
      throw new Error(`Failed to fetch localization data for ${kind}`);
    }
    localizationData[kind] = await response.json();
  }
  return localizationData as LocalizationData;
}
