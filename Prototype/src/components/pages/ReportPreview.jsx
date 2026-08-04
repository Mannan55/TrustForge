import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Globe, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { MOCK_COMPANY, SIX_PILLARS, FINDINGS_LIST } from '../../data/mockData';

export default function ReportPreview({ onShowToast }) {
  const handleDownloadPDF = () => {
    onShowToast('Simulating PDF generation... Report saved to downloads.', 'success');
    window.print();
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Action Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
            <FileText className="w-4 h-4" />
            <span>Official DPDP Statutory Audit Document</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Executive Compliance Report
          </h1>
          <p className="text-xs text-slate-500">
            Certified Trust Score & DPDP Act 2023 Readiness Document for {MOCK_COMPANY.name}.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 md:p-12 space-y-8 text-slate-900">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                TF
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">TrustForge</span>
            </div>
            <p className="text-xs text-slate-400 font-mono pt-1">
              Ref: TF-AUDIT-2026-0804 • Issued via Trust Intelligence Core (TIC)
            </p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 text-slate-500">
            <div><strong className="text-slate-900">{MOCK_COMPANY.name}</strong></div>
            <div>CIN: {MOCK_COMPANY.cin}</div>
            <div>GSTIN: {MOCK_COMPANY.gstin}</div>
            <div className="text-blue-600 font-semibold">{MOCK_COMPANY.website}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">1. Executive Summary</h2>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-3">
            <p>
              This official compliance report synthesizes technical website diagnostics, vector privacy policy audits, and organizational governance records for <strong>{MOCK_COMPANY.name}</strong> as of August 4, 2026.
            </p>
            <p>
              {MOCK_COMPANY.name} has achieved an overall Trust Score of <strong className="text-blue-700 text-sm font-black">{MOCK_COMPANY.overallScore} / 100</strong>, placing it in <strong>Level A+ (High Trust)</strong> alignment with India’s <em>Digital Personal Data Protection (DPDP) Act 2023</em>.
            </p>
          </div>
        </div>

        {/* Score & Pillar Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">2. Trust Score & 6 Pillar Rating</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {SIX_PILLARS.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                <div className="text-slate-500 font-medium">{p.name}</div>
                <div className="text-xl font-black text-slate-900">{p.score}%</div>
                <div className="text-[10px] text-emerald-600 font-bold">{p.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Findings Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">3. Actionable Remediation Roadmap</h2>
          <div className="space-y-2 text-xs">
            {FINDINGS_LIST.slice(0, 3).map((f) => (
              <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-red-600 uppercase mr-2">{f.severity}</span>
                  <span className="font-bold text-slate-900">{f.title}</span>
                  <div className="text-slate-500 text-[11px] mt-0.5">{f.recommendation}</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap ml-2">{f.dpdpReference}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signature & Verification Block */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            <div className="font-bold text-slate-900">{MOCK_COMPANY.dpoName}</div>
            <div>Data Protection Officer (DPO)</div>
            <div className="text-[10px] text-slate-400">{MOCK_COMPANY.dpoEmail}</div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Cryptographic Stamp: TF-2026-OK</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Generated on August 4, 2026 IST</div>
          </div>
        </div>
      </div>
    </div>
  );
}
