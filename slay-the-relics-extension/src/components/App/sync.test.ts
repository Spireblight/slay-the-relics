import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameStateSyncController, SnapshotResult } from "./sync";

interface MockState extends Record<string, unknown> {
  gameStateIndex: number;
  floor?: number;
  character?: string;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("GameStateSyncController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("applies contiguous patches directly without fetching", () => {
    const fetchSnapshot = vi.fn<() => Promise<SnapshotResult<MockState> | null>>();
    const patches: Partial<MockState>[] = [];
    const resets: MockState[] = [];

    const ctrl = new GameStateSyncController<MockState>({
      fetchSnapshot,
      applyFullState: vi.fn(),
      applyPatch: (p) => patches.push(p),
      onResetSnapshot: (s) => resets.push(s),
    });

    ctrl.handleParsedMessage({ gameStateIndex: 0, character: "Ironclad" });
    ctrl.handleParsedMessage({ gameStateIndex: 1, floor: 1 });
    ctrl.handleParsedMessage({ gameStateIndex: 2, floor: 2 });

    expect(ctrl.currentIndex).toBe(2);
    expect(resets).toHaveLength(1);
    expect(patches).toHaveLength(2);
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it("coalesces bursts of out-of-sync messages into a single jittered fetch", async () => {
    const fullStates: MockState[] = [];
    const fetchSnapshot = vi
      .fn<() => Promise<SnapshotResult<MockState> | null>>()
      .mockResolvedValue({
        index: 7,
        state: { gameStateIndex: 7, floor: 7 },
      });

    const ctrl = new GameStateSyncController<MockState>({
      fetchSnapshot,
      applyFullState: (s) => fullStates.push(s),
      applyPatch: vi.fn(),
      onResetSnapshot: vi.fn(),
      random: () => 0.4, // 400ms jitter
      maxResyncJitterMs: 1000,
    });

    ctrl.handleParsedMessage({ gameStateIndex: 5, floor: 5 });
    ctrl.handleParsedMessage({ gameStateIndex: 6, floor: 6 });
    ctrl.handleParsedMessage({ gameStateIndex: 7, floor: 7 });

    // Nothing fetched before jitter expires
    await vi.advanceTimersByTimeAsync(399);
    expect(fetchSnapshot).not.toHaveBeenCalled();

    // Single fetch fires at 400ms
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    expect(ctrl.currentIndex).toBe(7);
    expect(fullStates).toEqual([{ gameStateIndex: 7, floor: 7 }]);
  });

  it("discards stale HTTP responses older than current index", async () => {
    const deferred = createDeferred<SnapshotResult<MockState> | null>();
    const fullStates: MockState[] = [];
    const patches: Partial<MockState>[] = [];

    const ctrl = new GameStateSyncController<MockState>({
      fetchSnapshot: () => deferred.promise,
      applyFullState: (s) => fullStates.push(s),
      applyPatch: (p) => patches.push(p),
      onResetSnapshot: vi.fn(),
    });

    // Initial fetch starts at index 0
    const fetchPromise = ctrl.fetchNow();

    // Meanwhile contiguous patches advance to index 2
    ctrl.handleParsedMessage({ gameStateIndex: 1, floor: 1 });
    ctrl.handleParsedMessage({ gameStateIndex: 2, floor: 2 });
    expect(ctrl.currentIndex).toBe(2);

    // Older HTTP response (index 1) resolves late and must be ignored
    deferred.resolve({ index: 1, state: { gameStateIndex: 1, floor: 1 } });
    await fetchPromise;

    expect(ctrl.currentIndex).toBe(2);
    expect(fullStates).toHaveLength(0);
    expect(patches).toHaveLength(2);
  });

  it("discards in-flight HTTP responses from before an index === 0 reset and cancels pending jitter", async () => {
    const deferred = createDeferred<SnapshotResult<MockState> | null>();
    const fullStates: MockState[] = [];
    const resets: MockState[] = [];

    const ctrl = new GameStateSyncController<MockState>({
      fetchSnapshot: () => deferred.promise,
      applyFullState: (s) => fullStates.push(s),
      applyPatch: vi.fn(),
      onResetSnapshot: (s) => resets.push(s),
      random: () => 0.5,
      maxResyncJitterMs: 1000,
    });

    const fetchPromise = ctrl.fetchNow();
    ctrl.handleParsedMessage({ gameStateIndex: 0, character: "Silent" });

    // Stale fetch from prior run (index 42) must not overwrite new run at index 0
    deferred.resolve({ index: 42, state: { gameStateIndex: 42, character: "Ironclad" } });
    await fetchPromise;

    expect(ctrl.currentIndex).toBe(0);
    expect(fullStates).toHaveLength(0);
    expect(resets).toHaveLength(1);

    // Pending jitter timer should also be cancelled by index === 0
    const fetchSnapshot2 = vi.fn<() => Promise<SnapshotResult<MockState> | null>>();
    const ctrl2 = new GameStateSyncController<MockState>({
      fetchSnapshot: fetchSnapshot2,
      applyFullState: vi.fn(),
      applyPatch: vi.fn(),
      onResetSnapshot: vi.fn(),
      random: () => 0.5,
      maxResyncJitterMs: 1000,
    });

    ctrl2.handleParsedMessage({ gameStateIndex: 5, floor: 5 });
    ctrl2.handleParsedMessage({ gameStateIndex: 0, character: "Defect" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchSnapshot2).not.toHaveBeenCalled();
  });

  it("schedules a follow-up resync only when a newer out-of-sync frame arrived during an in-flight fetch", async () => {
    const first = createDeferred<SnapshotResult<MockState> | null>();
    const second = createDeferred<SnapshotResult<MockState> | null>();
    const fetchSnapshot = vi
      .fn<() => Promise<SnapshotResult<MockState> | null>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const fullStates: MockState[] = [];

    const ctrl = new GameStateSyncController<MockState>({
      fetchSnapshot,
      applyFullState: (s) => fullStates.push(s),
      applyPatch: vi.fn(),
      onResetSnapshot: vi.fn(),
      random: () => 0.2, // 200ms jitter
      maxResyncJitterMs: 1000,
    });

    ctrl.handleParsedMessage({ gameStateIndex: 5 });
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);

    // While first fetch is still in flight, index 8 arrives
    ctrl.handleParsedMessage({ gameStateIndex: 8 });

    // First fetch resolves with index 5 (< 8), so a follow-up resync is scheduled
    first.resolve({ index: 5, state: { gameStateIndex: 5, floor: 5 } });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(200);

    expect(fetchSnapshot).toHaveBeenCalledTimes(2);
    second.resolve({ index: 8, state: { gameStateIndex: 8, floor: 8 } });
    await Promise.resolve();

    expect(ctrl.currentIndex).toBe(8);
    expect(fullStates).toHaveLength(2);
  });

  it("does not spin in a retry loop when fetchSnapshot returns null (e.g. 404/503)", async () => {
    const fetchSnapshot = vi
      .fn<() => Promise<SnapshotResult<MockState> | null>>()
      .mockResolvedValue(null);

    const ctrl = new GameStateSyncController<MockState>({
      fetchSnapshot,
      applyFullState: vi.fn(),
      applyPatch: vi.fn(),
      onResetSnapshot: vi.fn(),
      random: () => 0.1,
      maxResyncJitterMs: 1000,
    });

    ctrl.handleParsedMessage({ gameStateIndex: 5 });
    await vi.advanceTimersByTimeAsync(5000);

    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
  });

  it("resumes fetching and message handling after dispose() + activate() (React StrictMode remount)", async () => {
    const first = createDeferred<SnapshotResult<MockState> | null>();
    const second = createDeferred<SnapshotResult<MockState> | null>();
    const fetchSnapshot = vi
      .fn<() => Promise<SnapshotResult<MockState> | null>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const fullStates: MockState[] = [];
    const patches: Partial<MockState>[] = [];

    const ctrl = new GameStateSyncController<MockState>({
      fetchSnapshot,
      applyFullState: (s) => fullStates.push(s),
      applyPatch: (p) => patches.push(p),
      onResetSnapshot: vi.fn(),
    });

    // Mount #1 starts initial fetch
    ctrl.activate();
    const mount1Fetch = ctrl.fetchNow();
    expect(fetchSnapshot).toHaveBeenCalledTimes(1);

    // StrictMode simulated unmount + remount on the same instance
    ctrl.dispose();
    ctrl.activate();
    const mount2Fetch = ctrl.fetchNow();
    expect(fetchSnapshot).toHaveBeenCalledTimes(2);

    // Mount #1's stale response resolves after remount -> must be ignored
    first.resolve({ index: 10, state: { gameStateIndex: 10, floor: 1 } });
    await mount1Fetch;
    expect(fullStates).toHaveLength(0);

    // Mount #2's response resolves -> applied cleanly
    second.resolve({ index: 12, state: { gameStateIndex: 12, floor: 3 } });
    await mount2Fetch;
    expect(ctrl.currentIndex).toBe(12);
    expect(fullStates).toEqual([{ gameStateIndex: 12, floor: 3 }]);

    // Subsequent contiguous patches apply normally
    ctrl.handleParsedMessage({ gameStateIndex: 13, floor: 4 });
    expect(ctrl.currentIndex).toBe(13);
    expect(patches).toHaveLength(1);
  });
});
