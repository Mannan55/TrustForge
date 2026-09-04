import React, { useState } from 'react';
import { MOCK_EVIDENCE } from '../../data/mockData';
import { EvidenceItem } from '../../types';
import { EvidenceBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { FileCheck, Sparkles, ExternalLink } from 'lucide-react';

export const EvidencePage: React.FC = () => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            PROOF AUDIT
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Evidence Review Vault</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Audit digital evidence items, website DOM extractions, and AI confidence signals.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Evidence Title</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Source Type</th>
                <th className="p-4">Last Checked</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {MOCK_EVIDENCE.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4 font-bold text-[#0F2E22]">{item.title}</td>
                  <td className="p-4">
                    <EvidenceBadge status={item.status} size="sm" />
                  </td>
                  <td className="p-4 font-semibold text-[#0F2E22]">{item.confidence} Confidence</td>
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

      <Drawer
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        title={selectedEvidence?.title || 'Evidence Record'}
        subtitle={selectedEvidence?.sourceType}
      >
        {selectedEvidence && (
          <div className="space-y-4 text-xs text-[#4A5750]">
            <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] space-y-2">
              <EvidenceBadge status={selectedEvidence.status} />
              <div className="font-bold text-[#0F2E22]">{selectedEvidence.notes}</div>
              {selectedEvidence.aiExplanation && <p className="pt-2 text-[#7A8981]">{selectedEvidence.aiExplanation}</p>}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
