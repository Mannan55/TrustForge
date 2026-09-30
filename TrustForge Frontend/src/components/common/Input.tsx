import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, trailing, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full h-10 rounded-lg border bg-white text-sm text-ink placeholder:text-ink-muted",
            "transition-colors focus:outline-none focus:border-emerald-light",
            icon ? "pl-9" : "pl-3",
            trailing ? "pr-11" : "pr-3",
            error ? "border-danger-line" : "border-line-strong",
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
});

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full h-10 rounded-lg border border-line-strong bg-white px-3 text-sm text-ink",
          "focus:outline-none focus:border-emerald-light appearance-none",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%237A8981%22 stroke-width=%222%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[right_0.75rem_center] bg-no-repeat pr-9",
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="block text-sm font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        className={cn(
          "w-full rounded-lg border border-line-strong bg-white p-3 text-sm text-ink placeholder:text-ink-muted",
          "focus:outline-none focus:border-emerald-light min-h-24 resize-y",
          className,
        )}
        {...props}
      />
    </div>
  );
}
