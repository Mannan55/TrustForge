import React from 'react';
import { MOCK_SYSTEM_HEALTH } from '../../data/adminMockData';
import { Badge } from '../../components/ui/Badge';
import { Activity, CheckCircle2, Server, Cpu, Database, HardDrive, Shield } from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            PLATFORM INFRASTRUCTURE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">System Health & Metrics</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Operational status, API latency, and uptime metrics for TrustForge platform microservices.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-bold text-[#166534]">
          <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" />
          <span>All Services Operational (99.94% Uptime)</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SYSTEM_HEALTH.map((srv) => (
          <div key={srv.name} className="p-6 rounded-2xl border border-[#E3DDD0] bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A8981] uppercase">Microservice</span>
              <Badge variant="success">
                ● {srv.status}
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0F2E22]">{srv.name}</h3>
              <p className="text-xs text-[#7A8981]">Last diagnostic check: {srv.lastChecked}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E3DDD0] text-xs">
              <div>
                <span className="text-[#7A8981] block">Average Latency</span>
                <span className="font-mono font-bold text-[#0F2E22] text-sm">{srv.latencyMs} ms</span>
              </div>
              <div>
                <span className="text-[#7A8981] block">30-Day Uptime</span>
                <span className="font-mono font-bold text-[#166534] text-sm">{srv.uptimePercentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics Overview */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] space-y-4">
        <h3 className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">
          INFRASTRUCTURE PERFORMANCE SUMMARY
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-1">
            <span className="text-[#7A8981] block">API Gateway Response SLA</span>
            <span className="text-xl font-bold text-[#0F2E22]">38ms (P95)</span>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-1">
            <span className="text-[#7A8981] block">Failed Background Jobs</span>
            <span className="text-xl font-bold text-[#166534]">0.02% (Nominal)</span>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] space-y-1">
            <span className="text-[#7A8981] block">Database Connection Pool</span>
            <span className="text-xl font-bold text-[#0F2E22]">18 / 100 Connections</span>
          </div>
        </div>
      </div>
    </div>
  );
};
