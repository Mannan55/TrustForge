import React from 'react';

export default function Card({
  children,
  className = '',
  interactive = false,
  onClick,
  padding = 'p-6',
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white border border-slate-200 shadow-xs transition-all duration-200 ${
        interactive ? 'hover:border-slate-300 hover:shadow-md cursor-pointer' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
