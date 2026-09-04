import React, { useState } from 'react';
import { MOCK_ADMIN_AUDIT_LOGS } from '../../data/adminMockData';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { History, Search, Filter, ShieldCheck } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = MOCK_ADMIN_AUDIT_LOGS.filter((log) => {
    return (
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            SECURITY & GOVERNANCE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Platform Audit Trail</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Immutable log of administrative actions, permission updates, and automated system events.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-[#E3DDD0] max-w-md">
        <Input
          placeholder="Filter audit logs by actor, action, or target..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action Performed</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4 text-[#7A8981] font-mono">{log.timestamp}</td>
                  <td className="p-4">
                    <span className="font-bold text-[#0F2E22] block">{log.actorName}</span>
                    <span className="text-[11px] text-[#7A8981]">{log.actorEmail}</span>
                  </td>
                  <td className="p-4 font-semibold text-[#0F2E22]">{log.action}</td>
                  <td className="p-4 font-mono text-[#0F2E22]">{log.targetResource}</td>
                  <td className="p-4 text-[#4A5750]">{log.orgName}</td>
                  <td className="p-4">
                    <Badge variant={log.result === 'Success' ? 'success' : 'warning'}>
                      {log.result}
                    </Badge>
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
