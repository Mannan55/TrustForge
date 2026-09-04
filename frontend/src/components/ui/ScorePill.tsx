import React from 'react';

interface ScorePillProps {
  score: number;
  statusLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ScorePill: React.FC<ScorePillProps> = ({
  score,
  statusLabel = 'Strong',
  size = 'md',
  className = ''
}) => {
  let colorStyles = 'bg-[#0F2E22] text-[#F2EDE1] border-[#0B2319]';
  if (score < 70 && score >= 50) {
    colorStyles = 'bg-[#9A3412] text-white border-[#7C2D12]';
  } else if (score < 50) {
    colorStyles = 'bg-[#991B1B] text-white border-[#7F1D1D]';
  }

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${colorStyles} ${className}`}>
        <span>{score} / 100</span>
        <span className="opacity-80">·</span>
        <span>{statusLabel}</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 p-6 rounded-2xl border ${colorStyles} shadow-sm ${className}`}>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight">{score}</span>
          <span className="text-xl font-normal opacity-80">/ 100</span>
        </div>
        <div className="sm:border-l sm:border-white/20 sm:pl-4">
          <span className="text-lg font-semibold tracking-wide block">{statusLabel} Posture</span>
          <span className="text-xs opacity-90 block mt-0.5">Evaluated against Indian DPDP Framework</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${colorStyles} font-medium ${className}`}>
      <span className="text-lg font-bold">{score} / 100</span>
      <span className="text-xs opacity-80">|</span>
      <span className="text-sm font-semibold">{statusLabel}</span>
    </div>
  );
};
