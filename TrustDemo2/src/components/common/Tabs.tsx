import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1 overflow-x-auto scroll-slim",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              selected
                ? "bg-emerald-deep text-bone"
                : "text-ink-soft hover:bg-beige-light hover:text-ink",
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "tabular rounded-full px-1.5 text-xs",
                  selected ? "bg-white/15 text-bone" : "bg-beige-light text-ink-muted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
