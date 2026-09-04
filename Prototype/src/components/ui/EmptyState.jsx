import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-4">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div>
        <h3 className="font-bold text-base text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
