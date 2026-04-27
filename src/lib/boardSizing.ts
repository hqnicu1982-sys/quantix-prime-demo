// Board sizing — picks the smallest board ≥ wall height to minimise off-cut waste.
// Boards are stocked at 1200 mm wide × {1800, 2400, 3000, 3600} mm long.
// Vertical orientation: board length must cover wall height.

export const BOARD_LIBRARY: { label: string; width: number; height: number }[] = [
  { label: "900 × 1800",  width:  900, height: 1800 },
  { label: "1200 × 2400", width: 1200, height: 2400 },
  { label: "1200 × 3000", width: 1200, height: 3000 },
  { label: "1200 × 3600", width: 1200, height: 3600 },
];

export function recommendBoard(wallHeightMm: number): {
  label: string;
  height: number;
  reason: string;
  needsHorizontalJoint: boolean;
} {
  if (!wallHeightMm || wallHeightMm <= 0) {
    return { label: "1200 × 2400", height: 2400, reason: "Default size", needsHorizontalJoint: false };
  }
  const single = BOARD_LIBRARY.find(b => b.height >= wallHeightMm);
  if (single) {
    const offcut = single.height - wallHeightMm;
    return {
      label: single.label,
      height: single.height,
      reason: `Single board covers ${wallHeightMm} mm with ${offcut} mm off-cut`,
      needsHorizontalJoint: false,
    };
  }
  const tallest = BOARD_LIBRARY[BOARD_LIBRARY.length - 1];
  return {
    label: tallest.label,
    height: tallest.height,
    reason: `Wall exceeds ${tallest.height} mm — adds horizontal joint`,
    needsHorizontalJoint: true,
  };
}

export function boardOffcutWaste(wallHeightMm: number, boardLabel: string): number {
  const board = BOARD_LIBRARY.find(b => b.label === boardLabel);
  if (!board || !wallHeightMm) return 0;
  if (wallHeightMm > board.height) {
    const remainder = wallHeightMm - board.height;
    return Math.round((1 - remainder / board.height) * 100);
  }
  return Math.round(((board.height - wallHeightMm) / board.height) * 100);
}