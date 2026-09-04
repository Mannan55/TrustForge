import React from 'react';
import Card from './Card';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-50 text-blue-600',
  trend,
  trendPositive = true,
  onClick,
}) {
  return (
    <Card interactive={!!onClick} onClick={onClick} padding="p-5" className="flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span className={`font-mono font-bold ${trendPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
