import React, { useState } from 'react';
import { MOCK_FINDINGS } from '../../data/mockData';
import { Finding } from '../../types';
import { SeverityBadge, FindingStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { AlertCircle, BookOpen, Search } from 'lucide-react';

export const FindingsPage: React.FC = () => {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            COMPLIANCE AUDIT
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Platform-Wide Findings</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Aggregated DPDP compliance gaps across all tenant organizations.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Finding Title</th>
                <th className="p-4">Affected Area</th>
                <th className="p-4">Severity</th>
                <th className="p-4">DPDP Section Reference</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {MOCK_FINDINGS.map((find) => (
                <tr key={find.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4 font-bold text-[#0F2E22]">{find.title}</td>
                  <td className="p-4 text-[#4A5750]">{find.affectedArea}</td>
                  <td className="p-4">
                    <SeverityBadge severity={find.severity} size="sm" />
                  </td>
                  <td className="p-4 font-semibold text-[#0F2E22]">{find.dpdpReference}</td>
                  <td className="p-4">
                    <FindingStatusBadge status={find.status} size="sm" />
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFinding(find)}>
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finding Detail Drawer */}
      <Drawer
        isOpen={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
        title={selectedFinding?.title || 'Finding Detail'}
        subtitle={selectedFinding?.affectedArea}
      >
        {selectedFinding && (
          <div className="space-y-4 text-xs text-[#4A5750]">
            <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] space-y-2">
              <SeverityBadge severity={selectedFinding.severity} />
              <div className="font-bold text-[#0F2E22] text-sm">{selectedFinding.title}</div>
              <p>{selectedFinding.whyItMatters}</p>
              <p className="font-semibold text-[#0F2E22] pt-2">{selectedFinding.dpdpReference}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
