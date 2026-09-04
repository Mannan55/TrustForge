import React, { useState } from 'react';
import { useOrg } from '../context/OrgContext';
import { useToast } from '../context/ToastContext';
import { MOCK_REPORT } from '../data/mockData';
import { BrandLogo } from '../components/layout/BrandLogo';
import { ScorePill } from '../components/ui/ScorePill';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Printer, Download, FileText, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const { addToast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  const handleExportPDF = () => {
    addToast('Preparing PDF Document', 'Generating official DPDP compliance report...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6 no-print">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            REPORT GENERATOR
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">
            DPDP Compliance & Trust Reports
          </h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Formal audit-ready reports formatted for legal advisors, board members, and executive leaders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={handleExportPDF} leftIcon={<Printer className="w-4 h-4" />}>
            Print / Export PDF
          </Button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Styled like a real paper consulting document) */}
      <div className="max-w-4xl mx-auto bg-white border border-[#E3DDD0] shadow-md rounded-2xl overflow-hidden p-8 sm:p-12 space-y-8 font-sans print:shadow-none print:border-none print:p-0">
        {/* Document Header / Cover Meta */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[#0F2E22] pb-6">
          <div className="space-y-2">
            <BrandLogo variant="primary" height={38} />
            <p className="text-xs text-[#7A8981] font-semibold tracking-wide uppercase">
              Digital Personal Data Protection (DPDP) Act 2023 Compliance Audit
            </p>
          </div>
          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="font-bold text-[#0F2E22] text-sm">{MOCK_REPORT.title}</div>
            <div className="text-[#4A5750]">Organization: {currentOrg.name}</div>
            <div className="text-[#7A8981]">Generated: {MOCK_REPORT.generatedDate}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider border-l-2 border-[#0F2E22] pl-3">
            1. Executive Summary
          </h3>
          <p className="text-xs sm:text-sm text-[#4A5750] leading-relaxed bg-[#FAF8F5] p-5 rounded-xl border border-[#E3DDD0]">
            {MOCK_REPORT.executiveSummary}
          </p>
        </div>

        {/* Overall Score & Posture */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider border-l-2 border-[#0F2E22] pl-3">
            2. Trust Posture Scorecard
          </h3>
          <div className="flex items-center justify-between p-6 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0]">
            <div>
              <div className="text-xs font-semibold text-[#7A8981]">Computed DPDP Baseline Score</div>
              <div className="text-3xl font-bold text-[#0F2E22] mt-1">{currentOrg.trustScore} / 100</div>
            </div>
            <Badge variant="emerald" size="md">
              {currentOrg.postureStatus} Baseline
            </Badge>
          </div>
        </div>

        {/* 6 Pillars Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider border-l-2 border-[#0F2E22] pl-3">
            3. Pillar-by-Pillar Compliance Breakdown
          </h3>
          <div className="border border-[#E3DDD0] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#0F2E22] font-bold">
                  <th className="p-3">Pillar Name</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Evidence Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DDD0]">
                {MOCK_REPORT.pillarScores.map((p) => (
                  <tr key={p.name}>
                    <td className="p-3 font-semibold text-[#0F2E22]">{p.name}</td>
                    <td className="p-3 font-bold">{p.score}/100</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3 text-[#7A8981]">{p.evidenceCoverage}% verified</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Actions & Recommendations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider border-l-2 border-[#0F2E22] pl-3">
            4. Key Recommendations & Next Steps
          </h3>
          <ol className="list-decimal list-inside text-xs text-[#4A5750] space-y-2 bg-[#FAF8F5] p-5 rounded-xl border border-[#E3DDD0]">
            <li>Publish explicit data retention schedules in Privacy Policy under DPDP Section 8(7).</li>
            <li>Update DPA contracts with cloud vendors to mandate 6-hour CERT-In breach notification SLA.</li>
            <li>Integrate regional 8th Schedule Indian language options on website cookie notice.</li>
          </ol>
        </div>

        {/* Document Footer Sign-off */}
        <div className="pt-8 border-t border-[#E3DDD0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A8981] gap-4">
          <div>Report generated by TrustForge DPDP Compliance Platform</div>
          <div>Confidential · For Internal Entity Use Only</div>
        </div>
      </div>
    </div>
  );
};
