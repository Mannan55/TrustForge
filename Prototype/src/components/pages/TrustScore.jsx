import React from 'react';
import { 
  BarChart2, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight,
  Sparkles,
  Lock,
  FileCheck
} from 'lucide-react';
import { MOCK_COMPANY, SIX_PILLARS } from '../../data/mockData';

export default function TrustScore({ onNavigate }) {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
            <Award className="w-4 h-4" />
            <span>Trust Evaluation Framework (TEF v2.4)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Trust Score Analytics & 6 Pillars
          </h1>
          <p className="text-xs text-slate-500">
            Quantifiable legal, technical, and governance privacy score breakdown for {MOCK_COMPANY.name}.
          </p>
        </div>

        <button
          onClick={() => onNavigate('reports')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-md flex items-center space-x-2 shrink-0"
        >
          <FileCheck className="w-4 h-4" />
          <span>Generate Certified PDF Report</span>
        </button>
      </div>

      {/* Hero Score Showcase */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6">
          {/* Main Large Circular Gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500 stroke-current"
                strokeWidth="3.5"
                strokeDasharray={`${MOCK_COMPANY.overallScore}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                {MOCK_COMPANY.overallScore}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">/ 100 Score</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Level A+ High Trust Certification</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">TechNova Compliance Index</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Score derived from 16 technical scan points, 8 document vectors, and 18 DPDP statutory compliance checklists.
            </p>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 gap-4 border-l border-slate-800 pl-6 text-xs shrink-0">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Data Fiduciary Category</div>
            <div className="font-bold text-white mt-0.5">SDF Candidate</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">DPDP Readiness</div>
            <div className="font-bold text-emerald-400 mt-0.5">89% Audit Ready</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Audit Frequency</div>
            <div className="font-bold text-white mt-0.5">Continuous Monitoring</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Pillars Evaluated</div>
            <div className="font-bold text-blue-400 mt-0.5">6 / 6 Complete</div>
          </div>
        </div>
      </div>

      {/* Six Trust Pillars Deep Dive Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Six Trust Pillars Circular Gauges & Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIX_PILLARS.map((pillar) => (
            <div key={pillar.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{pillar.name}</h3>

                {/* Mini Circular Gauge */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke={pillar.color}
                      strokeWidth="4"
                      strokeDasharray={`${pillar.score}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-extrabold text-slate-900">
                    {pillar.score}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {pillar.description}
              </p>

              {/* Sub-Metrics list */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200/60">
                {pillar.metrics.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{m.label}</span>
                    <span className="font-mono font-bold text-slate-900">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DPDP Legal Clause Coverage Map */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">DPDP Act 2023 Statutory Coverage Map</h2>
        <p className="text-xs text-slate-500 mb-6">Alignment with core legal provisions of the Digital Personal Data Protection Act.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-emerald-900">Section 5 — Data Notice</span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">100% Pass</span>
            </div>
            <p className="text-[11px] text-emerald-700">Notice presented in plain language prior to consent request.</p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-emerald-900">Section 6 — Data Consent</span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">92% Pass</span>
            </div>
            <p className="text-[11px] text-emerald-700">Free, specific, informed, unconditional, and unambiguous consent.</p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-amber-900">Section 8 — Safeguards</span>
              <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">84% Action</span>
            </div>
            <p className="text-[11px] text-amber-700">Data Processor binding DPA contract renewal pending.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
