import React from 'react';

export const TrustScoreDistributionChart: React.FC = () => {
  const data = [
    { label: '80-100 (Strong)', percentage: 64, count: 158, color: '#0F2E22' },
    { label: '60-79 (Moderate)', percentage: 28, count: 69, color: '#E3CFAE' },
    { label: '<60 (Needs Attention)', percentage: 8, count: 21, color: '#991B1B' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs text-[#7A8981]">
        <span>Trust Posture Tier</span>
        <span>Org Count (% Distribution)</span>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="space-y-1 text-xs">
            <div className="flex justify-between font-medium text-[#0F2E22]">
              <span>{item.label}</span>
              <span className="font-bold">{item.count} orgs ({item.percentage}%)</span>
            </div>
            <div className="h-3 w-full bg-[#E3DDD0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AssessmentTrendChart: React.FC = () => {
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const values = [42, 68, 110, 185, 290, 391];
  const maxVal = 400;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs text-[#7A8981]">
        <span>Monthly Completed Assessments</span>
        <span className="font-bold text-[#0F2E22]">391 Cumulative</span>
      </div>

      {/* Responsive SVG Area Line Chart */}
      <div className="h-44 w-full pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F2E22" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0F2E22" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="20" x2="300" y2="20" stroke="#E3DDD0" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2="300" y2="50" stroke="#E3DDD0" strokeDasharray="3 3" />
          <line x1="0" y1="80" x2="300" y2="80" stroke="#E3DDD0" strokeDasharray="3 3" />

          {/* Fill Area */}
          <polygon
            points="0,89.5 0,89.5 60,83 120,72.5 180,53.75 240,27.5 300,2.25 300,100 0,100"
            fill="url(#areaGradient)"
          />

          {/* Line Path */}
          <polyline
            fill="none"
            stroke="#0F2E22"
            strokeWidth="2.5"
            points="0,89.5 60,83 120,72.5 180,53.75 240,27.5 300,2.25"
          />

          {/* Data Points */}
          {[
            { x: 0, y: 89.5, val: 42 },
            { x: 60, y: 83, val: 68 },
            { x: 120, y: 72.5, val: 110 },
            { x: 180, y: 53.75, val: 185 },
            { x: 240, y: 27.5, val: 290 },
            { x: 300, y: 2.25, val: 391 }
          ].map((pt, idx) => (
            <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" fill="#0F2E22" stroke="#FAF8F5" strokeWidth="1.5" />
          ))}
        </svg>
      </div>

      <div className="flex justify-between text-[11px] text-[#7A8981] font-mono border-t border-[#E3DDD0] pt-2">
        {months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
};

export const CommonComplianceGapsChart: React.FC = () => {
  const gaps = [
    { title: 'Data Retention Schedule Unclear (Sec 8(7))', count: 142, percentage: 57 },
    { title: 'Grievance Officer Contact Notice (Sec 8(9))', count: 98, percentage: 39 },
    { title: 'CERT-In 6-Hour Breach SLA (Sec 8(6))', count: 76, percentage: 30 },
    { title: '8th Schedule Language Notice (Sec 5(3))', count: 54, percentage: 21 }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs text-[#7A8981]">
        <span>DPDP Legal Requirement Violation</span>
        <span>Org Prevalence</span>
      </div>

      <div className="space-y-3">
        {gaps.map((gap) => (
          <div key={gap.title} className="space-y-1 text-xs">
            <div className="flex justify-between text-[#0F2E22]">
              <span className="font-semibold truncate">{gap.title}</span>
              <span className="font-bold shrink-0">{gap.count} orgs</span>
            </div>
            <div className="h-2.5 w-full bg-[#E3DDD0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#991B1B] rounded-full transition-all duration-300"
                style={{ width: `${gap.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScanStatusDonutChart: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs text-[#7A8981]">
        <span>Scan Execution Status</span>
        <span className="font-bold text-[#0F2E22]">1,284 Scans Total</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* SVG Donut Ring */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#FAF8F5"
              strokeWidth="3.8"
            />
            {/* Completed Segment (91%) */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#0F2E22"
              strokeWidth="3.8"
              strokeDasharray="91, 100"
            />
            {/* Failed Segment (3%) */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#991B1B"
              strokeWidth="3.8"
              strokeDasharray="3, 100"
              strokeDashoffset="-91"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-[#0F2E22]">91%</span>
            <span className="text-[10px] text-[#7A8981]">Success</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#0F2E22]" />
            <span className="font-semibold text-[#0F2E22]">Completed: 1,168 (91%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#E3CFAE]" />
            <span className="text-[#4A5750]">Queued: 51 (4%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#991B1B]" />
            <span className="text-[#991B1B] font-semibold">Failed: 38 (3%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#0369A1]" />
            <span className="text-[#4A5750]">Scanning: 27 (2%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
