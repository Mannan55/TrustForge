import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { Settings, Shield, Sliders, Lock, Save, User } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState('60');
  const [scanRateLimit, setScanRateLimit] = useState('100');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Platform Settings Saved', 'Updated administrative thresholds & security configuration.', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl pb-12">
      {/* Header */}
      <div className="border-b border-[#E3DDD0] pb-6 space-y-1">
        <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
          PLATFORM ADMINISTRATION
        </span>
        <h2 className="text-2xl font-bold text-[#0F2E22]">Admin Console Settings</h2>
        <p className="text-xs text-[#4A5750]">
          Configure platform governance parameters, AI thresholds, and security policies.
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'profile', label: 'Admin Profile', icon: <User className="w-4 h-4" /> },
          { id: 'platform', label: 'Platform Engine Parameters', icon: <Sliders className="w-4 h-4" /> },
          { id: 'security', label: 'Security & Auth', icon: <Shield className="w-4 h-4" /> }
        ]}
      />

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-6">
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <h3 className="text-base font-bold text-[#0F2E22]">Admin Profile Details</h3>
            <Input label="Admin Display Name" defaultValue="Super Admin" />
            <Input label="Admin Email" defaultValue="admin@trustforge.in" disabled />

            <div className="pt-4 border-t border-[#E3DDD0] flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Admin Profile
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'platform' && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <h3 className="text-base font-bold text-[#0F2E22]">AI & Scan Engine Parameters</h3>
            <Input
              label="AI Review Hold Threshold (%)"
              value={aiConfidenceThreshold}
              onChange={(e) => setAiConfidenceThreshold(e.target.value)}
              helperText="AI assessments below this confidence score are automatically queued in AI Review Workbench."
            />
            <Input
              label="Max Website Scans Per Hour Per Tenant"
              value={scanRateLimit}
              onChange={(e) => setScanRateLimit(e.target.value)}
              helperText="Rate limit cap to prevent target website WAF blockages."
            />

            <div className="pt-4 border-t border-[#E3DDD0] flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Platform Parameters
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 text-xs text-[#4A5750]">
            <h3 className="text-base font-bold text-[#0F2E22]">Admin Platform Security</h3>
            <p>Mandatory 2FA is currently enforced for all Super Admin and Platform Admin accounts.</p>
            <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] font-semibold">
              ✓ Hardware 2FA & WebAuthn Active
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
