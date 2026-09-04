import React, { useState } from 'react';
import { MOCK_EVIDENCE } from '../data/mockData';
import { EvidenceItem } from '../types';
import { EvidenceBadge, Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { FileCheck, Sparkles, ExternalLink, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export const EvidencePage: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  const filteredEvidence = MOCK_EVIDENCE.filter((item) => {
    if (activeStatus === 'ALL') return true;
    return item.status === activeStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            PROOF LAYER
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Evidence Verification Vault</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Verifiable compliance proofs, website DOM extractions, and document evidence.
          </p>
        </div>

        <Tabs
          activeTab={activeStatus}
          onChange={setActiveStatus}
          tabs={[
            { id: 'ALL', label: 'All Evidence', count: MOCK_EVIDENCE.length },
            { id: 'VERIFIED', label: 'Verified', count: MOCK_EVIDENCE.filter((e) => e.status === 'VERIFIED').length },
            { id: 'DETECTED', label: 'Detected', count: MOCK_EVIDENCE.filter((e) => e.status === 'DETECTED').length },
            { id: 'INFERRED', label: 'Inferred', count: MOCK_EVIDENCE.filter((e) => e.status === 'INFERRED').length },
            { id: 'NOT_FOUND', label: 'Not Found', count: MOCK_EVIDENCE.filter((e) => e.status === 'NOT_FOUND').length }
          ]}
        />
      </div>

      {/* AI Transparency Banner */}
      <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] flex items-center justify-between gap-4 text-xs text-[#4A5750]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0F2E22]" />
          <span>
            <strong className="text-[#0F2E22]">AI-Assisted Assessment Transparency:</strong> All evidence items reflect automated signals & document verification. TrustForge distinguishes verified signals from inferred assessments.
          </span>
        </div>
        <Badge variant="emerald">Evidence-based Analysis</Badge>
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Evidence Subject</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Source Type</th>
                <th className="p-4">Last Checked</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {filteredEvidence.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4 font-semibold text-[#0F2E22]">
                    <div className="flex items-center gap-2">
                      <span>{item.title}</span>
                      {item.aiAssisted && (
                        <span title="AI-Assisted Assessment" className="text-[10px] text-[#7A8981]">
                          [AI-assisted]
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <EvidenceBadge status={item.status} size="sm" />
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-semibold ${
                        item.confidence === 'HIGH'
                          ? 'text-[#166534]'
                          : item.confidence === 'MEDIUM'
                          ? 'text-[#9A3412]'
                          : 'text-[#991B1B]'
                      }`}
                    >
                      {item.confidence} Confidence
                    </span>
                  </td>
                  <td className="p-4 text-[#4A5750]">{item.sourceType}</td>
                  <td className="p-4 text-[#7A8981]">{item.lastChecked}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEvidence(item)}>
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVIDENCE DETAIL DRAWER */}
      <Drawer
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        title={selectedEvidence?.title || 'Evidence Record'}
        subtitle={selectedEvidence?.sourceType}
      >
        {selectedEvidence && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E3DDD0]">
              <div>
                <div className="text-[11px] font-bold text-[#7A8981] uppercase">Status</div>
                <EvidenceBadge status={selectedEvidence.status} />
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-[#7A8981] uppercase">Confidence</div>
                <span className="text-xs font-bold text-[#0F2E22]">{selectedEvidence.confidence}</span>
              </div>
            </div>

            {selectedEvidence.status === 'NOT_FOUND' ? (
              <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>INSUFFICIENT EVIDENCE DETECTED</span>
                </div>
                <p>
                  No supporting digital evidence or public notice was found for this requirement. Compliance cannot be confirmed without evidence documentation.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">Verification Notes</h4>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs text-[#4A5750]">
                {selectedEvidence.notes}
              </div>
            </div>

            {selectedEvidence.aiExplanation && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Transparency Rationale</span>
                </h4>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] text-xs text-[#4A5750]">
                  {selectedEvidence.aiExplanation}
                </div>
              </div>
            )}

            {selectedEvidence.sourceUrl && (
              <div className="pt-2">
                <a
                  href={selectedEvidence.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#0F2E22] font-semibold hover:underline"
                >
                  <span>Open Evidence Source URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
