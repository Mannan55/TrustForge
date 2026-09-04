import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#0F2E22] tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && <div className="absolute left-3 text-[#7A8981] pointer-events-none">{leftIcon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#0F2E22] placeholder:text-[#9AABA0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F2E22] focus:border-transparent ${
              leftIcon ? 'pl-9' : ''
            } ${error ? 'border-[#991B1B] focus:ring-[#991B1B]' : 'border-[#CFC7B7] hover:border-[#0F2E22]'} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#991B1B] font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#4A5750]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
