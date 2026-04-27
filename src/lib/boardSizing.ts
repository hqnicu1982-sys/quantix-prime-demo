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