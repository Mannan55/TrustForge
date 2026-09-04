import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
  padded?: boolean;
}

export function Card({ className, padded = true, as: Tag = "div", ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-white border border-line rounded-2xl shadow-[0_1px_2px_rgba(15,46,34,0.04)]",
        padded && "p-5 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  eyebrow,
  description,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h3 className="text-base font-semibold text-ink font-display">{title}</h3>
        {description && <p className="text-sm text-ink-soft mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
