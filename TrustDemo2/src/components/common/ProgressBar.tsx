import { cn } from "@/lib/cn";

/** A thin, labelled progress bar. Never renders raw decimal percentages. */
export function ProgressBar({
  value,
  max = 100,
  label,
  tone = "brand",
  className,
  showValue = false,
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: "brand" | "success" | "warning" | "danger";
  className?: string;
  showValue?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const fill: Record<string, string> = {
    brand: "bg-emerald-light",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-ink-soft">{label}</span>}
          {showValue && <span className="text-xs tabular text-ink-muted">{pct}%</span>}
        </div>
      )}
      <div
        className="h-2 w-full rounded-full bg-beige-light overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", fill[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Indeterminate bar used for loading states with unknown duration. */
export function IndeterminateBar({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-1 w-full overflow-hidden rounded-full bg-beige-light", className)}>
      <div className="absolute inset-y-0 rounded-full bg-emerald-light animate-indeterminate" />
    </div>
  );
}
