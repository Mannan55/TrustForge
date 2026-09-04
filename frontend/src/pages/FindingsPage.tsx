import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_FINDINGS } from '../data/mockData';
import { Finding, Severity } from '../types';
import { SeverityBadge, FindingStatusBadge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import {
  AlertCircle,
  BookOpen,
  FileCheck2,
  CheckSquare,
  ArrowRight,
  Filter,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const FindingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const filteredFindings = MOCK_FINDINGS.filter((f) => {
    if (selectedSeverity === 'ALL') return true;
    return f.severity === selectedSeverity;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            UNDERSTAND
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Compliance Gap Findings</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Identified compliance gaps & recommendations mapped to Indian DPDP requirements.
          </p>
        </div>

        <Tabs
          activeTab={selectedSeverity}
          onChange={setSelectedSeverity}
          tabs={[
            { id: 'ALL', label: 'All Findings', count: MOCK_FINDINGS.length },
            { id: 'HIGH', label: 'High Priority', count: MOCK_FINDINGS.filter((f) => f.severity === 'HIGH').length },
            { id: 'MEDIUM', label: 'Medium', count: MOCK_FINDINGS.filter((f) => f.severity === 'MEDIUM').length },
            { id: 'LOW', label: 'Low', count: MOCK_FINDINGS.filter((f) => f.severity === 'LOW').length }
          ]}
        />
      </div>

      {/* Findings List Table / Cards */}
      <div className="space-y-3">
        {filteredFindings.map((finding) => (
          <div
            key={finding.id}
            onClick={() => setSelectedFinding(finding)}
            className="p-5 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-sm transition-all cursor-pointer space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={finding.severity} />
                <span className="text-xs font-semibold text-[#7A8981]">•</span>
                <span className="text-xs font-semibold text-[#4A5750]">{finding.affectedArea}</span>
              </div>
              <FindingStatusBadge status={finding.status} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0F2E22]">{finding.title}</h3>
              <p className="text-xs text-[#4A5750] mt-1 line-clamp-2">{finding.whyItMatters}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#FAF8F5] text-xs">
              <div className="flex items-center gap-1.5 text-[#0F2E22] font-medium">
                <BookOpen className="w-3.5 h-3.5 text-[#0F2E22]" />
                <span>Reference: {finding.dpdpReference}</span>
              </div>
              <span className="text-xs font-semibold text-[#0F2E22] hover:underline flex items-center gap-1">
                View Finding Details & Evidence →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* SIGNATURE UX PATTERN DRAWER PANEL */}
      <Drawer
        isOpen={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
        title={selectedFinding?.title || 'Finding Detail'}
        subtitle={selectedFinding?.affectedArea}
        width="lg"
      >
        {selectedFinding && (
          <div className="space-y-6">
            {/* Severity & Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E3DDD0]">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#7A8981] uppercase">Assessment Severity</div>
                <SeverityBadge severity={selectedFinding.severity} />
              </div>
              <div className="space-y-1 text-right">
                <div className="text-[11px] font-bold text-[#7A8981] uppercase">Status</div>
                <FindingStatusBadge status={selectedFinding.status} />
              </div>
            </div>

            {/* 1. WHY IT MATTERS */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F2E22] uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-[#991B1B]" />
                <span>1. Why It Matters</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs text-[#4A5750] leading-relaxed">
                {selectedFinding.whyItMatters}
              </div>
            </div>

            {/* 2. EVIDENCE */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F2E22] uppercase tracking-wider">
                <FileCheck2 className="w-4 h-4 text-[#0F2E22]" />
                <span>2. Verified Evidence</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs space-y-2">
                <p className="text-[#0F2E22] font-mono text-[11px] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E3DDD0]">
                  "{selectedFinding.evidenceSnippet}"
                </p>
                {selectedFinding.evidenceUrl && (
                  <a
                    href={selectedFinding.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#0F2E22] font-semibold hover:underline"
                  >
                    <span>Inspect Evidence Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* 3. REFERENCE (Indian DPDP Act) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F2E22] uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-[#0F2E22]" />
                <span>3. Indian Regulatory Reference</span>
              </div>
              <div className="p-4 rounded-xl bg-[#E3CFAE]/30 border border-[#D5BD97] text-xs text-[#0F2E22] font-semibold">
                {selectedFinding.dpdpReference}
              </div>
            </div>

            {/* 4. RECOMMENDED ACTION */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F2E22] uppercase tracking-wider">
                <CheckSquare className="w-4 h-4 text-[#0F2E22]" />
                <span>4. Recommended Action</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs text-[#4A5750] leading-relaxed">
                {selectedFinding.recommendedAction}
              </div>
            </div>

            {/* 5. REMEDIATION CTA */}
            <div className="pt-4 border-t border-[#E3DDD0] flex justify-end gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedFinding(null);
                  navigate('/remediation');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Remediation Task
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
