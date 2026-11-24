#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");

const require = createRequire(
  path.join(repoRoot, "slay-the-relics-extension", "package.json"),
);
const { chromium } = require("playwright-core");

function parseArgs(argv) {
  const opts = {
    url: "",
    backendUrl: "",
    channel: "",
    outDir: "",
    patch: "",
    viewport: "1920x1080",
    chromiumBin: process.env.CHROMIUM_BIN || "",
    actions: "",
    noFail: false,
    skipDefaultChecks: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--url":
        opts.url = argv[++i];
        break;
      case "--backend-url":
        opts.backendUrl = argv[++i];
        break;
      case "--channel":
        opts.channel = argv[++i];
        break;
      case "--out-dir":
        opts.outDir = argv[++i];
        break;
      case "--patch":
        opts.patch = argv[++i];
        break;
      case "--viewport":
        opts.viewport = argv[++i];
        break;
      case "--chromium":
        opts.chromiumBin = argv[++i];
        break;
      case "--actions":
        opts.actions = argv[++i];
        break;
      case "--no-fail":
        opts.noFail = true;
        break;
      case "--skip-default-checks":
        opts.skipDefaultChecks = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.url) throw new Error("--url is required");
  if (!opts.outDir) throw new Error("--out-dir is required");
  return opts;
}

function findChromium(explicit) {
  const candidates = [
    explicit,
    "/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Could not find Chromium binary. Checked: ${candidates.join(", ")}. Set CHROMIUM_BIN or pass --chromium.`,
  );
}

function parseViewport(str) {
  const match = /^(\d+)x(\d+)$/i.exec(str);
  if (!match) {
    throw new Error(`Invalid --viewport "${str}", expected WxH (e.g. 1920x1080)`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

async function postStateFile(backendUrl, channel, filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  raw.channel = channel;
  const resp = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v2/game-state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(raw),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`POST /api/v2/game-state failed (${resp.status}): ${text}`);
  }
  return raw;
}

async function collectBrokenImages(page, stepName) {
  return await page.evaluate((step) => {
    const broken = [];
    for (const img of document.querySelectorAll("img")) {
      const style = window.getComputedStyle(img);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (!img.complete || img.naturalWidth === 0) {
        broken.push({
          step,
          src: img.currentSrc || img.getAttribute("src") || "",
          alt: img.alt || "",
        });
      }
    }
    return broken;
  }, stepName);
}

async function waitForImagesLoaded(page, timeoutMs = 5000) {
  await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll("img")).every(
          (img) => img.complete,
        ),
      { timeout: timeoutMs },
    )
    .catch(() => {});
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const viewport = parseViewport(opts.viewport);
  const executablePath = findChromium(opts.chromiumBin);

  fs.mkdirSync(opts.outDir, { recursive: true });

  const report = {
    ok: true,
    timestamp: new Date().toISOString(),
    url: opts.url,
    backendUrl: opts.backendUrl,
    channel: opts.channel,
    viewport,
    chromium: executablePath,
    screenshots: [],
    checks: [],
    sse: {
      connected: false,
      status: null,
      events: [],
    },
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    brokenImages: [],
  };

  function addCheck(name, passed, details = "") {
    report.checks.push({ name, passed, details });
    if (!passed) {
      report.ok = false;
    }
  }

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");

    cdp.on("Network.eventSourceMessageReceived", (ev) => {
      report.sse.events.push({
        eventName: ev.eventName,
        eventId: ev.eventId,
        dataLength: ev.data ? ev.data.length : 0,
        timestamp: ev.timestamp,
      });
    });

    page.on("console", (msg) => {
      const loc = msg.location();
      if (loc?.url?.endsWith("/favicon.ico")) {
        return;
      }
      const entry = {
        type: msg.type(),
        text: msg.text(),
        location: loc,
      };
      if (msg.type() === "error") {
        report.consoleErrors.push(entry);
      } else if (msg.type() === "warning") {
        report.consoleWarnings.push(entry);
      }
    });

    page.on("pageerror", (err) => {
      report.pageErrors.push({
        message: err.message,
        stack: err.stack || "",
      });
    });

    page.on("requestfailed", (req) => {
      // EventSource aborts cleanly when the browser closes at the end of verification.
      const failure = req.failure()?.errorText || "unknown";
      if (req.url().includes("/api/dev/events/") && failure === "net::ERR_ABORTED") {
        return;
      }
      report.failedRequests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        failure,
      });
    });

    page.on("response", (resp) => {
      const url = resp.url();
      const status = resp.status();
      if (url.includes("/api/dev/events/")) {
        report.sse.status = status;
        report.sse.connected = status === 200;
      }
      if (status >= 400 && !url.endsWith("/favicon.ico")) {
        report.httpErrors.push({
          url,
          status,
          statusText: resp.statusText(),
        });
      }
    });

    async function screenshot(filename) {
      const fullPath = path.join(opts.outDir, filename);
      await page.screenshot({ path: fullPath });
      report.screenshots.push(fullPath);
      return fullPath;
    }

    await page.goto(opts.url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page
      .locator("#relic-bar .hitbox, #map_button")
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(400);
    await waitForImagesLoaded(page);

    if (!opts.skipDefaultChecks) {
      const initialRelicCount = await page.locator("#relic-bar .hitbox").count();
      addCheck(
        "initial-snapshot-loaded",
        initialRelicCount > 0,
        `Rendered ${initialRelicCount} relic hitboxes`,
      );
      addCheck(
        "sse-connected",
        report.sse.connected,
        `SSE HTTP status: ${report.sse.status}`,
      );

      // 1. Base overlay
      await screenshot("01-overlay.png");
      report.brokenImages.push(...(await collectBrokenImages(page, "overlay")));

      // 2. Relic tooltip
      const firstRelic = page.locator("#relic-bar .hitbox").first();
      if ((await firstRelic.count()) > 0) {
        await firstRelic.hover();
        await page.waitForTimeout(250);
        const tipText = (await page.locator("#root-tooltip").textContent())?.trim() || "";
        addCheck("relic-tooltip", tipText.length > 0, tipText.slice(0, 120));
        await screenshot("02-relic-tooltip.png");
      }

      // 3. Potion tooltip (hitboxes directly under App > div that are not inside #relic-bar)
      const nonRelicHitboxes = page.locator(".App > div:not(#relic-bar) .hitbox");
      const nonRelicCount = await nonRelicHitboxes.count();
      if (nonRelicCount > 0) {
        await nonRelicHitboxes.first().hover();
        await page.waitForTimeout(250);
        const tipText = (await page.locator("#root-tooltip").textContent())?.trim() || "";
        addCheck("potion-tooltip", tipText.length > 0, tipText.slice(0, 120));
        await screenshot("03-potion-tooltip.png");
      }

      // 4. Combat / static hitbox tooltip (last non-relic hitbox)
      if (nonRelicCount > 1) {
        const lastHitbox = nonRelicHitboxes.last();
        await lastHitbox.hover();
        await page.waitForTimeout(250);
        const tipText = (await page.locator("#root-tooltip").textContent())?.trim() || "";
        addCheck("combat-or-static-tooltip", tipText.length > 0, tipText.slice(0, 120));
        await screenshot("04-hitbox-tooltip.png");
      }

      // Dismiss tooltip
      await page.mouse.move(0, 0);
      await page.waitForTimeout(150);

      // 5. Map modal
      const mapBtn = page.locator("#map_button");
      if ((await mapBtn.count()) > 0) {
        await mapBtn.click();
        await page.locator("#spire-map canvas").waitFor({ state: "visible", timeout: 5000 });
        await page.waitForTimeout(500);
        const mapPixels = await page.evaluate(() => {
          const canvas = document.querySelector("#spire-map canvas");
          if (!canvas) return { width: 0, height: 0, nonZeroAlpha: 0 };
          const ctx = canvas.getContext("2d");
          if (!ctx) return { width: canvas.width, height: canvas.height, nonZeroAlpha: 0 };
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let nonZeroAlpha = 0;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) nonZeroAlpha++;
          }
          return { width: canvas.width, height: canvas.height, nonZeroAlpha };
        });
        addCheck(
          "map-canvas-rendered",
          mapPixels.width > 0 && mapPixels.height > 0 && mapPixels.nonZeroAlpha > 0,
          `${mapPixels.width}x${mapPixels.height}, ${mapPixels.nonZeroAlpha} painted pixels`,
        );
        await screenshot("05-map.png");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(150);
      }

      // 6. Master Deck modal
      const deckButtons = page.locator("#deck_button");
      const deckBtnCount = await deckButtons.count();
      if (deckBtnCount > 0) {
        await deckButtons.nth(0).click();
        await page.locator(".deck-card").first().waitFor({ state: "visible", timeout: 5000 });
        await page.waitForTimeout(500);
        await waitForImagesLoaded(page);
        const cardCount = await page.locator(".deck-card:visible").count();
        addCheck("deck-modal-opened", cardCount > 0, `${cardCount} visible cards`);
        report.brokenImages.push(...(await collectBrokenImages(page, "deck")));
        await screenshot("06-deck.png");

        // 7. Card zoom view
        const targetIdx = cardCount > 1 ? 1 : 0;
        await page.locator(".deck-card:visible").nth(targetIdx).click();
        await page.locator(".card-view.flex").waitFor({ state: "visible", timeout: 5000 });
        await page.waitForTimeout(300);
        await waitForImagesLoaded(page);
        addCheck("card-view-opened", true, `Opened card index ${targetIdx}`);
        report.brokenImages.push(...(await collectBrokenImages(page, "card-view")));
        await screenshot("07-card-view.png");

        await page.keyboard.press("Escape");
        await page.waitForTimeout(150);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(150);
      }

      // 8. Draw Pile modal (second #deck_button)
      if (deckBtnCount > 1 && (await deckButtons.nth(1).isVisible())) {
        await deckButtons.nth(1).click();
        await page.locator(".deck-card:visible").first().waitFor({ state: "visible", timeout: 5000 });
        await page.waitForTimeout(350);
        await waitForImagesLoaded(page);
        const drawCount = await page.locator(".deck-card:visible").count();
        addCheck("draw-pile-opened", drawCount > 0, `${drawCount} visible draw-pile cards`);
        await screenshot("08-draw-pile.png");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(150);
      }

      // 9. Live SSE patch verification
      if (opts.patch && opts.backendUrl) {
        const sseBefore = report.sse.events.length;
        const relicsBefore = await page.locator("#relic-bar .hitbox").count();
        const patchedPayload = await postStateFile(
          opts.backendUrl,
          opts.channel,
          opts.patch,
        );
        const expectedRelics = Array.isArray(patchedPayload.relics)
          ? patchedPayload.relics.length
          : relicsBefore;

        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          const curRelics = await page.locator("#relic-bar .hitbox").count();
          if (report.sse.events.length > sseBefore && curRelics === expectedRelics) {
            break;
          }
          await page.waitForTimeout(100);
        }

        const relicsAfter = await page.locator("#relic-bar .hitbox").count();
        const sseDelta = report.sse.events.length - sseBefore;
        addCheck(
          "live-sse-patch",
          sseDelta > 0 && relicsAfter === expectedRelics,
          `SSE frames received: ${sseDelta}, relics: ${relicsBefore} -> ${relicsAfter} (expected ${expectedRelics})`,
        );

        await screenshot("09-after-patch.png");

        if (relicsAfter > 0) {
          await page.locator("#relic-bar .hitbox").last().hover();
          await page.waitForTimeout(250);
          const patchedTip = (await page.locator("#root-tooltip").textContent())?.trim() || "";
          addCheck("patched-relic-tooltip", patchedTip.length > 0, patchedTip.slice(0, 120));
          await screenshot("10-patched-relic-tooltip.png");
        }
      }
    }

    // Optional custom verification hook
    if (opts.actions) {
      const mod = await import(pathToFileURL(path.resolve(opts.actions)).href);
      if (typeof mod.default !== "function") {
        throw new Error(`--actions module ${opts.actions} must have a default export function`);
      }
      await mod.default({
        page,
        cdp,
        backendUrl: opts.backendUrl,
        channel: opts.channel,
        outDir: opts.outDir,
        postState: (filePath) => postStateFile(opts.backendUrl, opts.channel, filePath),
        screenshot,
        addCheck,
        report,
      });
    }
  } catch (err) {
    report.ok = false;
    report.fatalError = err instanceof Error ? err.message : String(err);
    try {
      const pages = browser.contexts().flatMap((c) => c.pages());
      if (pages.length > 0) {
        const failPath = path.join(opts.outDir, "fatal-error.png");
        await pages[0].screenshot({ path: failPath });
        report.screenshots.push(failPath);
      }
    } catch {
      // ignore screenshot failure
    }
    throw err;
  } finally {
    await browser.close();

    if (
      report.consoleErrors.length > 0 ||
      report.pageErrors.length > 0 ||
      report.failedRequests.length > 0 ||
      report.httpErrors.length > 0 ||
      report.brokenImages.length > 0
    ) {
      report.ok = false;
    }

    const reportPath = path.join(opts.outDir, "report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("");
    console.log("=== Extension Verification Summary ===");
    console.log(`Status:           ${report.ok ? "PASS" : "FAIL"}`);
    console.log(`Channel:          ${report.channel}`);
    console.log(`Viewport:         ${viewport.width}x${viewport.height}`);
    console.log(`SSE Connected:    ${report.sse.connected} (${report.sse.events.length} broadcast events)`);
    console.log(`Console Errors:   ${report.consoleErrors.length}`);
    console.log(`Console Warnings: ${report.consoleWarnings.length}`);
    console.log(`Page Errors:      ${report.pageErrors.length}`);
    console.log(`Failed Requests:  ${report.failedRequests.length}`);
    console.log(`HTTP >=400:       ${report.httpErrors.length}`);
    console.log(`Broken Images:    ${report.brokenImages.length}`);
    console.log(`Screenshots:      ${report.screenshots.length}`);
    console.log(`Report:           ${reportPath}`);
    for (const check of report.checks) {
      console.log(`  [${check.passed ? "OK" : "FAIL"}] ${check.name}: ${check.details}`);
    }
    if (report.fatalError) {
      console.error(`Fatal Error:      ${report.fatalError}`);
    }
  }

  if (!report.ok && !opts.noFail) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
