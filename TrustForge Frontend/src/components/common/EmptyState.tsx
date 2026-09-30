import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Thoughtful empty state with an optional primary action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-line-strong bg-white/50 px-6 py-14",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-beige-light text-emerald-light">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink font-display">{title}</h3>
      {description && <p className="text-sm text-ink-soft mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
