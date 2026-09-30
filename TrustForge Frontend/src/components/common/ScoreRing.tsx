import { cn } from "@/lib/cn";
import { postureForScore, postureTone } from "@/lib/format";

/**
 * A restrained circular score gauge. An arc, not a giant decorative ring.
 * Renders the score and posture without overlapping surrounding content.
 */
export function ScoreRing({
  score,
  size = 120,
  stroke = 10,
  label = "out of 100",
  darkTheme = false,
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  darkTheme?: boolean;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        style={{ shapeRendering: "geometricPrecision" }}
        aria-hidden
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className={darkTheme ? "text-emerald-dark/60" : "text-beige"}
        />
        {/* Foreground progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-out",
            darkTheme ? "text-beige" : "text-emerald-light"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "tabular font-display font-bold leading-none drop-shadow-sm",
            darkTheme ? "text-bone" : "text-ink"
          )}
          style={{ fontSize: size * 0.28 }}
        >
          {score}
        </span>
        <span
          className={cn(
            "text-[10px] uppercase font-medium tracking-wider mt-1",
            darkTheme ? "text-beige/80" : "text-ink-muted"
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/** Compact numeric score pill used in the sidebar and tables. */
export function ScorePill({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const tone = postureTone(postureForScore(score));
  const toneClass: Record<string, string> = {
    success: "bg-success-soft text-success border-success-line",
    warning: "bg-warning-soft text-warning border-warning-line",
    info: "bg-info-soft text-info border-info-line",
    danger: "bg-danger-soft text-danger border-danger-line",
  };
  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }[size];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border font-semibold tabular font-display",
        toneClass[tone],
        sizeClass,
      )}
    >
      {score}
      <span className="opacity-60 font-normal">/100</span>
    </span>
  );
}
