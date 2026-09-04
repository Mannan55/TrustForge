import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ADMIN_ORGS, AdminOrg } from '../../data/adminMockData';
import { ScorePill } from '../../components/ui/ScorePill';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { Building2, Search, Filter, MoreVertical, ShieldAlert, Eye, Ban, CheckCircle2 } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [orgs, setOrgs] = useState<AdminOrg[]>(MOCK_ADMIN_ORGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedOrgForAction, setSelectedOrgForAction] = useState<AdminOrg | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | null>(null);

  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmStatusChange = () => {
    if (!selectedOrgForAction || !actionType) return;
    const newStatus = actionType === 'suspend' ? 'Suspended' : 'Active';

    setOrgs((prev) =>
      prev.map((o) => (o.id === selectedOrgForAction.id ? { ...o, status: newStatus } : o))
    );

    addToast(
      `Organization ${newStatus}`,
      `${selectedOrgForAction.name} has been ${actionType === 'suspend' ? 'suspended' : 'activated'}.`,
      actionType === 'suspend' ? 'warning' : 'success'
    );

    setSelectedOrgForAction(null);
    setActionType(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            PLATFORM TENANTS
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Organization Management</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Monitor and govern 248 registered Indian entity tenant accounts.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E3DDD0]">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search by org name, website, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#7A8981]">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#CFC7B7] bg-white text-xs text-[#0F2E22] focus:outline-none focus:ring-2 focus:ring-[#0F2E22]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Enterprise Organization Data Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Organization</th>
                <th className="p-4">Users</th>
                <th className="p-4">Trust Score</th>
                <th className="p-4">Assessment Status</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4">
                    <div>
                      <span className="font-bold text-[#0F2E22] text-sm block">{org.name}</span>
                      <span className="text-[11px] text-[#7A8981] font-mono">{org.website} · {org.industry}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-[#0F2E22]">{org.userCount} users</td>
                  <td className="p-4">
                    <ScorePill score={org.trustScore} statusLabel={org.postureStatus} size="sm" />
                  </td>
                  <td className="p-4">
                    <Badge variant={org.assessmentStatus === 'Completed' ? 'success' : org.assessmentStatus === 'In Progress' ? 'info' : 'warning'}>
                      {org.assessmentStatus}
                    </Badge>
                  </td>
                  <td className="p-4 text-[#7A8981]">{org.lastAssessed}</td>
                  <td className="p-4">
                    <Badge variant={org.status === 'Active' ? 'success' : 'danger'}>
                      {org.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/organizations/${org.id}`)}>
                      Inspect
                    </Button>
                    {org.status === 'Active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrgForAction(org);
                          setActionType('suspend');
                        }}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedOrgForAction(org);
                          setActionType('activate');
                        }}
                      >
                        Reactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      <Modal
        isOpen={!!selectedOrgForAction}
        onClose={() => setSelectedOrgForAction(null)}
        title={actionType === 'suspend' ? 'Suspend Organization' : 'Reactivate Organization'}
        subtitle={selectedOrgForAction?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedOrgForAction(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'suspend' ? 'danger' : 'primary'}
              onClick={handleConfirmStatusChange}
            >
              Confirm {actionType === 'suspend' ? 'Suspension' : 'Reactivation'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#4A5750]">
          Are you sure you want to {actionType} <strong className="text-[#0F2E22]">{selectedOrgForAction?.name}</strong>?
          {actionType === 'suspend' && ' This will temporarily disable active website privacy scanning and team access.'}
        </p>
      </Modal>
    </div>
  );
};
