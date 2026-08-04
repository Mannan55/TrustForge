import React from 'react';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Globe, 
  FileText, 
  BarChart2, 
  Download, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  Building2,
  Award
} from 'lucide-react';
import { MOCK_COMPANY, SIX_PILLARS, FINDINGS_LIST } from '../../data/mockData';

export default function TrustCenterDashboard({ onNavigate, onShowToast }) {
  const topFindings = FINDINGS_LIST.slice(0, 4);

  const handleDownloadReport = () => {
    onShowToast('DPDP Executive Audit Report (PDF) downloaded successfully.', 'success');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* 1. Welcome Card & Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trust Intelligence Core Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {MOCK_COMPANY.dpoName}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {MOCK_COMPANY.name} is currently certified at <span className="text-emerald-400 font-semibold">{MOCK_COMPANY.trustGrade}</span> under the DPDP Act 2023 framework.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('assessment')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/30 flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Run Assessment Wizard</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Executive Report</span>
            </button>
          </div>
        </div>

        {/* Subtitle Details */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Domain: <strong className="text-white">{MOCK_COMPANY.website}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Last Scan: <span className="text-white">{MOCK_COMPANY.lastScanTime}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span>CIN: <span className="text-white font-mono">{MOCK_COMPANY.cin}</span></span>
          </div>
        </div>
      </div>

      {/* 2. Top Metrics Grid: Overall Score & Compliance Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Score Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Trust Score</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                Level A+
              </span>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG Gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 stroke-current transition-all duration-1000 ease-out"
                    strokeWidth="3.5"
                    strokeDasharray={`${MOCK_COMPANY.overallScore}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {MOCK_COMPANY.overallScore}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">out of 100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-700">
              Ranked in <span className="text-blue-600">Top 5%</span> of Indian Tech SMEs
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Based on 42 DPDP statutory audit checks.
            </p>
          </div>
        </div>

        {/* Compliance Progress & Quick Actions */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">DPDP Act 2023 Compliance Progress</h3>
              <span className="text-xs font-mono font-bold text-blue-600">89% Complete</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700 w-[89%]"></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              7 of 8 statutory requirements completed. 2 minor remediation items pending for 100% score.
            </p>
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('scan')}
              className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 inline-block mb-2 group-hover:scale-105 transition-transform">
                <Globe className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Website Scan</div>
              <div className="text-[11px] text-slate-500 mt-0.5">16 Technical Checks</div>
            </button>

            <button
              onClick={() => onNavigate('findings')}
              className="p-4 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 inline-block mb-2 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600">Open Findings</div>
              <div className="text-[11px] text-slate-500 mt-0.5">2 High Severity Fixes</div>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 inline-block mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Audit Reports</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Printable Executive Summary</div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Six Trust Pillars Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Six Trust Evaluation Pillars</h2>
            <p className="text-xs text-slate-500">Core dimensions evaluated by Trust Intelligence Core (TIC)</p>
          </div>
          <button
            onClick={() => onNavigate('score')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Deep Dive Analytics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SIX_PILLARS.map((pillar) => (
            <div key={pillar.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-slate-900">{pillar.name}</h3>
                  <span className="text-sm font-extrabold text-blue-600">{pillar.score}%</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {pillar.description}
                </p>
              </div>

              <div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pillar.score}%`, backgroundColor: pillar.color }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                  <span>Status: <strong className="text-slate-800 font-semibold">{pillar.status}</strong></span>
                  <span className="text-emerald-600 font-mono font-medium">{pillar.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Findings Feed Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Audit Findings</h2>
            <p className="text-xs text-slate-500">Action items identified during domain & document scan</p>
          </div>
          <button
            onClick={() => onNavigate('findings')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All (7)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">ID & Title</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Statutory Ref</th>
                <th className="py-2.5 px-3">Assignee</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topFindings.map((finding) => {
                const isHigh = finding.severity === 'high';
                const isMedium = finding.severity === 'medium';
                return (
                  <tr key={finding.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{finding.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{finding.id} • {finding.pillar}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        isHigh 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : isMedium 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {finding.dpdpReference}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {finding.assignedTo}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('findings')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold transition-colors"
                      >
                        Fix Issue
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
