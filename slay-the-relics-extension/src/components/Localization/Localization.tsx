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
