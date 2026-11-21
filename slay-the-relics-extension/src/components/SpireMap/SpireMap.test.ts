import { describe, expect, it } from "vitest";
import { computeSts2MapLayout } from "./SpireMap";

function makeGrid(rows: number, cols = 7) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: "*", parents: [] as number[] })),
  );
  grid[0][3] = { type: "A", parents: [] };
  for (let r = 1; r < rows; r++) {
    grid[r][3] = { type: r === rows - 1 ? "R" : "M", parents: [3] };
  }
  return grid;
}

describe("computeSts2MapLayout", () => {
  it("centers single boss circle directly on bossCenter with boss radius", () => {
    const nodes = makeGrid(14);
    const layout = computeSts2MapLayout(nodes, [[3, 0], [3, 14]]);

    expect(layout.hasSecondBoss).toBe(false);
    expect(layout.secondBossCenter).toBeNull();

    const bossLoc = layout.getLocation(14, 3);
    expect(bossLoc.x + 64).toBe(layout.bossCenter.x);
    expect(bossLoc.y + 64).toBe(layout.bossCenter.y);
    expect(bossLoc.r).toBe(layout.bossRadius);
    expect(bossLoc.r).toBeGreaterThan(100);

    // Boss circle fits inside top of canvas and above top normal row
    const topRowLoc = layout.getLocation(13, 3);
    expect(layout.bossCenter.y - bossLoc.r).toBeGreaterThan(0);
    expect(layout.bossCenter.y + bossLoc.r).toBeLessThan(topRowLoc.y);
  });

  it("positions both bosses without overlap in double-boss mode", () => {
    const nodes = makeGrid(14);
    const layout = computeSts2MapLayout(
      nodes,
      [
        [3, 0],
        [3, 14],
        [3, 15],
      ],
      "test_subject_boss",
    );

    expect(layout.hasSecondBoss).toBe(true);
    expect(layout.secondBossCenter).not.toBeNull();

    const boss1Loc = layout.getLocation(14, 3);
    const boss2Loc = layout.getLocation(15, 3);

    expect(boss1Loc.x + 64).toBe(layout.bossCenter.x);
    expect(boss1Loc.y + 64).toBe(layout.bossCenter.y);
    expect(boss2Loc.x + 64).toBe(layout.secondBossCenter!.x);
    expect(boss2Loc.y + 64).toBe(layout.secondBossCenter!.y);
    expect(boss1Loc.r).toBe(layout.bossRadius);
    expect(boss2Loc.r).toBe(layout.bossRadius);

    // Second boss is above first boss with non-overlapping circles
    expect(layout.secondBossCenter!.y - boss2Loc.r).toBeGreaterThan(0);
    expect(layout.secondBossCenter!.y + boss2Loc.r).toBeLessThan(
      layout.bossCenter.y - boss1Loc.r,
    );

    // First boss sits cleanly above top normal row
    const topRowLoc = layout.getLocation(13, 3);
    expect(layout.bossCenter.y + boss1Loc.r).toBeLessThan(topRowLoc.y);
  });

  it("uses larger radius for Ancient starting node centered at row 0 col 3", () => {
    const nodes = makeGrid(14);
    const layout = computeSts2MapLayout(nodes, [[3, 0]]);

    const ancientLoc = layout.getLocation(0, 3);
    const normalLoc = layout.getLocation(1, 3);

    expect(ancientLoc.x + 64).toBe(layout.canvasW / 2);
    expect(ancientLoc.r).toBeGreaterThan(normalLoc.r);
    expect(ancientLoc.y + 64 + ancientLoc.r).toBeLessThan(layout.canvasH);
  });
});
