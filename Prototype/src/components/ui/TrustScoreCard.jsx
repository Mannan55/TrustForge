import React from 'react';
import Card from './Card';
import { CircularProgress } from './Progress';

export default function TrustScoreCard({ pillar }) {
  return (
    <Card className="flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900">{pillar.name}</h3>
          <span className="text-[11px] font-semibold text-emerald-600 font-mono mt-0.5 inline-block">
            {pillar.status} ({pillar.trend})
          </span>
        </div>
        <CircularProgress value={pillar.score} size={48} strokeWidth={4} label={`${pillar.score}%`} />
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">{pillar.description}</p>

      {pillar.metrics && (
        <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px] border border-slate-100">
          {pillar.metrics.map((m, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-slate-500">{m.label}</span>
              <span className="font-mono font-bold text-slate-900">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
