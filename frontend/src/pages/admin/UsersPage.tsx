import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ADMIN_USERS, AdminUser } from '../../data/adminMockData';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { Users, Search, Filter, Shield, Key, Ban, UserCheck } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [usersList, setUsersList] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalAction, setModalAction] = useState<'role' | 'suspend' | 'reset' | null>(null);
  const [newRole, setNewRole] = useState<string>('Compliance Lead');

  const filteredUsers = usersList.filter((usr) => {
    const matchesSearch =
      usr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usr.orgName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || usr.adminRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleConfirmAction = () => {
    if (!selectedUser || !modalAction) return;

    if (modalAction === 'suspend') {
      const nextStatus = selectedUser.status === 'Active' ? 'Suspended' : 'Active';
      setUsersList((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: nextStatus } : u))
      );
      addToast(`User ${nextStatus}`, `${selectedUser.name}'s account status set to ${nextStatus}.`, 'warning');
    } else if (modalAction === 'role') {
      setUsersList((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, adminRole: newRole as any } : u))
      );
      addToast('Role Updated', `${selectedUser.name}'s role updated to ${newRole}.`, 'success');
    } else if (modalAction === 'reset') {
      addToast('Password Reset Email Sent', `Sent password reset instructions to ${selectedUser.email}.`, 'info');
    }

    setSelectedUser(null);
    setModalAction(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            PLATFORM GOVERNANCE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">User Management</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Manage user accounts, admin permissions, and security roles across 613 platform users.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E3DDD0]">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search by user name, email, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#7A8981]">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#CFC7B7] bg-white text-xs text-[#0F2E22] focus:outline-none focus:ring-2 focus:ring-[#0F2E22]"
          >
            <option value="ALL">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Compliance Lead">Compliance Lead</option>
            <option value="AI Reviewer">AI Reviewer</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">User Name & Email</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Platform Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Last Active</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4">
                    <div>
                      <span className="font-bold text-[#0F2E22] text-sm block">{usr.name}</span>
                      <span className="text-[11px] text-[#7A8981] font-mono">{usr.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[#0F2E22] font-medium">{usr.orgName}</td>
                  <td className="p-4">
                    <Badge variant="emerald">{usr.adminRole}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={usr.status === 'Active' ? 'success' : 'danger'}>{usr.status}</Badge>
                  </td>
                  <td className="p-4 text-[#7A8981]">{usr.lastActive}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(usr);
                        setNewRole(usr.adminRole);
                        setModalAction('role');
                      }}
                    >
                      Change Role
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(usr);
                        setModalAction('reset');
                      }}
                    >
                      Reset Password
                    </Button>
                    <Button
                      variant={usr.status === 'Active' ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setSelectedUser(usr);
                        setModalAction('suspend');
                      }}
                    >
                      {usr.status === 'Active' ? 'Suspend' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Role Dialog Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={
          modalAction === 'role'
            ? 'Modify User Platform Role'
            : modalAction === 'suspend'
            ? `${selectedUser?.status === 'Active' ? 'Suspend' : 'Reactivate'} User Account`
            : 'Reset User Password'
        }
        subtitle={selectedUser?.email}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmAction}>
              Confirm Action
            </Button>
          </>
        }
      >
        {modalAction === 'role' && (
          <div className="space-y-3">
            <p className="text-xs text-[#4A5750]">
              Select new platform permission role for <strong className="text-[#0F2E22]">{selectedUser?.name}</strong>:
            </p>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={[
                { value: 'Super Admin', label: 'Super Admin (Full Platform Control)' },
                { value: 'Compliance Lead', label: 'Compliance Lead (Manage Org & Assessment)' },
                { value: 'AI Reviewer', label: 'AI Reviewer (Approve AI findings)' },
                { value: 'Viewer', label: 'Viewer (Read-only access)' }
              ]}
            />
          </div>
        )}

        {modalAction === 'suspend' && (
          <p className="text-xs text-[#4A5750]">
            Are you sure you want to {selectedUser?.status === 'Active' ? 'suspend' : 'reactivate'}{' '}
            <strong className="text-[#0F2E22]">{selectedUser?.name}</strong>?
          </p>
        )}

        {modalAction === 'reset' && (
          <p className="text-xs text-[#4A5750]">
            Send a secure password reset link to <strong className="text-[#0F2E22]">{selectedUser?.email}</strong>?
          </p>
        )}
      </Modal>
    </div>
  );
};
