import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Globe, 
  AlertTriangle, 
  FileCheck, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAssessment } from '../../context/AssessmentContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { organization, logout } = useAuth();
  const { trustScore } = useAssessment();
  const location = useLocation();

  const mainNav = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assessment', path: '/assessment', icon: ClipboardCheck },
    { name: 'Website Scan', path: '/scan', icon: Globe },
    { name: 'Findings', path: '/findings', icon: AlertTriangle },
    { name: 'Evidence', path: '/evidence', icon: FileCheck },
    { name: 'Reports', path: '/reports', icon: FileText }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0F2E22] text-[#F2EDE1] flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#184736] ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Header Branding */}
        <div className="p-6 border-b border-[#184736]">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/brand/01-logos/trustforge-symbol.svg"
              alt="TrustForge Symbol"
              className="w-7 h-7 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider text-[#F2EDE1] uppercase">
                TrustForge
              </span>
              <span className="text-[10px] text-[#E3CFAE]/80 font-mono tracking-tight">
                DPDP Baseline Engine
              </span>
            </div>
          </div>

          {/* Organization Context Card */}
          <div className="mt-5 p-3.5 rounded-xl bg-[#184736]/60 border border-[#22634B] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-lg bg-[#E3CFAE] text-[#0F2E22] flex items-center justify-center shrink-0 font-bold text-xs">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F2EDE1] truncate">
                  {organization?.legalName || 'Individual Account'}
                </div>
                <div className="text-[10px] text-[#E3CFAE]/90 font-mono truncate">
                  {organization?.primaryDomain ? new URL(organization.primaryDomain).hostname : 'Personal Workspace'}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Score Summary Pill */}
          <div className="mt-3 p-3 rounded-xl bg-[#0B1E16] border border-[#184736] flex items-center justify-between">
            <div className="text-xs font-medium text-[#E3CFAE]">
              Trust Score
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                {trustScore.overallScore}
              </span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-4 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E3CFAE]/60">
            Navigation
          </div>

          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#E3CFAE] text-[#0F2E22] shadow-xs'
                    : 'text-[#F2EDE1]/80 hover:bg-[#184736] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0F2E22]' : 'text-[#E3CFAE]/70'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#0F2E22]" />}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation & Settings */}
      <div className="p-4 border-t border-[#184736] space-y-2">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
            location.pathname === '/settings'
              ? 'bg-[#E3CFAE] text-[#0F2E22]'
              : 'text-[#F2EDE1]/80 hover:bg-[#184736] hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4 text-[#E3CFAE]/70" />
            <span>Settings</span>
          </div>
        </NavLink>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
