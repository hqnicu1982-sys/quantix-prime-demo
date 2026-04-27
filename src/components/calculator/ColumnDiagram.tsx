import { type WallPlan, type ColumnPiece } from "@/lib/boardSizing";

/**
 * Schematic mock-up of how a board is used on a wall.
 *
 * Instead of drawing every column (which is noisy on long walls), we pick
 * up to two representative columns:
 *  1. A "fresh" column — what the typical column looks like.
 *  2. A "reused" column — only shown if the plan actually re-uses off-cuts.
 *
 * Goal: communicate the cutting strategy at a glance, not enumerate boards.
 */
export function ColumnDiagram({
  plan,
  maxHeightPx = 200,
  className = "",
}: {
  plan: WallPlan;
  maxHeightPx?: number;
  className?: string;
}) {
  if (!plan.columns.length) {
    return (
      <div className={"flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--ink-200)] text-[12px] text-[var(--ink-500)] " + className}>
        Enter wall dimensions to see the cutting strategy
      </div>
    );
  }

  const wallH = plan.wall.heightMm;

  // Pick representative columns
  const freshCol = plan.columns.find(c => c.every(p => p.source === "fresh")) ?? plan.columns[0];
  const reusedCol = plan.columns.find(c => c.some(p => p.source === "reused"));

  const samples: { col: ColumnPiece[]; label: string; caption: string }[] = [
    {
      col: freshCol,
      label: "Typical column",
      caption: describeColumn(freshCol, plan.boardLengthMm),
    },
  ];
  if (reusedCol && reusedCol !== freshCol) {
    samples.push({
      col: reusedCol,
      label: "Off-cut re-used",
      caption: describeColumn(reusedCol, plan.boardLengthMm),
    });
  }

  const pxPerMm = maxHeightPx / Math.max(wallH, plan.boardLengthMm);
  const colWidthPx = 56;

  return (
    <div className={"rounded-xl border border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-4 " + className}>
      <div className="flex items-start gap-6">
        {samples.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className="relative flex flex-col-reverse overflow-hidden rounded-md border border-[var(--ink-200)] bg-[var(--card)]"
              style={{ width: colWidthPx, height: wallH * pxPerMm }}
            >
              {s.col.map((piece, pi) => (
                <PieceBlock key={pi} piece={piece} pxPerMm={pxPerMm} />
              ))}
            </div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-700)]">{s.label}</p>
            <p className="font-mono-num text-center text-[10.5px] leading-tight text-[var(--ink-500)]" style={{ maxWidth: 160 }}>
              {s.caption}
            </p>
          </div>
        ))}

        <div className="ml-auto space-y-2 text-[10.5px] text-[var(--ink-500)]">
          <LegendDot color="var(--accent-500)" label="Fresh board cut" />
          <LegendDot color="var(--green-600)" label="Re-used off-cut" />
          <LegendDot color="var(--tier-critical)" label="Scrap (no factory edge left)" striped />
          <p className="pt-1 font-mono-num text-[10.5px] text-[var(--ink-700)]">
            × {plan.columns.length} column{plan.columns.length === 1 ? "" : "s"} → {plan.boardsBought} board{plan.boardsBought === 1 ? "" : "s"} bought
          </p>
        </div>
      </div>
    </div>
  );
}

function describeColumn(col: ColumnPiece[], boardLengthMm: number): string {
  return col
    .map(p => {
      if (p.source === "fresh") {
        if (p.lengthMm === boardLengthMm) return `full board ${p.lengthMm}`;
        return `cut ${p.lengthMm} from new board`;
      }
      return p.scrapMm > 0
        ? `${p.lengthMm} from off-cut (${p.scrapMm} scrap)`
        : `${p.lengthMm} from off-cut`;
    })
    .join(" + ");
}

function PieceBlock({ piece, pxPerMm }: { piece: ColumnPiece; pxPerMm: number }) {
  const heightPx = piece.lengthMm * pxPerMm;
  const isReused = piece.source === "reused";
  const bg = isReused
    ? "color-mix(in oklab, var(--green-600) 22%, var(--card))"
    : "color-mix(in oklab, var(--accent-500) 18%, var(--card))";
  const borderColor = isReused ? "var(--green-600)" : "var(--accent-500)";
  const showLabel = heightPx >= 20;
  const scrapPx = isReused ? piece.scrapMm * pxPerMm : 0;

  return (
    <>
      <div
        className="relative flex items-center justify-center text-[9.5px] font-semibold"
        style={{
          height: heightPx,
          background: bg,
          borderTop: `1px dashed color-mix(in oklab, ${borderColor} 40%, transparent)`,
          color: borderColor,
        }}
      >
        {showLabel && <span className="font-mono-num">{piece.lengthMm}</span>}
      </div>
      {scrapPx > 2 && (
        <div
          className="flex items-center justify-center text-[9px] font-semibold text-white"
          style={{
            height: scrapPx,
            background: "repeating-linear-gradient(45deg, var(--tier-critical), var(--tier-critical) 4px, color-mix(in oklab, var(--tier-critical) 70%, black) 4px, color-mix(in oklab, var(--tier-critical) 70%, black) 8px)",
          }}
        >
          {scrapPx >= 14 && <span className="font-mono-num">{piece.scrapMm}</span>}
        </div>
      )}
    </>
  );
}

function LegendDot({ color, label, striped }: { color: string; label: string; striped?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{
          background: striped
            ? `repeating-linear-gradient(45deg, ${color}, ${color} 2px, color-mix(in oklab, ${color} 70%, black) 2px, color-mix(in oklab, ${color} 70%, black) 4px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}
