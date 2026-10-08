import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";

const extensionRoot = new URL("../", import.meta.url);
const previews = {};
let count = 0;
let originalBytes = 0;
let previewBytes = 0;

for (const game of ["sts1", "sts2"]) {
  const sourceDir = new URL(`../assets/${game}/card-images/`, extensionRoot);
  previews[game] = {};
  const filenames = (await readdir(sourceDir))
    .filter((filename) => filename.endsWith(".png"))
    .sort();
  if (!filenames.length) throw new Error(`No card PNGs found for ${game}`);

  // Bound memory use when decoding the full-resolution source collection.
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < filenames.length) {
        const filename = filenames[next++];
        const source = join(fileURLToPath(sourceDir), filename);
        const result = await sharp(source)
          .resize({ width: 96, withoutEnlargement: true })
          .webp({ quality: 35, alphaQuality: 60, effort: 4 })
          .toBuffer();
        previews[game][filename] =
          `data:image/webp;base64,${result.toString("base64")}`;
        const sourceStats = await stat(source);
        originalBytes += sourceStats.size;
        previewBytes += result.length;
        count++;
      }
    }),
  );
}

// Stable key order keeps output deterministic despite concurrent encoding.
const output = Object.fromEntries(
  Object.entries(previews).map(([game, cards]) => [
    game,
    Object.fromEntries(
      Object.entries(cards).sort(([a], [b]) => a.localeCompare(b)),
    ),
  ]),
);
const outputDir = new URL("src/generated/", extensionRoot);
await mkdir(outputDir, { recursive: true });
await writeFile(
  new URL("card-previews.json", outputDir),
  JSON.stringify(output),
);

console.log(
  `Generated ${count} card previews: ${(originalBytes / 1024 / 1024).toFixed(1)} MiB → ${(previewBytes / 1024 / 1024).toFixed(1)} MiB (${(100 * (1 - previewBytes / originalBytes)).toFixed(1)}% smaller)`,
);
