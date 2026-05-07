import * as React from "react";

/**
 * WallPreview — proportional rectangle visualising a wall (length × height)
 * with a centred "L × H = m²" readout. Pure presentational SVG, no deps.
 *
 * The rectangle is scaled to fit a fixed canvas while preserving the real
 * aspect ratio (length:height). Empty / invalid inputs render a placeholder.
 */
export function WallPreview({
  lengthM,
  heightM,
  className,
  kind = "wall",
}: {
  lengthM: number;
  heightM: number;
  className?: string;
  /** "wall" → vertical = Height (elevation view).
   *  "ceiling" → vertical = Width (top-down plan view).
   *  "steel" → vertical = profile perimeter (encasement). */
  kind?: "wall" | "ceiling" | "steel";
}) {
  const valid = lengthM > 0 && heightM > 0;
  // Canvas slot: 16:5 ratio, generous horizontal padding so tall walls breathe.
  const W = 640;
  const H = 200;
  const pad = 24;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  // Scale wall to fit, keep aspect.
  let rectW = innerW;
  let rectH = innerH;
  if (valid) {
    const ratio = lengthM / heightM;
    const slotRatio = innerW / innerH;
    if (ratio > slotRatio) {
      rectW = innerW;
      rectH = innerW / ratio;
    } else {
      rectH = innerH;
      rectW = innerH * ratio;
    }
  }
  const x = (W - rectW) / 2;
  const y = (H - rectH) / 2;
  const area = lengthM * heightM;
  const placeholder =
    kind === "ceiling"
      ? "Enter length & width to preview the ceiling"
      : kind === "steel"
        ? "Enter member length & profile perimeter"
        : "Enter length & height to preview the wall";

  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-gradient-to-br from-[var(--ink-50)]/40 to-transparent " +
        (className ?? "")
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        aria-hidden="true"
      >
        {/* faint grid */}
        <defs>
          <pattern id="wall-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="color-mix(in oklab, var(--ink-200) 60%, transparent)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#wall-grid)" />

        {valid ? (
          <>
            {/* wall fill */}
            <rect
              x={x}
              y={y}
              width={rectW}
              height={rectH}
              rx="4"
              fill="color-mix(in oklab, var(--accent-500) 8%, transparent)"
              stroke="var(--accent-500)"
              strokeWidth="1.5"
            />
            {/* length label (bottom) */}
            <line
              x1={x}
              x2={x + rectW}
              y1={y + rectH + 10}
              y2={y + rectH + 10}
              stroke="var(--ink-500)"
              strokeWidth="0.75"
            />
            <text
              x={x + rectW / 2}
              y={y + rectH + 22}
              textAnchor="middle"
              fontSize="11"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill="var(--ink-500)"
            >
              {lengthM.toFixed(2)} m
            </text>
            {/* height label (left, rotated) */}
            <line
              x1={x - 10}
              x2={x - 10}
              y1={y}
              y2={y + rectH}
              stroke="var(--ink-500)"
              strokeWidth="0.75"
            />
            <text
              x={x - 14}
              y={y + rectH / 2}
              textAnchor="middle"
              fontSize="11"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill="var(--ink-500)"
              transform={`rotate(-90, ${x - 14}, ${y + rectH / 2})`}
            >
              {heightM.toFixed(2)} m
            </text>
            {/* axis label badge (top-left) */}
            <text
              x={x + 6}
              y={y + 14}
              fontSize="9"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill="var(--ink-500)"
              opacity="0.8"
            >
              {kind === "ceiling" ? "plan view" : kind === "steel" ? "encasement" : "elevation"}
            </text>
            {/* centre area readout */}
            <text
              x={W / 2}
              y={H / 2 + 6}
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill="var(--ink-900)"
            >
              {area.toFixed(1)} m²
            </text>
          </>
        ) : (
          <text
            x={W / 2}
            y={H / 2 + 4}
            textAnchor="middle"
            fontSize="12"
            fill="var(--ink-500)"
          >
            {placeholder}
          </text>
        )}
      </svg>
    </div>
  );
}