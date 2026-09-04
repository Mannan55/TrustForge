import React from 'react';

export default function Badge({
  children,
  variant = 'neutral', // 'critical' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'neutral' | 'blue'
  size = 'md', // 'sm' | 'md'
  icon: Icon = null,
  className = '',
}) {
  const variantStyles = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center space-x-1 font-semibold border rounded-full font-mono uppercase tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
