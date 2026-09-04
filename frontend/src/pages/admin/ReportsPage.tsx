import React from 'react';
import { MOCK_ADMIN_ORGS } from '../../data/adminMockData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { FileText, Download, Eye } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { addToast } = useToast();

  const reportsList = MOCK_ADMIN_ORGS.map((org, i) => ({
    id: `rep_admin_${i}`,
    title: `DPDP Compliance Baseline Report — Aug 2026`,
    orgName: org.name,
    generatedDate: org.lastAssessed,
    status: 'Ready',
    fileSize: '2.4 MB'
  }));

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            SYSTEM OUTPUTS
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Report Engine Monitor</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Monitor formal executive DPDP audit reports generated across tenant organizations.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Report Title</th>
                <th className="p-4">Tenant Organization</th>
                <th className="p-4">Generated Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">File Size</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {reportsList.map((rep) => (
                <tr key={rep.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4 font-bold text-[#0F2E22]">{rep.title}</td>
                  <td className="p-4 text-[#4A5750]">{rep.orgName}</td>
                  <td className="p-4 text-[#7A8981]">{rep.generatedDate}</td>
                  <td className="p-4">
                    <Badge variant="success">{rep.status}</Badge>
                  </td>
                  <td className="p-4 text-[#7A8981] font-mono">{rep.fileSize}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToast('Downloading Report', `Downloading ${rep.title}...`, 'info')}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
