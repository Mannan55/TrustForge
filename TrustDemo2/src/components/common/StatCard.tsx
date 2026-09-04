import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

/** Compact metric card: label, value, optional icon and trend, optional slot. */
export function StatCard({
  label,
  value,
  icon,
  trend,
  hint,
  children,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: number;
  hint?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card padded={false} className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tabular text-ink">{value}</p>
        </div>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-beige-light text-emerald-light">
            {icon}
          </span>
        )}
      </div>
      {(trend != null || hint || children) && (
        <div className="mt-3 flex items-center gap-2">
          {trend != null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium tabular",
                trend >= 0 ? "text-success" : "text-danger",
              )}
            >
              {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend >= 0 ? "+" : ""}
              {trend}
            </span>
          )}
          {hint && <span className="text-xs text-ink-muted">{hint}</span>}
          {children}
        </div>
      )}
    </Card>
  );
}
