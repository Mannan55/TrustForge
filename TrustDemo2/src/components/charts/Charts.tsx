import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "danger" | "info";

const fillFor: Record<Tone, string> = {
  brand: "bg-emerald-light",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};
const strokeFor: Record<Tone, string> = {
  brand: "#22634b",
  success: "#166534",
  warning: "#9a3412",
  danger: "#991b1b",
  info: "#0f5c73",
};

/** Horizontal labelled bars (distributions, common gaps). */
export function HBars({
  data,
  unit = "",
  className,
}: {
  data: { label: string; value: number; tone?: Tone }[];
  unit?: string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-ink-soft">{d.label}</span>
            <span className="tabular text-ink-muted">
              {d.value}
              {unit}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-beige-light">
            <div
              className={cn("h-full rounded-full transition-[width] duration-700", fillFor[d.tone ?? "brand"])}
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vertical bar chart (monthly trend). Pure SVG, gridless, calm. */
export function BarChart({
  data,
  height = 180,
  tone = "brand",
  className,
}: {
  data: { month: string; value: number }[];
  height?: number;
  tone?: Tone;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("flex items-end gap-3", className)} style={{ height }}>
      {data.map((d) => {
        const h = Math.max(6, Math.round((d.value / max) * (height - 28)));
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
            <span className="tabular text-xs text-ink-muted">{d.value}</span>
            <div
              className={cn("w-full max-w-10 rounded-t-md transition-[height] duration-700", fillFor[tone])}
              style={{ height: h }}
            />
            <span className="text-xs text-ink-muted">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/** A single-value donut for status splits. */
export function DonutChart({
  segments,
  size = 148,
  stroke = 18,
  centerLabel,
  centerSub,
}: {
  segments: { label: string; value: number; tone?: Tone }[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="text-beige-light" stroke="currentColor" />
          {segments.map((s) => {
            const len = (s.value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                strokeWidth={stroke}
                stroke={strokeFor[s.tone ?? "brand"]}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                className="transition-[stroke-dashoffset] duration-700"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular font-display text-xl font-semibold text-ink">{centerLabel}</span>
            {centerSub && <span className="text-[10px] uppercase tracking-wide text-ink-muted">{centerSub}</span>}
          </div>
        )}
      </div>
      <ul className="space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: strokeFor[s.tone ?? "brand"] }} />
            <span className="text-ink-soft">{s.label}</span>
            <span className="tabular ml-auto pl-4 text-ink-muted">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A compact area/line sparkline used inside stat cards. */
export function Sparkline({
  values,
  width = 120,
  height = 36,
  tone = "brand",
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: Tone;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={area} fill={strokeFor[tone]} opacity={0.08} />
      <path d={line} fill="none" stroke={strokeFor[tone]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
