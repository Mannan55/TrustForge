import React, { useState } from 'react';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Tabs } from '../components/ui/Tabs';
import { Save, Building2, User, Bell, Shield, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentOrg, updateOrg } = useOrg();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('org');
  const [orgForm, setOrgForm] = useState({
    name: currentOrg.name,
    industry: currentOrg.industry,
    website: currentOrg.website,
    primaryContact: currentOrg.primaryContact
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name || 'Rajesh Sharma',
    email: user?.email || 'rajesh@technova.in'
  });

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg(orgForm);
    addToast('Organization Settings Saved', 'Entity details updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl pb-12">
      {/* Header */}
      <div className="border-b border-[#E3DDD0] pb-6 space-y-1">
        <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
          SYSTEM PREFERENCES
        </span>
        <h2 className="text-2xl font-bold text-[#0F2E22]">Settings</h2>
        <p className="text-xs text-[#4A5750]">
          Manage organization profile, team permissions, and DPDP assessment defaults.
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'org', label: 'Organization Profile', icon: <Building2 className="w-4 h-4" /> },
          { id: 'profile', label: 'User Profile', icon: <User className="w-4 h-4" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
          { id: 'security', label: 'Security & Auth', icon: <Shield className="w-4 h-4" /> }
        ]}
      />

      {/* Tab Contents */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-6">
        {activeTab === 'org' && (
          <form onSubmit={handleSaveOrg} className="space-y-4">
            <h3 className="text-base font-bold text-[#0F2E22]">Organization Settings</h3>
            <Input
              label="Legal Organization Name"
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
            />
            <Input
              label="Industry Category"
              value={orgForm.industry}
              onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
            />
            <Input
              label="Primary Website Domain"
              value={orgForm.website}
              onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
            />
            <Input
              label="Designated Grievance / DPO Contact"
              value={orgForm.primaryContact}
              onChange={(e) => setOrgForm({ ...orgForm, primaryContact: e.target.value })}
            />

            <div className="pt-4 border-t border-[#E3DDD0] flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'profile' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addToast('Profile Updated', 'User profile settings saved.', 'success');
            }}
            className="space-y-4"
          >
            <h3 className="text-base font-bold text-[#0F2E22]">Personal Account Profile</h3>
            <Input
              label="Full Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
            <Input label="Work Email" value={profileForm.email} disabled />

            <div className="pt-4 border-t border-[#E3DDD0] flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Profile
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#0F2E22]">Notification Preferences</h3>
            <div className="space-y-3 text-xs text-[#4A5750]">
              {[
                { title: 'High Priority Gap Alerts', desc: 'Email when high severity DPDP non-compliance is detected.' },
                { title: 'Automated Scan Digests', desc: 'Weekly summary of website privacy scan results.' },
                { title: 'CERT-In Regulatory Bulletins', desc: 'Alerts regarding new Indian privacy guidelines.' }
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-3 p-3 rounded-xl border border-[#E3DDD0] bg-[#FAF8F5]">
                  <input type="checkbox" defaultChecked className="mt-0.5 accent-[#0F2E22]" />
                  <div>
                    <div className="font-semibold text-[#0F2E22]">{item.title}</div>
                    <div className="text-[#7A8981]">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 text-xs text-[#4A5750]">
            <h3 className="text-base font-bold text-[#0F2E22]">Security & Authentication</h3>
            <p>Enforce 2-Factor Authentication (2FA) for organization members.</p>
            <Button variant="outline" size="sm" leftIcon={<Key className="w-4 h-4" />}>
              Configure Two-Factor Auth
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
