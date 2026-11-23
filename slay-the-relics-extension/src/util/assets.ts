const DEFAULT_ASSET_BASE_URL = "https://assets.slay-the-relics.sonoda.moe/";

export const ASSET_BASE_URL: string = (
  import.meta.env.VITE_ASSET_BASE_URL ?? DEFAULT_ASSET_BASE_URL
).replace(/\/?$/, "/");

export function assetUrl(path: string): string {
  return `${ASSET_BASE_URL}${path.replace(/^\/+/, "")}`;
}

export function cardTipAssetUrl(imgPath: string): string {
  const normalized = imgPath.replace(/^\/+/, "");
  if (normalized.startsWith("assets/sts2/card-images/")) {
    return assetUrl(normalized.replace(/\.png$/i, ".webp"));
  }
  return assetUrl(normalized);
}
