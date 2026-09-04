import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#0F2E22] tracking-wide">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#0F2E22] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F2E22] focus:border-transparent ${
            error ? 'border-[#991B1B] focus:ring-[#991B1B]' : 'border-[#CFC7B7] hover:border-[#0F2E22]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#991B1B] font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#4A5750]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
