import { type WallPlan, type ColumnPiece } from "@/lib/boardSizing";

/**
 * Visual stack diagram for a single wall: each column is a vertical strip,
 * each piece coloured by source (fresh / reused). Hover shows mm + scrap.
 *
 * The diagram is purely SVG — no canvas, no charts library.
 */
export function ColumnDiagram({
  plan,
  maxHeightPx = 240,
  showLegend = true,
  className = "",
}: {
  plan: WallPlan;
  maxHeightPx?: number;
  showLegend?: boolean;
  className?: string;
}) {
  if (!plan.columns.length) {
    return (
      <div className={"flex h-32 items-center justify-center rounded-lg border border-dashed border-[var(--ink-200)] text-[12px] text-[var(--ink-500)] " + className}>
        Enter wall dimensions to see the column layout
      </div>
    );
  }

  const wallH = plan.wall.heightMm;
  const wallL = plan.wall.lengthMm;
  // Scale so the tallest column fits maxHeightPx, while preserving ratio in width.
  const pxPerMm = maxHeightPx / Math.max(wallH, plan.boardLengthMm);
  // Limit width to a reasonable amount; aim for at least 32 px per column
  const colWidthPx = Math.max(32, Math.min(72, plan.boardWidthMm * pxPerMm * 0.6));
  const totalWidthPx = colWidthPx * plan.columns.length + (plan.columns.length - 1) * 6;

  return (
    <div className={"space-y-2 " + className}>
      <div className="overflow-x-auto pb-1">
        <div className="flex items-end gap-1.5" style={{ height: maxHeightPx + 28 }}>
          {plan.columns.map((col, ci) => (
            <ColumnStack key={ci} col={col} index={ci} pxPerMm={pxPerMm} widthPx={colWidthPx} wallHeightMm={wallH} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-[var(--ink-500)]">
        <span>Wall {(wallH / 1000).toFixed(2)} m × {(wallL / 1000).toFixed(2)} m · {plan.columns.length} column{plan.columns.length === 1 ? "" : "s"} · {plan.boardsBought} board{plan.boardsBought === 1 ? "" : "s"}</span>
        {showLegend && (
          <span className="ml-auto inline-flex items-center gap-3">
            <LegendDot color="var(--accent-500)" label="Fresh board" />
            <LegendDot color="var(--green-600)" label="Reused off-cut" />
            <LegendDot color="var(--tier-critical)" label="Scrap (cut from off-cut)" />
          </span>
        )}
      </div>

      {totalWidthPx > 0 && null}
    </div>
  );
}

function ColumnStack({
  col, index, pxPerMm, widthPx, wallHeightMm,
}: {
  col: ColumnPiece[];
  index: number;
  pxPerMm: number;
  widthPx: number;
  wallHeightMm: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex flex-col-reverse rounded-md border border-[var(--ink-200)] overflow-hidden bg-[var(--ink-50)]"
        style={{ width: widthPx, height: wallHeightMm * pxPerMm }}
      >
        {col.map((piece, pi) => (
          <PieceBlock key={pi} piece={piece} pxPerMm={pxPerMm} widthPx={widthPx} />
        ))}
      </div>
      <span className="font-mono-num text-[9.5px] text-[var(--ink-500)]">C{index + 1}</span>
    </div>
  );
}

function PieceBlock({ piece, pxPerMm, widthPx }: { piece: ColumnPiece; pxPerMm: number; widthPx: number }) {
  const heightPx = piece.lengthMm * pxPerMm;
  const isReused = piece.source === "reused";
  const bg = isReused
    ? "color-mix(in oklab, var(--green-600) 22%, var(--card))"
    : "color-mix(in oklab, var(--accent-500) 18%, var(--card))";
  const borderColor = isReused ? "var(--green-600)" : "var(--accent-500)";
  const showLabel = heightPx >= 22;

  // Scrap appears for fresh pieces (off-cut goes to stock — visualised separately)
  // and for reused pieces (the leftover after the cut is wasted).
  const scrapPx = piece.scrapMm * pxPerMm;

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
        title={`${piece.source === "reused" ? "Reused off-cut" : "Fresh board"} · ${piece.lengthMm} mm${piece.scrapMm ? ` · scrap ${piece.scrapMm} mm` : ""}`}
      >
        {showLabel && <span className="font-mono-num">{piece.lengthMm}</span>}
      </div>
      {isReused && scrapPx > 2 && (
        <div
          className="flex items-center justify-center text-[9px] font-semibold text-white"
          style={{
            height: scrapPx,
            background: "repeating-linear-gradient(45deg, var(--tier-critical), var(--tier-critical) 4px, color-mix(in oklab, var(--tier-critical) 70%, black) 4px, color-mix(in oklab, var(--tier-critical) 70%, black) 8px)",
          }}
          title={`Scrap ${piece.scrapMm} mm — off-cut had only one factory edge left`}
        >
          {scrapPx >= 14 && <span className="font-mono-num">{piece.scrapMm}</span>}
        </div>
      )}
      {void widthPx}
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
