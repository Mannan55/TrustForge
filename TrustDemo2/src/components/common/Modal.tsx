import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  tone = "primary",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  tone?: "primary" | "danger";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          "relative w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl animate-slide-up",
        )}
      >
        <h2 className="text-lg font-semibold text-ink font-display">{title}</h2>
        {description && <p className="text-sm text-ink-soft mt-2">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        {(onConfirm || confirmLabel) && (
          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            {confirmLabel && (
              <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
