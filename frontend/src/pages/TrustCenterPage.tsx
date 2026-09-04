import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { ScorePill } from '../components/ui/ScorePill';
import { Badge, SeverityBadge, FindingStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MOCK_FINDINGS } from '../data/mockData';
import {
  ShieldCheck,
  ClipboardCheck,
  Globe,
  AlertCircle,
  FileCheck,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';

export const TrustCenterPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const { accountMode, setAccountMode } = useAuth();
  const navigate = useNavigate();

  const isOrgMode = accountMode === 'ORGANIZATION';

  if (!isOrgMode) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
        {/* Personal Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
          <div>
            <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
              PERSONAL WORKSPACE
            </span>
            <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">My Dashboard</h2>
            <p className="text-xs text-[#4A5750] mt-0.5">
              Manage your personal website scans, saved URLs, and preliminary trust checks.
            </p>
          </div>

          <Button variant="primary" size="md" onClick={() => navigate('/scan')} leftIcon={<Globe className="w-4 h-4" />}>
            Check Another Website
          </Button>
        </div>

        {/* Saved Website Checks */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#0F2E22]">Recent Website Checks</h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-[#0F2E22] text-sm">technova.in</div>
                <div className="text-[#7A8981]">Checked today at 14:20 IST</div>
              </div>
              <div className="flex items-center gap-3">
                <ScorePill score={78} statusLabel="Needs Attention" size="sm" />
                <Button variant="outline" size="sm" onClick={() => navigate('/scan')}>
                  Inspect Result
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-[#0F2E22] text-sm">asterlabs.in</div>
                <div className="text-[#7A8981]">Checked 2 days ago</div>
              </div>
              <div className="flex items-center gap-3">
                <ScorePill score={92} statusLabel="Strong" size="sm" />
                <Button variant="outline" size="sm" onClick={() => navigate('/scan')}>
                  Inspect Result
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0F2E22] text-[#F2EDE1] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#E3CFAE]">Managing compliance for an Indian business?</h3>
            <p className="text-xs text-[#D5E0DA] leading-relaxed">
              Create an organization profile to run full 14-step statutory DPDP assessments, upload legal evidence documents, and generate executive PDF audit reports.
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setAccountMode('ORGANIZATION');
              navigate('/onboarding');
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Organization Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="emerald">{currentOrg.industry}</Badge>
            <span className="text-xs text-[#7A8981] font-mono">{currentOrg.website}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2E22]">{currentOrg.name}</h1>
          <p className="text-xs text-[#4A5750]">
            DPDP Compliance Center · Last evaluated {currentOrg.lastAssessed}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 lg:border-l border-[#E3DDD0] pt-4 lg:pt-0 lg:pl-6">
          <ScorePill score={currentOrg.trustScore} statusLabel={currentOrg.postureStatus} size="lg" />
          <Button variant="primary" size="md" onClick={() => navigate('/assessment')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Run Assessment
          </Button>
        </div>
      </div>

      {/* Primary Grid: 4 Core Pillar Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Privacy Compliance', score: 92, status: 'Strong', desc: 'Notice & consent' },
          { label: 'Security Controls', score: 88, status: 'Strong', desc: 'AES-256 / TLS 1.3' },
          { label: 'Data Principal Rights', score: 94, status: 'Strong', desc: 'Redressal portal' },
          { label: 'Data Lifecycle', score: 84, status: 'Needs Attention', desc: 'Retention schedule' }
        ].map((pillar) => (
          <div key={pillar.label} className="p-5 rounded-2xl bg-white border border-[#E3DDD0] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">{pillar.label}</span>
              <ScorePill score={pillar.score} size="sm" />
            </div>
            <p className="text-xs text-[#4A5750]">{pillar.desc}</p>
          </div>
        ))}
      </div>

      {/* Attention Stream */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E3DDD0] pb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#9A3412]" />
            <h3 className="text-sm font-bold text-[#0F2E22]">Attention Required (4 Open Findings)</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/findings')}>
            View All Findings →
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          {MOCK_FINDINGS.slice(0, 2).map((find) => (
            <div key={find.id} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={find.severity} size="sm" />
                  <span className="font-bold text-[#0F2E22] text-sm">{find.title}</span>
                </div>
                <p className="text-[#4A5750]">{find.whyItMatters}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/findings')}>
                Inspect Fix
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
