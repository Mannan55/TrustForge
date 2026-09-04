import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_ADMIN_ORGS, MOCK_ADMIN_USERS, MOCK_ADMIN_SCANS } from '../../data/adminMockData';
import { MOCK_FINDINGS } from '../../data/mockData';
import { ScorePill } from '../../components/ui/ScorePill';
import { Badge, SeverityBadge, FindingStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { ArrowLeft, Building2, Users, Globe, ClipboardCheck, AlertCircle, FileText, Activity } from 'lucide-react';

export const OrgDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const org = MOCK_ADMIN_ORGS.find((o) => o.id === id) || MOCK_ADMIN_ORGS[0];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/organizations')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
        Back to Organizations
      </Button>

      {/* Header Profile Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={org.status === 'Active' ? 'success' : 'danger'}>{org.status}</Badge>
              <span className="text-xs text-[#7A8981]">Registered: {org.createdDate}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#0F2E22]">{org.name}</h2>
            <p className="text-xs text-[#4A5750] font-mono">{org.website} · {org.industry} · {org.size}</p>
          </div>

          <ScorePill score={org.trustScore} statusLabel={org.postureStatus} size="md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#4A5750]">
          <div>
            <span className="text-[#7A8981] block">Primary Compliance Contact:</span>
            <span className="font-semibold text-[#0F2E22]">{org.primaryContact}</span>
          </div>
          <div>
            <span className="text-[#7A8981] block">Data Context:</span>
            <span className="text-[#0F2E22]">{org.dataContext}</span>
          </div>
          <div>
            <span className="text-[#7A8981] block">Assessment Status:</span>
            <span className="font-semibold text-[#0F2E22]">{org.assessmentStatus} ({org.lastAssessed})</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview', icon: <Building2 className="w-4 h-4" /> },
          { id: 'users', label: 'Users', count: org.userCount, icon: <Users className="w-4 h-4" /> },
          { id: 'scans', label: 'Website Scans', icon: <Globe className="w-4 h-4" /> },
          { id: 'findings', label: 'Open Findings', count: 4, icon: <AlertCircle className="w-4 h-4" /> }
        ]}
      />

      {/* Tab Contents */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-[#0F2E22]">Organization Compliance Audit Summary</h3>
            <p className="text-xs text-[#4A5750] leading-relaxed">
              TechNova Solutions demonstrates a strong digital trust baseline with explicit notice mechanisms and active Data Principal portals. Retention schedule documentation under Section 8(7) requires update.
            </p>

            <div className="border-t border-[#E3DDD0] pt-4 space-y-3">
              <h4 className="text-xs font-bold text-[#7A8981] uppercase">Recent Website Scans</h4>
              <div className="space-y-2 text-xs">
                {MOCK_ADMIN_SCANS.slice(0, 2).map((scan) => (
                  <div key={scan.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#0F2E22]">{scan.website}</span>
                      <span className="text-[#7A8981] block text-[11px]">Scanned: {scan.startedTime}</span>
                    </div>
                    <Badge variant="success">Completed ({scan.duration})</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#0F2E22]">Associated Organization Users</h3>
            <div className="divide-y divide-[#E3DDD0] text-xs">
              {MOCK_ADMIN_USERS.map((usr) => (
                <div key={usr.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-[#0F2E22] block">{usr.name}</span>
                    <span className="text-[#7A8981]">{usr.email}</span>
                  </div>
                  <Badge variant="emerald">{usr.adminRole}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scans' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#0F2E22]">Website Scans Log</h3>
            <p className="text-xs text-[#4A5750]">Automated privacy notice and DOM scanning history for {org.website}.</p>
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#0F2E22]">Outstanding Compliance Gaps</h3>
            <div className="space-y-3">
              {MOCK_FINDINGS.map((finding) => (
                <div key={finding.id} className="p-4 rounded-xl border border-[#E3DDD0] bg-[#FAF8F5] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <SeverityBadge severity={finding.severity} />
                    <FindingStatusBadge status={finding.status} />
                  </div>
                  <h4 className="font-bold text-[#0F2E22]">{finding.title}</h4>
                  <p className="text-[#4A5750]">{finding.dpdpReference}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
