export interface SnapshotResult<TState> {
  index: number;
  state: TState;
}

export interface GameStateSyncCallbacks<
  TState extends Record<string, unknown>,
> {
  fetchSnapshot: () => Promise<SnapshotResult<TState> | null>;
  applyFullState: (state: TState) => void;
  applyPatch: (patch: Partial<TState>) => void;
  onResetSnapshot: (snapshot: TState) => void;
  onError?: (err: unknown) => void;
  random?: () => number;
  maxResyncJitterMs?: number;
}

/**
 * Coordinates Twitch PubSub / local SSE merge patches with full HTTP snapshot resyncs.
 * - Applies contiguous patches (gameStateIndex + 1 === index) directly without fetching.
 * - Coalesces bursts of out-of-sync messages into a single jittered snapshot fetch.
 * - Discards stale HTTP responses that resolve after a newer patch or an index === 0 reset.
 */
export class GameStateSyncController<TState extends Record<string, unknown>> {
  private readonly callbacks: GameStateSyncCallbacks<TState>;
  private readonly random: () => number;
  private readonly maxResyncJitterMs: number;

  private gameStateIndex = 0;
  private syncEpoch = 0;
  private inFlightFetch: Promise<void> | null = null;
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingResyncTarget: number | null = null;
  private disposed = false;

  constructor(callbacks: GameStateSyncCallbacks<TState>) {
    this.callbacks = callbacks;
    this.random = callbacks.random ?? Math.random;
    this.maxResyncJitterMs = callbacks.maxResyncJitterMs ?? 1000;
  }

  get currentIndex(): number {
    return this.gameStateIndex;
  }

  activate(): void {
    this.disposed = false;
  }

  resetEpoch(): void {
    this.syncEpoch++;
    this.gameStateIndex = 0;
    this.inFlightFetch = null;
    this.cancelResyncTimer();
    this.pendingResyncTarget = null;
  }

  dispose(): void {
    this.disposed = true;
    this.syncEpoch++;
    this.inFlightFetch = null;
    this.cancelResyncTimer();
    this.pendingResyncTarget = null;
  }

  handleParsedMessage(js: Record<string, unknown>): void {
    if (this.disposed) {
      return;
    }

    const index = js["gameStateIndex"] as number;
    if (index === 0) {
      this.syncEpoch++;
      this.cancelResyncTimer();
      this.pendingResyncTarget = null;
      this.gameStateIndex = 0;
      this.callbacks.onResetSnapshot(js as TState);
      return;
    }

    if (this.gameStateIndex + 1 === index) {
      this.gameStateIndex = index;
      this.callbacks.applyPatch(js as Partial<TState>);
      if (
        this.pendingResyncTarget !== null &&
        this.gameStateIndex >= this.pendingResyncTarget
      ) {
        this.pendingResyncTarget = null;
        this.cancelResyncTimer();
      }
      return;
    }

    if (this.gameStateIndex >= index) {
      return;
    }

    console.warn("index out of sync: ", this.gameStateIndex, " ", index);
    this.scheduleResync(index);
  }

  fetchNow(): Promise<void> {
    if (this.disposed) {
      return Promise.resolve();
    }

    this.cancelResyncTimer();
    if (this.inFlightFetch !== null) {
      return this.inFlightFetch;
    }

    const requestEpoch = this.syncEpoch;
    this.pendingResyncTarget = null;

    let task: Promise<void> | null = null;
    task = (async () => {
      try {
        const result = await this.callbacks.fetchSnapshot();
        if (!result || this.disposed) {
          return;
        }
        if (requestEpoch !== this.syncEpoch) {
          return;
        }
        if (result.index < this.gameStateIndex) {
          return;
        }
        this.gameStateIndex = result.index;
        this.callbacks.applyFullState(result.state);
      } catch (err) {
        if (this.callbacks.onError) {
          this.callbacks.onError(err);
        } else {
          console.error("Failed to fetch game state", err);
        }
      } finally {
        if (this.inFlightFetch === task) {
          this.inFlightFetch = null;
        }
        if (
          !this.disposed &&
          this.pendingResyncTarget !== null &&
          this.pendingResyncTarget > this.gameStateIndex
        ) {
          const nextTarget = this.pendingResyncTarget;
          this.pendingResyncTarget = null;
          this.scheduleResync(nextTarget);
        } else if (
          this.pendingResyncTarget !== null &&
          this.gameStateIndex >= this.pendingResyncTarget
        ) {
          this.pendingResyncTarget = null;
        }
      }
    })();

    this.inFlightFetch = task;
    return task;
  }

  private scheduleResync(targetIndex: number): void {
    if (this.disposed) {
      return;
    }
    this.pendingResyncTarget = Math.max(
      this.pendingResyncTarget ?? 0,
      targetIndex,
    );
    if (this.inFlightFetch !== null || this.resyncTimer !== null) {
      return;
    }

    const delayMs = Math.max(
      0,
      Math.floor(this.random() * this.maxResyncJitterMs),
    );
    this.resyncTimer = setTimeout(() => {
      this.resyncTimer = null;
      void this.fetchNow();
    }, delayMs);
  }

  private cancelResyncTimer(): void {
    if (this.resyncTimer !== null) {
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
    }
  }
}
