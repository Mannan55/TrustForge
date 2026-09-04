import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../layout/BrandLogo';
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Users,
  ClipboardCheck,
  Globe,
  AlertCircle,
  FileCheck,
  Sparkles,
  Sliders,
  FileText,
  Activity,
  History,
  Settings,
  ArrowLeftRight
} from 'lucide-react';

interface NavGroupProps {
  label: string;
  children: React.ReactNode;
}

const NavGroup: React.FC<NavGroupProps> = ({ label, children }) => (
  <div className="space-y-1">
    <div className="px-3 text-[10px] font-bold text-[#A3B2AA] uppercase tracking-wider">
      {label}
    </div>
    <div className="space-y-0.5">{children}</div>
  </div>
);

interface NavItemProps {
  to: string;
  end?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'emerald' | 'amber' | 'coral';
}

const NavItem: React.FC<NavItemProps> = ({ to, end = false, icon, children, badge, badgeColor = 'emerald' }) => {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to) && (to !== '/admin' || location.pathname === '/admin');

  return (
    <NavLink
      to={to}
      end={end}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
        isActive
          ? 'bg-[#E3CFAE] text-[#0F2E22] font-bold shadow-xs'
          : 'text-[#D5E0DA] hover:bg-[#164030] hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={isActive ? 'text-[#0F2E22]' : 'text-[#A3B2AA]'}>{icon}</span>
        <span>{children}</span>
      </div>
      {badge !== undefined && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            badgeColor === 'amber'
              ? 'bg-[#FFEDD5] text-[#9A3412]'
              : badgeColor === 'coral'
              ? 'bg-[#FEE2E2] text-[#991B1B]'
              : isActive
              ? 'bg-[#0F2E22] text-[#F2EDE1]'
              : 'bg-[#164030] text-[#E3CFAE]'
          }`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export const AdminSidebar: React.FC<{ onClose?: () => void }> = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-[#0F2E22] text-[#F2EDE1] flex flex-col h-screen shrink-0 border-r border-[#0B2319] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#164030] space-y-2">
        <div className="flex items-center justify-between">
          <NavLink to="/admin" className="block focus:outline-none">
            <BrandLogo variant="light" height={26} />
          </NavLink>
          <span className="px-2 py-0.5 rounded-md bg-[#E3CFAE] text-[#0F2E22] text-[10px] font-bold tracking-wider uppercase">
            ADMIN
          </span>
        </div>
        <p className="text-[10px] text-[#A3B2AA] font-mono">Platform Governance Console</p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        <NavGroup label="OVERVIEW">
          <NavItem to="/admin" end icon={<LayoutDashboard className="w-4 h-4" />}>
            Command Center
          </NavItem>
          <NavItem to="/admin/analytics" icon={<BarChart3 className="w-4 h-4" />}>
            Platform Analytics
          </NavItem>
        </NavGroup>

        <NavGroup label="PLATFORM">
          <NavItem to="/admin/organizations" icon={<Building2 className="w-4 h-4" />} badge="248">
            Organizations
          </NavItem>
          <NavItem to="/admin/users" icon={<Users className="w-4 h-4" />} badge="613">
            Users
          </NavItem>
        </NavGroup>

        <NavGroup label="COMPLIANCE">
          <NavItem to="/admin/assessments" icon={<ClipboardCheck className="w-4 h-4" />}>
            Assessments
          </NavItem>
          <NavItem to="/admin/scans" icon={<Globe className="w-4 h-4" />} badge="3" badgeColor="coral">
            Website Scans
          </NavItem>
          <NavItem to="/admin/findings" icon={<AlertCircle className="w-4 h-4" />}>
            Findings
          </NavItem>
          <NavItem to="/admin/evidence" icon={<FileCheck className="w-4 h-4" />}>
            Evidence
          </NavItem>
        </NavGroup>

        <NavGroup label="INTELLIGENCE">
          <NavItem to="/admin/ai-review" icon={<Sparkles className="w-4 h-4" />} badge="2" badgeColor="amber">
            AI Review
          </NavItem>
          <NavItem to="/admin/rules" icon={<Sliders className="w-4 h-4" />}>
            Compliance Rules
          </NavItem>
        </NavGroup>

        <NavGroup label="OPERATIONS">
          <NavItem to="/admin/reports" icon={<FileText className="w-4 h-4" />}>
            Reports
          </NavItem>
          <NavItem to="/admin/system-health" icon={<Activity className="w-4 h-4" />}>
            System Health
          </NavItem>
          <NavItem to="/admin/audit-logs" icon={<History className="w-4 h-4" />}>
            Audit Logs
          </NavItem>
        </NavGroup>
      </div>

      {/* Footer Switcher back to User Console & Admin Settings */}
      <div className="p-3 border-t border-[#164030] space-y-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#E3CFAE] bg-[#164030] hover:bg-[#1C4D3A] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Switch to User App</span>
          </div>
          <span className="text-[10px] text-[#A3B2AA]">/dashboard</span>
        </button>

        <NavItem to="/admin/settings" icon={<Settings className="w-4 h-4" />}>
          Admin Settings
        </NavItem>
      </div>
    </aside>
  );
};
