import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  width = "lg",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  width?: "md" | "lg";
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-emerald-dark/40 backdrop-blur-[2px] animate-fade"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute right-0 top-0 h-full bg-canvas border-l border-line shadow-2xl flex flex-col animate-drawer-in",
          "w-full",
          width === "lg" ? "sm:max-w-xl" : "sm:max-w-md",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 sm:px-6 py-4 bg-white">
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 className="text-lg font-semibold text-ink font-display leading-snug">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-beige-light hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-slim px-5 sm:px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line px-5 sm:px-6 py-4 bg-white">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
