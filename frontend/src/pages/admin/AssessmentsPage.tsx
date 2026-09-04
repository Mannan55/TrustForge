import React, { useState } from 'react';
import { MOCK_ADMIN_ORGS } from '../../data/adminMockData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { ProgressBar } from '../../components/ui/Tabs';
import { ClipboardCheck, Search, Filter, BookOpen } from 'lucide-react';

export const AssessmentsPage: React.FC = () => {
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            COMPLIANCE MONITORING
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">DPDP Assessments Oversight</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Monitor 391 active and completed DPDP Act 2023 compliance assessments.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Organization</th>
                <th className="p-4">Assessment Framework</th>
                <th className="p-4">Completion %</th>
                <th className="p-4">Trust Score</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {MOCK_ADMIN_ORGS.map((org) => (
                <tr key={org.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4 font-bold text-[#0F2E22]">{org.name}</td>
                  <td className="p-4 text-[#4A5750]">Indian DPDP Act 2023 Baseline</td>
                  <td className="p-4 w-44">
                    <ProgressBar progress={org.assessmentStatus === 'Completed' ? 100 : 82} label="" />
                  </td>
                  <td className="p-4 font-bold text-[#0F2E22]">{org.trustScore} / 100</td>
                  <td className="p-4">
                    <Badge variant={org.assessmentStatus === 'Completed' ? 'success' : 'info'}>
                      {org.assessmentStatus}
                    </Badge>
                  </td>
                  <td className="p-4 text-[#7A8981]">{org.lastAssessed}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(org)}>
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assessment Inspection Drawer */}
      <Drawer
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        title="Assessment Record"
        subtitle={selectedAssessment?.name}
      >
        {selectedAssessment && (
          <div className="space-y-4 text-xs text-[#4A5750]">
            <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] space-y-2">
              <div className="font-bold text-[#0F2E22] text-sm">{selectedAssessment.name}</div>
              <p>Status: {selectedAssessment.assessmentStatus}</p>
              <p>Trust Score: {selectedAssessment.trustScore} / 100</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
