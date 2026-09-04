import React, { useState } from 'react';
import {
  TrustScoreDistributionChart,
  AssessmentTrendChart,
  CommonComplianceGapsChart,
  ScanStatusDonutChart
} from '../../components/admin/AnalyticsCharts';
import { Tabs } from '../../components/ui/Tabs';
import { BarChart3, Filter, Calendar } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            PLATFORM INTELLIGENCE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Platform Analytics</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Operational trends, posture distribution, and common DPDP compliance gap analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#7A8981]" />
          <Tabs
            activeTab={timeRange}
            onChange={setTimeRange}
            tabs={[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '1y', label: '1 Year' }
            ]}
          />
        </div>
      </div>

      {/* 4 PRIMARY RESTRAINED CHARTS (2x2 Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Trust Score Distribution */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-4">
          <div className="border-b border-[#E3DDD0] pb-3 space-y-1">
            <h3 className="text-base font-bold text-[#0F2E22]">1. Trust Score Distribution</h3>
            <p className="text-xs text-[#4A5750]">
              How are tenant organization trust scores distributed across compliance tiers?
            </p>
          </div>
          <TrustScoreDistributionChart />
        </div>

        {/* 2. Assessment Volume Trend */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-4">
          <div className="border-b border-[#E3DDD0] pb-3 space-y-1">
            <h3 className="text-base font-bold text-[#0F2E22]">2. Assessment Volume Trend</h3>
            <p className="text-xs text-[#4A5750]">
              Are organization DPDP assessments increasing over time?
            </p>
          </div>
          <AssessmentTrendChart />
        </div>

        {/* 3. Common Compliance Gaps */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-4">
          <div className="border-b border-[#E3DDD0] pb-3 space-y-1">
            <h3 className="text-base font-bold text-[#0F2E22]">3. Common Compliance Gaps</h3>
            <p className="text-xs text-[#4A5750]">
              Which Indian DPDP legal requirements have the highest failure rates?
            </p>
          </div>
          <CommonComplianceGapsChart />
        </div>

        {/* 4. Scan Status Distribution */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-4">
          <div className="border-b border-[#E3DDD0] pb-3 space-y-1">
            <h3 className="text-base font-bold text-[#0F2E22]">4. Scan Execution Status</h3>
            <p className="text-xs text-[#4A5750]">
              Are automated website scans executing successfully or failing?
            </p>
          </div>
          <ScanStatusDonutChart />
        </div>
      </div>
    </div>
  );
};
