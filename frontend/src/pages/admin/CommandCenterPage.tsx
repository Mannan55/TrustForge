import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_ADMIN_ORGS, MOCK_ADMIN_SCANS, MOCK_AI_REVIEWS, MOCK_SYSTEM_HEALTH, MOCK_ADMIN_AUDIT_LOGS } from '../../data/adminMockData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Building2,
  Users,
  ClipboardCheck,
  Globe,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Activity,
  CheckCircle2
} from 'lucide-react';

export const CommandCenterPage: React.FC = () => {
  const navigate = useNavigate();

  const failedScans = MOCK_ADMIN_SCANS.filter((s) => s.status === 'Failed');
  const pendingAiReviews = MOCK_AI_REVIEWS.filter((r) => r.status === 'Pending Review');

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header & Platform Operational Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            ADMIN CONSOLE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Command Center</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Real-time platform operational status & governance oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-bold text-[#166534]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#166534] animate-pulse" />
            <span>Platform Status: Operational</span>
          </div>
        </div>
      </div>

      {/* KEY PLATFORM METRICS (Strictly 4 Clean Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => navigate('/admin/organizations')}
          className="p-6 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-xs transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A8981] uppercase">Organizations</span>
            <div className="p-2 rounded-lg bg-[#FAF8F5] text-[#0F2E22]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F2E22]">248</div>
          <p className="text-[11px] text-[#7A8981]">Active legal entities on DPDP framework</p>
        </div>

        <div
          onClick={() => navigate('/admin/users')}
          className="p-6 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-xs transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A8981] uppercase">Active Users</span>
            <div className="p-2 rounded-lg bg-[#FAF8F5] text-[#0F2E22]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F2E22]">613</div>
          <p className="text-[11px] text-[#7A8981]">Compliance officers & admins</p>
        </div>

        <div
          onClick={() => navigate('/admin/assessments')}
          className="p-6 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-xs transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A8981] uppercase">Assessments</span>
            <div className="p-2 rounded-lg bg-[#FAF8F5] text-[#0F2E22]">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F2E22]">391</div>
          <p className="text-[11px] text-[#7A8981]">Completed DPDP assessment modules</p>
        </div>

        <div
          onClick={() => navigate('/admin/scans')}
          className="p-6 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-xs transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A8981] uppercase">Website Scans</span>
            <div className="p-2 rounded-lg bg-[#FAF8F5] text-[#0F2E22]">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F2E22]">1,284</div>
          <p className="text-[11px] text-[#7A8981]">Website privacy signals audited</p>
        </div>
      </div>

      {/* ATTENTION REQUIRED & HEALTH SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ATTENTION REQUIRED Stream (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E3DDD0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DDD0] pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#991B1B]" />
              <h3 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">
                ATTENTION REQUIRED
              </h3>
            </div>
            <span className="text-xs font-bold text-[#991B1B]">
              {failedScans.length + pendingAiReviews.length} Action Items
            </span>
          </div>

          <div className="space-y-3">
            {/* Failed Scans Alert */}
            {failedScans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => navigate('/admin/scans')}
                className="p-4 rounded-xl border border-[#FCA5A5] bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] transition-colors cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">Scan Failure</Badge>
                    <span className="text-xs font-bold text-[#0F2E22]">{scan.website}</span>
                  </div>
                  <p className="text-xs text-[#991B1B] font-medium">{scan.errorReason}</p>
                  <p className="text-[11px] text-[#7A8981]">Org: {scan.orgName}</p>
                </div>
                <Button variant="outline" size="sm">
                  Inspect Scan
                </Button>
              </div>
            ))}

            {/* AI Review Alert */}
            {pendingAiReviews.map((rev) => (
              <div
                key={rev.id}
                onClick={() => navigate('/admin/ai-review')}
                className="p-4 rounded-xl border border-[#FED7AA] bg-[#FFEDD5]/60 hover:bg-[#FFEDD5] transition-colors cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">AI Low Confidence ({rev.confidence}%)</Badge>
                    <span className="text-xs font-bold text-[#0F2E22]">{rev.title}</span>
                  </div>
                  <p className="text-xs text-[#9A3412] line-clamp-1">{rev.aiRationaleSummary}</p>
                  <p className="text-[11px] text-[#7A8981]">Org: {rev.orgName}</p>
                </div>
                <Button variant="secondary" size="sm">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* HEALTH SNAPSHOT */}
        <div className="bg-white p-6 rounded-2xl border border-[#E3DDD0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DDD0] pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F2E22]" />
              <h3 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">
                HEALTH SNAPSHOT
              </h3>
            </div>
            <Link to="/admin/system-health" className="text-xs font-semibold text-[#0F2E22] hover:underline">
              Full Metrics →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {MOCK_SYSTEM_HEALTH.map((srv) => (
              <div key={srv.name} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0]">
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#0F2E22] block">{srv.name}</span>
                  <span className="text-[10px] text-[#7A8981]">{srv.latencyMs}ms latency</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#166534] font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{srv.uptimePercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PLATFORM ACTIVITY STREAM (Compact Audit Feed) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3DDD0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3DDD0] pb-4">
          <h3 className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">
            PLATFORM AUDIT STREAM
          </h3>
          <Link to="/admin/audit-logs" className="text-xs font-semibold text-[#0F2E22] hover:underline">
            View All Logs →
          </Link>
        </div>

        <div className="divide-y divide-[#E3DDD0] text-xs text-[#4A5750]">
          {MOCK_ADMIN_AUDIT_LOGS.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-3.5 h-3.5 text-[#7A8981] shrink-0" />
                <span>
                  <strong className="text-[#0F2E22]">{log.actorName}</strong> {log.action} on <span className="font-mono text-[#0F2E22]">{log.targetResource}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[#7A8981]">
                <span>{log.orgName}</span>
                <span>·</span>
                <span>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
