import { describe, expect, it } from "vitest";
import { ASSET_BASE_URL, assetUrl, cardTipAssetUrl } from "./assets";

describe("assetUrl", () => {
  it("uses the R2 CDN base URL by default", () => {
    expect(ASSET_BASE_URL).toBe("https://assets.slay-the-relics.sonoda.moe/");
  });

  it("joins relative paths without duplicate slashes", () => {
    expect(assetUrl("assets/sts2/card-images/bash.webp")).toBe(
      `${ASSET_BASE_URL}assets/sts2/card-images/bash.webp`,
    );
    expect(assetUrl("/assets/sts1/localization/cards.json")).toBe(
      `${ASSET_BASE_URL}assets/sts1/localization/cards.json`,
    );
  });
});

describe("cardTipAssetUrl", () => {
  it("maps legacy STS2 .png card tip paths to .webp", () => {
    expect(cardTipAssetUrl("assets/sts2/card-images/bash.png")).toBe(
      `${ASSET_BASE_URL}assets/sts2/card-images/bash.webp`,
    );
    expect(cardTipAssetUrl("assets/sts2/card-images/bashplusone.webp")).toBe(
      `${ASSET_BASE_URL}assets/sts2/card-images/bashplusone.webp`,
    );
  });

  it("keeps STS1 card paths as .png", () => {
    expect(cardTipAssetUrl("assets/sts1/card-images/bash.png")).toBe(
      `${ASSET_BASE_URL}assets/sts1/card-images/bash.png`,
    );
  });
});
