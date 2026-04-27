// Board sizing — picks the smallest board ≥ wall height to minimise off-cut waste.
// Boards are stocked at 1200 mm wide × {1800, 2400, 3000, 3600} mm long.
// Vertical orientation: board length must cover wall height.

export const BOARD_LIBRARY: { label: string; width: number; height: number }[] = [
  { label: "900 × 1800",  width:  900, height: 1800 },
  { label: "1200 × 2400", width: 1200, height: 2400 },
  { label: "1200 × 3000", width: 1200, height: 3000 },
  { label: "1200 × 3600", width: 1200, height: 3600 },
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
    return { board: b, waste, pieces: piecesPerColumn(wallHeightMm, b.label) };
  });
  // Lowest waste wins; tie-break on fewer pieces (no joint preferred).
  scored.sort((a, b) => a.waste - b.waste || a.pieces - b.pieces);
  const best = scored[0];
  const needsJoint = best.pieces > 1;
  const reason = accountForReuse
    ? `Lowest net waste ${best.waste}% after re-using factory-edge off-cuts`
    : needsJoint
      ? `Wall exceeds board height — best of available sizes (${best.waste}% off-cut)`
      : `Single board covers ${wallHeightMm} mm with ${best.board.height - wallHeightMm} mm off-cut`;
  return { label: best.board.label, height: best.board.height, reason, needsHorizontalJoint: needsJoint };
}