import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  ShieldCheck, 
  ChevronRight, 
  RefreshCw, 
  User, 
  SlidersHorizontal,
  Building2,
  ChevronDown
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import Button from '../ui/Button';

export default function TopNavigation({ 
  onOpenCmdPalette, 
  onTriggerScan, 
  onShowToast,
  company 
}) {
  const { currentPath, navigate } = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);

  const getBreadcrumbs = () => {
    switch (currentPath) {
      case '/dashboard': return { title: 'Trust Center Overview', section: 'Trust Center' };
      case '/assessment': return { title: 'Assessment Wizard', section: 'DPDP Evaluation' };
      case '/scan': return { title: 'Website Audit Results', section: 'Security & Privacy Scan' };
      case '/trust-score': return { title: 'Trust Score Breakdown', section: 'TEF Analytics' };
      case '/findings': return { title: 'Findings & Remediation', section: 'Audit Log' };
      case '/reports': return { title: 'Report Preview & PDF', section: 'Executive Compliance' };
      case '/settings': return { title: 'Organization & DPO Settings', section: 'Governance' };
      default: return { title: 'Trust Center', section: 'Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumbs();

  const handleQuickScan = () => {
    onTriggerScan();
    onShowToast(`Deep Website Scan re-initiated for ${company?.website || 'technova.in'}`, 'success');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between transition-all">
      {/* Left: Breadcrumbs & Organization Switcher */}
      <div className="flex items-center space-x-4">
        {/* Organization Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOrgMenu(!showOrgMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
          >
            <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {company?.name ? company.name.substring(0, 2).toUpperCase() : 'TN'}
            </div>
            <span className="truncate max-w-[140px]">{company?.name || 'TechNova Solutions'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showOrgMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Current Organization</div>
                <div className="font-semibold text-slate-900 truncate mt-0.5">{company?.name || 'TechNova Solutions Pvt Ltd'}</div>
                <div className="text-[11px] text-slate-500 truncate">{company?.website || 'https://www.technova.in'}</div>
              </div>
              <button
                onClick={() => {
                  setShowOrgMenu(false);
                  navigate('/onboarding');
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-blue-600 font-semibold flex items-center justify-between"
              >
                <span>+ Add New Organization</span>
                <Building2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">{breadcrumb.section}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">{breadcrumb.title}</span>
        </div>

        <span className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
          DPDP 2023 Compliant
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCmdPalette}
          className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-xs text-slate-500 transition-colors shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick Search...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Quick Scan Action Button */}
        <Button onClick={handleQuickScan} size="sm" icon={RefreshCw}>
          Re-Scan
        </Button>

        {/* Notifications Popover Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">3 New</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer">
                  <div className="font-medium text-slate-800">Weekly Scan Completed</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Technova.in score increased from 87 to 89.</div>
                  <div className="text-[10px] text-slate-400 mt-1">10 mins ago</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100 transition-colors cursor-pointer">
                  <div className="font-medium text-amber-900">DPDP Rule 7 Update</div>
                  <div className="text-amber-700 text-[11px] mt-0.5">New Vernacular notice guidelines published.</div>
                  <div className="text-[10px] text-amber-500 mt-1">2 hours ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100">
              RS
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="font-semibold text-slate-900">Rajesh V. Sharma</div>
                <div className="text-slate-500 text-[11px] truncate">grievance@technova.in</div>
                <div className="text-[10px] font-medium text-blue-600 mt-1">Data Protection Officer (DPO)</div>
              </div>
              <button 
                onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
              >
                <span>Organization Settings</span>
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button 
                onClick={() => { navigate('/'); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-medium mt-1"
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
