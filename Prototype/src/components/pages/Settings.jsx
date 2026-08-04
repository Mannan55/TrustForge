import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Bell, 
  SlidersHorizontal, 
  Shield, 
  Check, 
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';
import { MOCK_COMPANY } from '../../data/mockData';

export default function Settings({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [companyName, setCompanyName] = useState(MOCK_COMPANY.name);
  const [dpoName, setDpoName] = useState(MOCK_COMPANY.dpoName);
  const [dpoEmail, setDpoEmail] = useState(MOCK_COMPANY.dpoEmail);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    onShowToast('Settings saved successfully.', 'success');
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Organization & Governance Settings
        </h1>
        <p className="text-xs text-slate-500">
          Manage {MOCK_COMPANY.name}'s DPDP compliance parameters, DPO details, and notifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & DPO</span>
        </button>

        <button
          onClick={() => setActiveTab('organization')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'organization' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organization Info</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'appearance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Appearance & Trust Badge</span>
        </button>
      </div>

      {/* Settings Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4 max-w-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Data Protection Officer (DPO) Profile</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">DPO Full Name</label>
              <input
                type="text"
                value={dpoName}
                onChange={(e) => setDpoName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grievance Email Address</label>
              <input
                type="email"
                value={dpoEmail}
                onChange={(e) => setDpoEmail(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">DPO Appointment Verification</label>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
                <span>DPDP Rule 5 Designation Verified</span>
                <span className="font-bold">Active ✓</span>
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Save Profile Settings
            </button>
          </form>
        )}

        {/* ORGANIZATION TAB */}
        {activeTab === 'organization' && (
          <form onSubmit={handleSave} className="space-y-4 max-w-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Company Legal Details</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Entity Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MCA Corporate Identification Number (CIN)</label>
              <input
                type="text"
                defaultValue={MOCK_COMPANY.cin}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data Fiduciary Status</label>
              <input
                type="text"
                defaultValue={MOCK_COMPANY.tier}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                readOnly
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Update Organization Info
            </button>
          </form>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-xl text-xs">
            <h3 className="text-sm font-bold text-slate-900">Compliance & Scan Alert Triggers</h3>
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Email Digest on Scan Failures</div>
                <div className="text-slate-500 text-[11px]">Send immediate alert if domain scan score drops below 85</div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Slack Security Webhook</div>
                <div className="text-slate-500 text-[11px]">Post DPDP findings to #compliance-alerts</div>
              </div>
              <input
                type="checkbox"
                checked={slackAlerts}
                onChange={(e) => setSlackAlerts(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">TrustForge Public Trust Badge Embed</h3>
            <p className="text-slate-500">Embed this verified DPDP Trust Badge on technova.in to build buyer trust.</p>

            <div className="p-6 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-blue-400" />
                <div>
                  <div className="font-bold text-sm">Verified by TrustForge</div>
                  <div className="text-[11px] text-slate-400">DPDP Act 2023 Compliant • Score: 89/100</div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-bold">
                Live Badge
              </span>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800">
              <code>&lt;script src="https://cdn.trustforge.in/badge.js" data-company-cin="U72900KA2021PTC145123"&gt;&lt;/script&gt;</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
