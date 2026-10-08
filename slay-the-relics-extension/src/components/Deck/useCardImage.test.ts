// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cardPreviewUrl, useCardImage } from "./useCardImage";

vi.mock("../../generated/card-previews.json", () => ({
  default: {
    sts1: Object.fromEntries(
      [
        "bashplus1",
        "decoded",
        "duplicate",
        "changing",
        "changingplus1",
        "next",
        "failure-download",
        "failure-decode",
      ].map((name) => [`${name}.png`, `data:image/webp;base64,${name}`]),
    ),
    sts2: {
      "strike_ironcladplusone.png": "data:image/webp;base64,sts2-upgrade",
      "hidden.png": "data:image/webp;base64,hidden",
    },
  },
}));

class MockImage {
  static requests: MockImage[] = [];
  src = "";
  onload?: () => void;
  onerror?: () => void;
  decode = vi.fn(() => Promise.resolve());
  constructor() {
    MockImage.requests.push(this);
  }
}

function request(url: string): MockImage {
  const image = MockImage.requests.find((image) => image.src === url);
  if (!image) throw new Error(`No request for ${url}`);
  return image;
}

async function flushImage(update: () => void) {
  await act(async () => {
    update();
    await Promise.resolve();
  });
}

beforeEach(() => {
  MockImage.requests = [];
  vi.stubGlobal("Image", MockImage);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const originalUrl = (filename: string, game = "sts1") =>
  `https://raw.githubusercontent.com/Spireblight/slay-the-relics/refs/heads/master/assets/${game}/card-images/${filename}.png`;

describe("card previews", () => {
  it("resolves upgraded card data and variants for both games", () => {
    const sts1 = renderHook(() =>
      useCardImage({ data: ["Bash+", 3], visible: true }),
    );
    expect(sts1.result.current).toBe("data:image/webp;base64,bashplus1");
    expect(request(originalUrl("bashplus1"))).toBeDefined();

    const sts2 = renderHook(() =>
      useCardImage({
        data: "STRIKE_IRONCLAD+\u001Fburn:2\u001Fbound",
        game: "sts2",
        visible: true,
      }),
    );
    expect(sts2.result.current).toBe("data:image/webp;base64,sts2-upgrade");
    expect(
      request(originalUrl("strike_ironcladplusone", "sts2")),
    ).toBeDefined();
  });

  it("warms previews while hidden and downloads originals only when opened", () => {
    const url = originalUrl("hidden", "sts2");
    const { result, rerender } = renderHook(
      ({ visible }) => useCardImage({ data: "hidden", game: "sts2", visible }),
      { initialProps: { visible: false } },
    );
    expect(result.current).toBe(cardPreviewUrl(url, "sts2"));
    expect(MockImage.requests.map((image) => image.src)).toEqual([
      result.current,
    ]);
    rerender({ visible: true });
    expect(request(url)).toBeDefined();
  });

  it("keeps the preview until the original has decoded, then reuses it on reopen", async () => {
    const url = originalUrl("decoded");
    const { result, unmount } = renderHook(() =>
      useCardImage({ data: "decoded", game: "sts1", visible: true }),
    );
    let finishDecode!: () => void;
    request(url).decode.mockReturnValue(
      new Promise<void>((resolve) => {
        finishDecode = resolve;
      }),
    );
    await flushImage(() => {
      request(url).onload?.();
    });
    expect(result.current).toBe(cardPreviewUrl(url, "sts1"));
    await flushImage(() => {
      finishDecode();
    });
    expect(result.current).toBe(url);
    unmount();
    const reopened = renderHook(() =>
      useCardImage({ data: "decoded", game: "sts1", visible: true }),
    );
    expect(reopened.result.current).toBe(url);
    expect(
      MockImage.requests.filter((image) => image.src === url),
    ).toHaveLength(1);
  });

  it("shares in-flight requests between duplicate cards", async () => {
    const url = originalUrl("duplicate");
    const first = renderHook(() =>
      useCardImage({ data: "duplicate", visible: true }),
    );
    const second = renderHook(() =>
      useCardImage({ data: "duplicate", visible: true }),
    );
    expect(MockImage.requests).toHaveLength(2);
    await flushImage(() => {
      request(url).onload?.();
    });
    expect(first.result.current).toBe(url);
    expect(second.result.current).toBe(url);
  });

  it("does not apply a late result to a different card or upgrade", async () => {
    const base = originalUrl("changing");
    const upgrade = originalUrl("changingplus1");
    const { result, rerender } = renderHook(
      ({ data }) => useCardImage({ data, visible: true }),
      { initialProps: { data: "changing" } },
    );
    rerender({ data: "changing+" });
    await flushImage(() => {
      request(base).onload?.();
    });
    expect(result.current).toBe(cardPreviewUrl(upgrade));
    await flushImage(() => {
      request(upgrade).onload?.();
    });
    expect(result.current).toBe(upgrade);
    rerender({ data: "next" });
    expect(result.current).toBe(cardPreviewUrl(originalUrl("next")));
  });

  it.each(["download", "decode"])(
    "keeps previews after %s failure and retries on reopening",
    async (failure) => {
      const url = originalUrl(`failure-${failure}`);
      const { result, rerender } = renderHook(
        ({ visible }) => useCardImage({ data: `failure-${failure}`, visible }),
        { initialProps: { visible: true } },
      );
      await flushImage(() => {
        if (failure === "download") request(url).onerror?.();
        else {
          request(url).decode.mockRejectedValue(new Error("decode failed"));
          request(url).onload?.();
        }
      });
      expect(result.current).toBe(cardPreviewUrl(url));
      rerender({ visible: false });
      rerender({ visible: true });
      const attempts = MockImage.requests.filter((image) => image.src === url);
      expect(attempts).toHaveLength(2);
      await flushImage(() => {
        attempts[1].onload?.();
      });
      expect(result.current).toBe(url);
    },
  );

  it("still loads originals when a preview is missing", async () => {
    const url = originalUrl("new-card");
    const { result } = renderHook(() =>
      useCardImage({ data: "new-card", visible: true }),
    );
    expect(result.current).toBe(url);
    expect(MockImage.requests).toHaveLength(1);
    await flushImage(() => {
      request(url).onload?.();
    });
    expect(result.current).toBe(url);
  });
});
