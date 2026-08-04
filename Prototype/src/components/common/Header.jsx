import React, { useState } from 'react';
import { Search, Bell, ShieldCheck, ChevronRight, RefreshCw, User, ExternalLink, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import { MOCK_COMPANY } from '../../data/mockData';

export default function Header({ 
  activeTab, 
  onOpenCmdPalette, 
  currentView, 
  onChangeView, 
  onTriggerScan, 
  onShowToast 
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getBreadcrumbs = () => {
    switch (activeTab) {
      case 'dashboard': return { title: 'Trust Center Overview', section: 'Trust Center' };
      case 'assessment': return { title: 'Assessment Wizard', section: 'DPDP Evaluation' };
      case 'scan': return { title: 'Website Audit Results', section: 'Security & Privacy Scan' };
      case 'score': return { title: 'Trust Score Breakdown', section: 'TEF Analytics' };
      case 'findings': return { title: 'Findings & Remediation', section: 'Audit Log' };
      case 'reports': return { title: 'Report Preview & PDF', section: 'Executive Compliance' };
      case 'settings': return { title: 'Organization & DPO Settings', section: 'Governance' };
      default: return { title: 'Trust Center', section: 'Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumbs();

  const handleQuickScan = () => {
    onTriggerScan();
    onShowToast('Deep Website Scan re-initiated for technova.in', 'success');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between transition-all">
      {/* Left: Breadcrumb */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <span>TechNova</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">{breadcrumb.section}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight ml-1">
          {breadcrumb.title}
        </h1>
        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
          DPDP 2023 Compliant
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCmdPalette}
          className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-xs text-slate-500 transition-colors shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick Search...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* View Switcher / Prototype Navigation Toggle */}
        <div className="relative">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => onChangeView('app')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currentView === 'app' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              App
            </button>
            <button
              onClick={() => onChangeView('landing')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currentView === 'landing' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Landing
            </button>
            <button
              onClick={() => onChangeView('login')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currentView === 'login' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Login
            </button>
          </div>
        </div>

        {/* Quick Scan Action Button */}
        <button
          onClick={handleQuickScan}
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Scan Domain</span>
        </button>

        {/* Notifications Popover Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">3 New</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer">
                  <div className="font-medium text-slate-800">Weekly Scan Completed</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Technova.in score increased from 87 to 89.</div>
                  <div className="text-[10px] text-slate-400 mt-1">10 mins ago</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 transition-colors cursor-pointer">
                  <div className="font-medium text-amber-900 flex items-center">
                    <Sparkles className="w-3 h-3 text-amber-600 mr-1" />
                    DPDP Rule 7 Update Triggered
                  </div>
                  <div className="text-amber-700 text-[11px] mt-0.5">New Vernacular notice guidelines published.</div>
                  <div className="text-[10px] text-amber-500 mt-1">2 hours ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100">
              RS
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="font-semibold text-slate-900">{MOCK_COMPANY.dpoName}</div>
                <div className="text-slate-500 text-[11px] truncate">{MOCK_COMPANY.dpoEmail}</div>
                <div className="text-[10px] font-medium text-blue-600 mt-1">Data Protection Officer (DPO)</div>
              </div>
              <button 
                onClick={() => { onChangeView('app'); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
              >
                <span>Organization Settings</span>
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button 
                onClick={() => { onChangeView('login'); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-medium mt-1"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
