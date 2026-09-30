import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PostureLevel } from "@/types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

// Shared status → tone maps, so every admin surface reads the same colours.
export const postureToneMap: Record<PostureLevel, Tone> = {
  "Strong Alignment": "success",
  "Needs Attention": "warning",
  "Potential Gaps": "info",
  Critical: "danger",
};

export const orgStatusTone: Record<string, Tone> = {
  Active: "success",
  Suspended: "danger",
  Onboarding: "info",
};

export const userStatusTone: Record<string, Tone> = {
  Active: "success",
  Suspended: "danger",
  Invited: "info",
};

export const scanStateTone: Record<string, Tone> = {
  Completed: "success",
  Scanning: "info",
  Queued: "neutral",
  Failed: "danger",
};

export const assessmentStatusTone: Record<string, Tone> = {
  Completed: "success",
  "In Progress": "info",
  "Not Started": "neutral",
};

export const reviewStatusTone: Record<string, Tone> = {
  Reviewed: "success",
  Flagged: "danger",
  Pending: "warning",
};

export const auditResultTone: Record<string, Tone> = {
  Success: "success",
  Denied: "danger",
  Warning: "warning",
};

export const severityTone: Record<string, Tone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

// --- Generic table ----------------------------------------------------------

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export function Table<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  empty = "Nothing to show.",
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  const alignClass = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="overflow-x-auto scroll-slim">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted",
                    alignClass(c.align),
                    c.hideOnMobile && "hidden md:table-cell",
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-beige-light/40")}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 text-ink-soft",
                        alignClass(c.align),
                        c.hideOnMobile && "hidden md:table-cell",
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// A small confidence meter used across review surfaces (0-100).
export function ConfidenceMeter({ value }: { value: number }) {
  const tone: Tone = value >= 75 ? "success" : value >= 50 ? "warning" : "danger";
  const fill = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-beige-light">
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${value}%` }} />
      </div>
      <span className="tabular text-xs text-ink-muted">{value}%</span>
    </div>
  );
}

// A compact on/off switch reused by rules and platform settings.
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-emerald-deep" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
