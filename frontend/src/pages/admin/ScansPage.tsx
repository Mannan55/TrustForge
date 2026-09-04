import React, { useState } from 'react';
import { MOCK_ADMIN_SCANS, AdminScanItem } from '../../data/adminMockData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { Globe, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const ScansPage: React.FC = () => {
  const { addToast } = useToast();
  const [scans, setScans] = useState<AdminScanItem[]>(MOCK_ADMIN_SCANS);
  const [selectedScanToRetry, setSelectedScanToRetry] = useState<AdminScanItem | null>(null);

  const handleConfirmRescan = () => {
    if (!selectedScanToRetry) return;

    setScans((prev) =>
      prev.map((s) =>
        s.id === selectedScanToRetry.id
          ? { ...s, status: 'Scanning', errorReason: undefined, startedTime: 'Just now' }
          : s
      )
    );

    addToast('Scan Triggered', `Triggered automated privacy rescan for ${selectedScanToRetry.website}.`, 'info');
    setSelectedScanToRetry(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            SCAN ENGINE GOVERNANCE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Website Scanner Monitor</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Monitor automated website DOM privacy scanning queue & failure diagnostics.
          </p>
        </div>
      </div>

      {/* SCAN QUEUE MONITOR WIDGET */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3DDD0] space-y-4">
        <h3 className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">
          LIVE SCAN ENGINE QUEUE
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] space-y-1">
            <span className="text-[#166534] font-semibold block">Completed</span>
            <span className="text-2xl font-bold text-[#166534]">1,168</span>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-1">
            <span className="text-[#0F2E22] font-semibold block">Queued</span>
            <span className="text-2xl font-bold text-[#0F2E22]">51</span>
          </div>
          <div className="p-4 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] space-y-1">
            <span className="text-[#0369A1] font-semibold block">Scanning Now</span>
            <span className="text-2xl font-bold text-[#0369A1]">27</span>
          </div>
          <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] space-y-1">
            <span className="text-[#991B1B] font-semibold block">Failed Scans</span>
            <span className="text-2xl font-bold text-[#991B1B]">38</span>
          </div>
        </div>
      </div>

      {/* Scans Data Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Target Domain</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Scan Status</th>
                <th className="p-4">Started Time</th>
                <th className="p-4">Duration / Diagnostics</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4 font-bold text-[#0F2E22]">{scan.website}</td>
                  <td className="p-4 text-[#4A5750]">{scan.orgName}</td>
                  <td className="p-4">
                    <Badge variant={scan.status === 'Completed' ? 'success' : scan.status === 'Scanning' ? 'info' : 'danger'}>
                      {scan.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-[#7A8981]">{scan.startedTime}</td>
                  <td className="p-4 max-w-xs truncate text-[#4A5750]">
                    {scan.errorReason ? (
                      <span className="text-[#991B1B] font-semibold">{scan.errorReason}</span>
                    ) : (
                      scan.duration || '-'
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedScanToRetry(scan)}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Trigger Rescan
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rescan Confirmation Modal */}
      <Modal
        isOpen={!!selectedScanToRetry}
        onClose={() => setSelectedScanToRetry(null)}
        title="Trigger Website Rescan"
        subtitle={selectedScanToRetry?.website}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedScanToRetry(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmRescan}>
              Confirm Rescan
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#4A5750]">
          Trigger automated privacy notice and SSL security rescan for <strong className="text-[#0F2E22]">{selectedScanToRetry?.website}</strong>?
        </p>
      </Modal>
    </div>
  );
};
