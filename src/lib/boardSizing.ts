// Board sizing — picks the smallest board ≥ wall height to minimise off-cut waste.
// Boards are stocked at 1200 mm wide × {1800, 2400, 3000, 3600} mm long.
// Vertical orientation: board length must cover wall height.

export const BOARD_LIBRARY: { label: string; width: number; height: number; pricePerM2: number }[] = [
  { label: "900 × 1800",  width:  900, height: 1800, pricePerM2: 4.10 },
  { label: "1200 × 2400", width: 1200, height: 2400, pricePerM2: 3.92 },
  { label: "1200 × 3000", width: 1200, height: 3000, pricePerM2: 4.20 },
  { label: "1200 × 3600", width: 1200, height: 3600, pricePerM2: 4.45 },
];

/** Filter the global library by labels available for a given system. */
export function getAvailableBoards(allowedLabels?: string[]) {
  if (!allowedLabels || allowedLabels.length === 0) return BOARD_LIBRARY;
  const set = new Set(allowedLabels);
  return BOARD_LIBRARY.filter(b => set.has(b.label));
}

export function recommendBoard(wallHeightMm: number, allowedLabels?: string[]): {
  label: string;
  height: number;
  reason: string;
  needsHorizontalJoint: boolean;
} {
  const lib = getAvailableBoards(allowedLabels);
  const fallback = lib[0] ?? BOARD_LIBRARY[1];
  if (!wallHeightMm || wallHeightMm <= 0) {
    return { label: fallback.label, height: fallback.height, reason: "Default size", needsHorizontalJoint: false };
  }
  const single = lib.find(b => b.height >= wallHeightMm);
  if (single) {
    const offcut = single.height - wallHeightMm;
    return {
      label: single.label,
      height: single.height,
      reason: `Single board covers ${wallHeightMm} mm with ${offcut} mm off-cut`,
      needsHorizontalJoint: false,
    };
  }
  const tallest = lib[lib.length - 1];
  return {
    label: tallest.label,
    height: tallest.height,
    reason: `Wall exceeds ${tallest.height} mm — tallest available board, adds horizontal joint`,
    needsHorizontalJoint: true,
  };
}

export function boardOffcutWaste(wallHeightMm: number, boardLabel: string): number {
  const board = BOARD_LIBRARY.find(b => b.label === boardLabel);
  if (!board || !wallHeightMm) return 0;
  if (wallHeightMm > board.height) {
    // Need 2+ boards stacked. Total board length used = ceil(h/H) * H.
    // Waste = unused portion of the last board.
    const piecesPerColumn = Math.ceil(wallHeightMm / board.height);
    const usedTotal = piecesPerColumn * board.height;
    const offcut = usedTotal - wallHeightMm;
    return Math.round((offcut / usedTotal) * 100);
  }
  return Math.round(((board.height - wallHeightMm) / board.height) * 100);
}

/** Number of board pieces needed per vertical column for a wall of given height. */
export function piecesPerColumn(wallHeightMm: number, boardLabel: string): number {
  const board = BOARD_LIBRARY.find(b => b.label === boardLabel);
  if (!board || !wallHeightMm) return 0;
  return Math.max(1, Math.ceil(wallHeightMm / board.height));
}

/**
 * Net waste % when off-cuts that still carry a factory edge are re-used in
 * subsequent columns. Each off-cut keeps a factory edge on exactly one end
 * (the un-cut side). To re-use it on a new column the factory edge must butt
 * against the joint with the main piece, which means we must cut the off-cut
 * down to the exact gap size — and the remainder of that cut is scrap (it
 * has lost both factory edges and cannot be joint-taped cleanly again).
 *
 * Example (3.2 m wall, 1200×2400 board):
 *  • Column 1: full board (2400) + cut 800 from a second board → 1600 off-cut keeps factory edge.
 *  • Column 2: full board (2400) + need 800 more → cut 800 from the 1600 off-cut, 800 mm scrap.
 *
 * Net waste = (boards bought × board area − wall area) / (boards bought × board area).
 */
export function boardNetWasteWithReuse(
  wallHeightMm: number,
  wallLengthMm: number,
  boardLabel: string,
): number {
  const board = BOARD_LIBRARY.find(b => b.label === boardLabel);
  if (!board || !wallHeightMm || !wallLengthMm) return 0;

  const columns = Math.max(1, Math.ceil(wallLengthMm / board.width));
  // Inventory of factory-edge off-cuts available for re-use, sorted largest first.
  const stock: number[] = [];
  let boardsBought = 0;

  for (let c = 0; c < columns; c++) {
    let remaining = wallHeightMm;
    while (remaining > 0) {
      // Prefer satisfying the gap from an existing factory-edge off-cut.
      // Best-fit: smallest stock piece that is ≥ the remaining gap. Cutting
      // it down to the gap consumes the remaining factory edge, so anything
      // left over from that cut is scrap (NOT returned to stock).
      stock.sort((a, b) => a - b);
      const fitIdx = stock.findIndex(p => p >= remaining);
      if (fitIdx !== -1) {
        stock.splice(fitIdx, 1); // piece consumed; leftover is scrap
        remaining = 0;
        continue;
      }
      // No stock piece is large enough on its own. We do NOT chain multiple
      // off-cuts together (that would mean two cut edges meeting → no clean
      // factory joint), so fall through and open a new board.

      // Open a new board. The piece we cut keeps one factory edge (top or
      // bottom of the wall); the remaining off-cut keeps the other factory
      // edge and goes into stock for potential re-use on a future column.
      boardsBought += 1;
      if (remaining >= board.height) {
        remaining -= board.height; // whole board used, no off-cut
      } else {
        const offcut = board.height - remaining;
        remaining = 0;
        if (offcut > 0) stock.push(offcut);
      }
    }
  }

  const totalBoardLength = boardsBought * board.height;
  const wallLengthCovered = columns * wallHeightMm;
  const waste = Math.max(0, totalBoardLength - wallLengthCovered);
  return Math.round((waste / Math.max(1, totalBoardLength)) * 100);
}

/**
 * Pick the board that minimises net waste (with reuse) or off-cut waste (without).
 * Falls back to the no-height behaviour of the simple recommender.
 */
export function recommendBoardSmart(
  wallHeightMm: number,
  wallLengthMm: number,
  allowedLabels: string[] | undefined,
  accountForReuse: boolean,
): { label: string; height: number; reason: string; needsHorizontalJoint: boolean } {
  const lib = getAvailableBoards(allowedLabels);
  const fallback = lib[0] ?? BOARD_LIBRARY[1];
  if (!wallHeightMm || wallHeightMm <= 0) {
    return { label: fallback.label, height: fallback.height, reason: "Default size", needsHorizontalJoint: false };
  }
  const scored = lib.map(b => {
    const waste = accountForReuse
      ? boardNetWasteWithReuse(wallHeightMm, wallLengthMm || 1200, b.label)
      : boardOffcutWaste(wallHeightMm, b.label);
    // Scrap cost (£) for cladding this single wall once. This is what the
    // user actually pays for in waste, so we rank on this rather than %.
    const wallAreaM2 = (wallHeightMm * (wallLengthMm || 1200)) / 1_000_000;
    const boardAreaM2 = (b.width * b.height) / 1_000_000;
    const pieces = piecesPerColumn(wallHeightMm, b.label);
    const cols = Math.ceil((wallLengthMm || 1200) / b.width);
    const purchasedAreaM2 = cols * pieces * boardAreaM2;
    const scrapCost = Math.max(0, purchasedAreaM2 - wallAreaM2) * b.pricePerM2;
    return { board: b, waste, pieces, scrapCost };
  });
  // Lowest scrap cost (£) wins — that's what aligns with "Best value".
  // Tie-break on fewer pieces (no horizontal joint preferred), then lower waste %.
  scored.sort((a, b) => a.scrapCost - b.scrapCost || a.pieces - b.pieces || a.waste - b.waste);
  const best = scored[0];
  const needsJoint = best.pieces > 1;
  const reason = accountForReuse
    ? `Lowest scrap cost £${best.scrapCost.toFixed(2)} after re-using factory-edge off-cuts (${best.waste}% net waste)`
    : needsJoint
      ? `Lowest scrap cost £${best.scrapCost.toFixed(2)} for this wall (${best.waste}% off-cut)`
      : `Single board covers ${wallHeightMm} mm — £${best.scrapCost.toFixed(2)} scrap`;
  return { label: best.board.label, height: best.board.height, reason, needsHorizontalJoint: needsJoint };
}

// =============================================================================
// Multi-wall planning — simulate the full BoQ across many walls so off-cuts
// can flow between walls (realistic site behaviour). Returns the per-wall
// column layout for visualisation plus the aggregate stats.
// =============================================================================

export type WallInput = {
  id: string;
  name: string;
  heightMm: number;
  lengthMm: number;
  /** subtracted from wall area for cost; columns fall through openings unchanged */
  openingsM2?: number;
  /** Optional per-wall manufacturer override (UI mock — does not yet affect costing). */
  brandOverride?: string;
};

export type ColumnPiece = {
  /** length in mm of this piece in the column */
  lengthMm: number;
  /** "fresh" piece cut from a brand-new board; "reused" came from off-cut stock */
  source: "fresh" | "reused";
  /** waste created by this cut (mm). For fresh pieces this is the off-cut returned to stock; for reused pieces this is the scrap. */
  scrapMm: number;
};

export type WallPlan = {
  wall: WallInput;
  boardLabel: string;
  columns: ColumnPiece[][];
  boardsBought: number;
  boardLengthMm: number;
  boardWidthMm: number;
  scrapMm: number;
  netCoverageMm: number;
};

export type MultiWallPlan = {
  walls: WallPlan[];
  totalBoardsBought: number;
  totalBoardLengthMm: number;
  totalCoverageMm: number;
  totalScrapMm: number;
  netWastePct: number;
  /** sum of board area (m²) actually purchased across all walls */
  totalBoardAreaM2: number;
  /** wall area covered after subtracting openings (m²) */
  totalWallAreaM2: number;
  totalCost: number;
  scrapCost: number;
};

/**
 * Plan the entire BoQ across all walls in one pass. When `reuseAcrossWalls`
 * is true the off-cut stock is shared between walls (realistic on a job).
 * Otherwise stock resets per wall (conservative estimate).
 */
export function planWalls(
  walls: WallInput[],
  boardLabel: string,
  options: { reuseAcrossWalls: boolean } = { reuseAcrossWalls: true },
): MultiWallPlan {
  const board = BOARD_LIBRARY.find(b => b.label === boardLabel);
  const wallPlans: WallPlan[] = [];

  if (!board) {
    return {
      walls: [],
      totalBoardsBought: 0,
      totalBoardLengthMm: 0,
      totalCoverageMm: 0,
      totalScrapMm: 0,
      netWastePct: 0,
      totalBoardAreaM2: 0,
      totalWallAreaM2: 0,
      totalCost: 0,
      scrapCost: 0,
    };
  }

  let stock: number[] = [];

  for (const wall of walls) {
    if (!options.reuseAcrossWalls) stock = [];
    if (!wall.heightMm || !wall.lengthMm) {
      wallPlans.push({
        wall,
        boardLabel,
        columns: [],
        boardsBought: 0,
        boardLengthMm: board.height,
        boardWidthMm: board.width,
        scrapMm: 0,
        netCoverageMm: 0,
      });
      continue;
    }
    const colCount = Math.max(1, Math.ceil(wall.lengthMm / board.width));
    const columns: ColumnPiece[][] = [];
    let boardsBought = 0;
    let scrap = 0;

    for (let c = 0; c < colCount; c++) {
      let remaining = wall.heightMm;
      const col: ColumnPiece[] = [];
      while (remaining > 0) {
        // Best-fit reuse from stock (smallest piece that covers the gap)
        stock.sort((a, b) => a - b);
        const fitIdx = stock.findIndex(p => p >= remaining);
        if (fitIdx !== -1) {
          const piece = stock.splice(fitIdx, 1)[0];
          col.push({ lengthMm: remaining, source: "reused", scrapMm: piece - remaining });
          scrap += piece - remaining;
          remaining = 0;
          continue;
        }
        // Open a fresh board
        boardsBought += 1;
        if (remaining >= board.height) {
          col.push({ lengthMm: board.height, source: "fresh", scrapMm: 0 });
          remaining -= board.height;
        } else {
          const offcut = board.height - remaining;
          col.push({ lengthMm: remaining, source: "fresh", scrapMm: 0 });
          if (offcut > 0) stock.push(offcut);
          remaining = 0;
        }
      }
      columns.push(col);
    }

    wallPlans.push({
      wall,
      boardLabel,
      columns,
      boardsBought,
      boardLengthMm: board.height,
      boardWidthMm: board.width,
      scrapMm: scrap,
      netCoverageMm: colCount * wall.heightMm,
    });
  }

  // Anything still in stock at the end is scrap (no future wall will use it)
  const trailingScrap = stock.reduce((a, b) => a + b, 0);

  const totalBoardsBought = wallPlans.reduce((a, w) => a + w.boardsBought, 0);
  const totalBoardLengthMm = totalBoardsBought * board.height;
  const totalCoverageMm = wallPlans.reduce((a, w) => a + w.netCoverageMm, 0);
  const totalScrapMm = totalBoardLengthMm - totalCoverageMm + trailingScrap;
  // Note: totalScrapMm should equal sum of scrap + trailing, but compute the
  // safer accounting: bought - covered (in length, since width is fixed).
  const netScrap = Math.max(0, totalBoardLengthMm - totalCoverageMm);
  const netWastePct =
    totalBoardLengthMm > 0
      ? Math.round((netScrap / totalBoardLengthMm) * 100)
      : 0;

  const totalBoardAreaM2 = (totalBoardsBought * board.height * board.width) / 1_000_000;
  const totalWallAreaM2 = walls.reduce((a, w) => {
    if (!w.heightMm || !w.lengthMm) return a;
    const gross = (w.heightMm * w.lengthMm) / 1_000_000;
    return a + Math.max(0, gross - (w.openingsM2 ?? 0));
  }, 0);
  const totalCost = totalBoardAreaM2 * board.pricePerM2;
  const scrapAreaM2 = (netScrap * board.width) / 1_000_000;
  const scrapCost = scrapAreaM2 * board.pricePerM2;

  // Suppress unused warning while keeping computation
  void totalScrapMm;

  return {
    walls: wallPlans,
    totalBoardsBought,
    totalBoardLengthMm,
    totalCoverageMm,
    totalScrapMm: netScrap,
    netWastePct,
    totalBoardAreaM2,
    totalWallAreaM2,
    totalCost,
    scrapCost,
  };
}

/**
 * Pick the best board across the entire BoQ (multi-wall) by minimising net
 * waste cost. Returns the chosen plan plus all candidate plans for comparison.
 */
export function recommendBoardForWalls(
  walls: WallInput[],
  allowedLabels: string[] | undefined,
  reuseAcrossWalls: boolean,
): { recommendedLabel: string; plans: { label: string; plan: MultiWallPlan }[] } {
  const lib = getAvailableBoards(allowedLabels);
  const plans = lib.map(b => ({
    label: b.label,
    plan: planWalls(walls, b.label, { reuseAcrossWalls }),
  }));
  // Lowest cost wins; tie-break on lowest scrap, then fewest pieces per column on tallest wall.
  const sorted = [...plans].sort((a, b) => {
    const costDiff = a.plan.totalCost - b.plan.totalCost;
    if (Math.abs(costDiff) > 0.5) return costDiff;
    return a.plan.netWastePct - b.plan.netWastePct;
  });
  return { recommendedLabel: sorted[0]?.label ?? lib[0]?.label ?? BOARD_LIBRARY[1].label, plans };
}