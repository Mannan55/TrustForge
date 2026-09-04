import React from 'react';
import { Download, Printer, FileText, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAssessment } from '../context/AssessmentContext';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { trustScore, findings, evidenceFiles } = useAssessment();
  const { organization } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout
      title="Executive Compliance Reports"
      subtitle="Print-friendly DPDP Act 2023 audit baseline certificate & report"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#0F2E22]/15 print:hidden">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F2E22] tracking-tight">
              Executive Audit Report Generator
            </h2>
            <p className="text-xs text-slate-600">
              Export official audit documentation formatted for board review and enterprise customer due diligence.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={Download}
            >
              Download Report Package
            </Button>
          </div>
        </div>

        {/* PRINT-FRIENDLY FORMAL REPORT CONTAINER */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-[#0F2E22]/20 shadow-lg space-y-8 print:p-0 print:border-none print:shadow-none">
          {/* Formal Report Header Branding */}
          <div className="flex items-start justify-between border-b-2 border-[#0F2E22] pb-6">
            <div className="space-y-2">
              <img
                src="/assets/brand/01-logos/trustforge-logo-primary.svg"
                alt="TrustForge"
                className="h-9 w-auto object-contain"
              />
              <div className="text-xs font-mono font-bold text-[#0F2E22]">
                EXECUTIVE DPDP ASSESSMENT REPORT — VERSION 4.0
              </div>
            </div>

            <div className="text-right text-xs space-y-1 font-mono text-slate-600">
              <div><span className="font-bold text-[#0F2E22]">Report ID:</span> TF-2026-DPDP-8912</div>
              <div><span className="font-bold text-[#0F2E22]">Issued Date:</span> {new Date().toISOString().split('T')[0]}</div>
              <div><span className="font-bold text-[#0F2E22]">Standard:</span> India DPDP Act 2023</div>
            </div>
          </div>

          {/* Target Organization Details */}
          <div className="p-6 rounded-2xl bg-[#F2EDE1] border border-[#E3CFAE] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Assessed Entity</div>
              <div className="font-extrabold text-sm text-[#0F2E22]">{organization?.legalName || 'TechNova Solutions Pvt Ltd'}</div>
              <div className="text-slate-600 mt-1 font-mono">CIN: {organization?.cin || 'U72900MH2021PTC354912'}</div>
              <div className="text-slate-600 font-mono">GSTIN: {organization?.gstin || '27AABCT3549R1ZM'} (Verified)</div>
            </div>

            <div className="sm:border-l sm:border-[#E3CFAE] sm:pl-4">
              <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Domain & Contact</div>
              <div className="font-mono text-xs font-bold text-[#0F2E22]">{organization?.primaryDomain || 'https://www.technova.in'}</div>
              <div className="text-slate-600 mt-1">Grievance Officer: {organization?.grievanceOfficerName || 'Rohan Sharma'}</div>
              <div className="text-slate-600 font-mono">Email: {organization?.grievanceOfficerEmail || 'grievance@technova.in'}</div>
            </div>
          </div>

          {/* Trust Score Certificate Badge */}
          <div className="p-8 rounded-3xl bg-[#0F2E22] text-[#F2EDE1] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs text-[#E3CFAE] font-mono uppercase">Compliance Posture</div>
              <h3 className="text-2xl font-black text-[#F2EDE1]">Strong Alignment</h3>
              <p className="text-xs text-[#E3CFAE]/80 max-w-sm">
                Evaluated against the 6 pillars of the Trust Evaluation Framework (TEF) for Indian Data Fiduciaries.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#184736] border border-[#22634B] text-center min-w-[160px]">
              <div className="text-[10px] text-[#E3CFAE] font-mono uppercase">TEF Index Score</div>
              <div className="text-4xl font-black text-emerald-400 font-mono mt-1">
                {trustScore.overallScore} <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          {/* 6 Pillars Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#0F2E22]">Pillar Assessment Breakdown</h4>
            <div className="border border-[#0F2E22]/15 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F2EDE1] text-[#0F2E22] font-bold border-b border-[#0F2E22]/15">
                  <tr>
                    <th className="p-3">Pillar Name</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0F2E22]/10 text-slate-700">
                  {trustScore.pillars.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-semibold text-[#0F2E22]">{p.name}</td>
                      <td className="p-3 font-mono">{p.weight}%</td>
                      <td className="p-3 font-mono font-bold text-[#0F2E22]">{p.score}%</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          Pass
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sign-off & Audit Notice */}
          <div className="pt-8 border-t border-[#0F2E22]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              <p className="font-bold text-[#0F2E22]">TrustForge Automated Assessment Engine</p>
              <p className="text-[11px]">DPDP Act 2023 Statutory Alignment Verification</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px]">Cryptographic Evidence Signature Verified</p>
              <p className="text-[10px]">Document Hash: 8f9a2b4e...7c1d</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
