import { describe, expect, it } from "vitest";
import { dedupeTips, expandTips, Tip } from "./Tip";
import { Keywords } from "../Localization/Localization";

describe("dedupeTips", () => {
  it("removes exact duplicate tips while preserving order", () => {
    const relicTip = new Tip(
      "Archaic Tooth",
      "Transforms Bash into Break.",
      null,
    );
    const vuln1 = new Tip("Vulnerable", "Takes 50% more damage.", "");
    const vuln2 = new Tip("Vulnerable", "Takes 50% more damage.", "");
    const bashCard = new Tip(
      "Bash",
      "",
      "assets/sts2/card-images/bash.png",
      "card",
    );
    const breakCard = new Tip(
      "Break",
      "",
      "assets/sts2/card-images/break.png",
      "card",
    );

    expect(dedupeTips([relicTip, vuln1, bashCard, vuln2, breakCard])).toEqual([
      relicTip,
      vuln1,
      bashCard,
      breakCard,
    ]);
  });

  it("keeps distinct tips even if descriptions differ", () => {
    const a = new Tip("Strength", "Increases attack damage.", "");
    const b = new Tip("Strength", "Different description.", "");
    expect(dedupeTips([a, b])).toEqual([a, b]);
  });
});

describe("expandTips", () => {
  const keywords: Keywords = {
    dexterity: {
      NAMES: ["dexterity"],
      DESCRIPTION: "Dexterity improves Block gained from cards.",
    },
    vulnerable: {
      NAMES: ["vulnerable"],
      DESCRIPTION: "Target takes 50% more damage from Attacks.",
    },
  };

  it("expands keywords that are not already present in tips", () => {
    const relic = new Tip("Oddly Smooth Stone", "Gain 1 #yDexterity.", null);
    const expanded = expandTips([relic], keywords);
    expect(expanded.map((t) => t.header)).toEqual([
      "Oddly Smooth Stone",
      "Dexterity",
    ]);
  });

  it("does not append a duplicate keyword tooltip when one with the same header already exists", () => {
    const relic = new Tip("Oddly Smooth Stone", "Gain 1 Dexterity.", null);
    const sts2Dex = new Tip(
      "Dexterity",
      "Increases Block gained from cards.",
      "",
    );
    const expanded = expandTips([relic, sts2Dex], keywords);
    expect(expanded).toEqual([relic, sts2Dex]);
  });
});
