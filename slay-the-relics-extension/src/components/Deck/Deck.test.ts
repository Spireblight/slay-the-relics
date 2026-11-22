import { describe, expect, it, vi } from "vitest";
import { ImageLoader, probeImageExists, resolveCanUpgrade } from "./Deck";

describe("resolveCanUpgrade", () => {
  it("returns false and does not probe when card is missing or view is hidden", () => {
    const cache = new Map<string, boolean>();
    expect(resolveCanUpgrade(undefined, "sts2", true, null, cache)).toEqual({
      canUpgrade: false,
      probeUrl: null,
    });
    expect(resolveCanUpgrade("spoils_map", "sts2", false, null, cache)).toEqual(
      {
        canUpgrade: false,
        probeUrl: null,
      },
    );
  });

  it("allows toggling without probing when card is already upgraded", () => {
    const cache = new Map<string, boolean>();
    expect(resolveCanUpgrade("bash+", "sts2", true, null, cache)).toEqual({
      canUpgrade: true,
      probeUrl: null,
    });
    expect(
      resolveCanUpgrade(
        "strike_ironclad+\u001Fsharp:2\u001F",
        "sts2",
        true,
        null,
        cache,
      ),
    ).toEqual({
      canUpgrade: true,
      probeUrl: null,
    });
  });

  it("requests a probe for uncached un-upgraded cards and honors cached results", () => {
    const cache = new Map<string, boolean>();
    const initial = resolveCanUpgrade("spoils_map", "sts2", true, null, cache);
    expect(initial.canUpgrade).toBe(false);
    expect(initial.probeUrl).toMatch(
      /assets\/sts2\/card-images\/spoils_mapplusone\.png$/,
    );

    cache.set(initial.probeUrl!, false);
    expect(resolveCanUpgrade("spoils_map", "sts2", true, null, cache)).toEqual({
      canUpgrade: false,
      probeUrl: null,
    });

    cache.set(initial.probeUrl!, true);
    expect(resolveCanUpgrade("spoils_map", "sts2", true, null, cache)).toEqual({
      canUpgrade: true,
      probeUrl: null,
    });
  });

  it("ignores stale probe results for a different card URL", () => {
    const cache = new Map<string, boolean>();
    const res = resolveCanUpgrade(
      "spoils_map",
      "sts2",
      true,
      { url: "https://example.com/strike_ironcladplusone.png", exists: true },
      cache,
    );
    expect(res.canUpgrade).toBe(false);
    expect(res.probeUrl).toMatch(
      /assets\/sts2\/card-images\/spoils_mapplusone\.png$/,
    );
  });

  it("uses STS1 plus1 URLs when game is not sts2", () => {
    const cache = new Map<string, boolean>();
    const res = resolveCanUpgrade("Ascender's Bane", "", true, null, cache);
    expect(res.canUpgrade).toBe(false);
    expect(res.probeUrl).toMatch(
      /assets\/sts1\/card-images\/ascendersbaneplus1\.png$/,
    );
  });
});

describe("probeImageExists", () => {
  it("caches true on onload and false on onerror", () => {
    const cache = new Map<string, boolean>();
    const calls: { url: string; onLoad: () => void; onError: () => void }[] =
      [];
    const loadImage: ImageLoader = (url, onLoad, onError) => {
      calls.push({ url, onLoad, onError });
      return () => {};
    };

    const onSuccess = vi.fn();
    const p1 = probeImageExists("https://example.com/ok.png", cache, loadImage);
    expect(p1.cached).toBeUndefined();
    p1.start(onSuccess);
    expect(calls[0].url).toBe("https://example.com/ok.png");
    calls[0].onLoad();
    expect(onSuccess).toHaveBeenCalledWith(true);
    expect(cache.get("https://example.com/ok.png")).toBe(true);

    const onFail = vi.fn();
    const p2 = probeImageExists(
      "https://example.com/missing.png",
      cache,
      loadImage,
    );
    p2.start(onFail);
    calls[1].onError();
    expect(onFail).toHaveBeenCalledWith(false);
    expect(cache.get("https://example.com/missing.png")).toBe(false);

    // Subsequent calls return cached result immediately without invoking loader
    const p3 = probeImageExists(
      "https://example.com/missing.png",
      cache,
      loadImage,
    );
    expect(p3.cached).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("suppresses callback and invokes cleanup when cancelled before load finishes", () => {
    const cache = new Map<string, boolean>();
    let triggerLoad!: () => void;
    const cleanup = vi.fn();
    const loadImage: ImageLoader = (_url, onLoad) => {
      triggerLoad = onLoad;
      return cleanup;
    };
    const onResult = vi.fn();

    const probe = probeImageExists(
      "https://example.com/slow.png",
      cache,
      loadImage,
    );
    const cancel = probe.start(onResult);
    cancel();
    triggerLoad();

    expect(cleanup).toHaveBeenCalledOnce();
    expect(onResult).not.toHaveBeenCalled();
  });
});
