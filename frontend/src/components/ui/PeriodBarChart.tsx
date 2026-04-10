"use client";

interface Bar {
  label: string;
  value: number;
}

interface PeriodBarChartProps {
  title: string;
  bars: Bar[];
  format: (v: number) => string;
  /** When true, color bars green/red based on sign. Otherwise use accent. */
  signed?: boolean;
  height?: number;
}

/**
 * Lightweight inline-SVG bar chart. Zero dependencies — replaces what
 * Recharts/Chart.js would do for a 4-bar comparison view.
 *
 * Bars share a common origin (zero baseline) so positive and negative
 * values render above/below it. Width adapts to the parent container
 * via viewBox + preserveAspectRatio.
 */
export default function PeriodBarChart({
  title,
  bars,
  format,
  signed = false,
  height = 180,
}: PeriodBarChartProps) {
  const W = 400;
  const H = height;
  const padX = 24;
  const padTop = 16;
  const padBottom = 28;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const max = Math.max(...bars.map((b) => Math.abs(b.value)), 1);
  const hasNegatives = signed && bars.some((b) => b.value < 0);

  // If we have negatives, baseline sits in the middle. Otherwise at bottom.
  const baselineY = hasNegatives ? padTop + innerH / 2 : padTop + innerH;
  const halfH = hasNegatives ? innerH / 2 : innerH;

  const slot = innerW / bars.length;
  const barW = Math.min(slot * 0.55, 56);

  return (
    <div className="card p-4 fade-in">
      <div className="text-[11px] font-medium text-fg-subtle uppercase tracking-wider mb-3">
        {title}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: `${H}px` }}
        role="img"
        aria-label={title}
      >
        {/* Baseline */}
        <line
          x1={padX}
          x2={W - padX}
          y1={baselineY}
          y2={baselineY}
          stroke="var(--border)"
          strokeWidth={1}
        />

        {bars.map((b, i) => {
          const cx = padX + slot * i + slot / 2;
          const ratio = Math.abs(b.value) / max;
          const h = ratio * halfH;
          const isNeg = b.value < 0;
          const y = isNeg ? baselineY : baselineY - h;
          const fill = signed
            ? isNeg
              ? "var(--danger)"
              : "var(--success)"
            : "var(--accent)";
          return (
            <g key={b.label}>
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={Math.max(h, 1)}
                fill={fill}
                rx={3}
                opacity={0.85}
              >
                <title>
                  {b.label}: {format(b.value)}
                </title>
              </rect>
              {/* Value label above/below the bar */}
              <text
                x={cx}
                y={isNeg ? y + h + 12 : y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="var(--fg-muted)"
                fontFamily="var(--font-sans)"
                fontWeight={600}
              >
                {format(b.value)}
              </text>
              {/* Period label at bottom */}
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                fill="var(--fg-subtle)"
                fontFamily="var(--font-sans)"
                fontWeight={500}
                letterSpacing="0.05em"
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
