import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';
import { ScorePill } from '../ui/ScorePill';
import {
  LayoutDashboard,
  ClipboardCheck,
  Globe,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  CheckSquare,
  FileText,
  Settings,
  Building2,
  User,
  Plus
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
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string | number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, children, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
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
            isActive ? 'bg-[#0F2E22] text-[#F2EDE1]' : 'bg-[#164030] text-[#E3CFAE]'
          }`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC<{ onClose?: () => void }> = () => {
  const { currentOrg } = useOrg();
  const { accountMode, setAccountMode } = useAuth();
  const navigate = useNavigate();

  const isOrgMode = accountMode === 'ORGANIZATION';

  return (
    <aside className="w-64 bg-[#0F2E22] text-[#F2EDE1] flex flex-col h-screen shrink-0 border-r border-[#0B2319] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#164030] space-y-4">
        <NavLink to="/dashboard" className="block focus:outline-none">
          <BrandLogo variant="light" height={28} />
        </NavLink>

        {/* Integrated Active Organization Context & Score Pill */}
        {isOrgMode ? (
          <div className="p-3 rounded-xl bg-[#0B2319] border border-[#164030] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-[#E3CFAE] shrink-0" />
                <span className="text-xs font-bold text-white truncate">{currentOrg.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#164030]/60">
              <span className="text-[10px] font-mono text-[#A3B2AA]">Trust Score</span>
              <ScorePill score={currentOrg.trustScore} statusLabel={currentOrg.postureStatus} size="sm" />
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#0B2319] border border-[#164030] space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#E3CFAE]" />
              <span className="text-xs font-bold text-white">Personal Workspace</span>
            </div>
            <p className="text-[10px] text-[#A3B2AA]">Individual website checks & saved reports</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        {isOrgMode ? (
          <>
            <NavGroup label="OVERVIEW">
              <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
                Trust Center
              </NavItem>
            </NavGroup>

            <NavGroup label="ASSESS">
              <NavItem to="/assessment" icon={<ClipboardCheck className="w-4 h-4" />}>
                Assessment
              </NavItem>
              <NavItem to="/scan" icon={<Globe className="w-4 h-4" />}>
                Website Scan
              </NavItem>
            </NavGroup>

            <NavGroup label="UNDERSTAND">
              <NavItem to="/findings" icon={<AlertCircle className="w-4 h-4" />} badge={4}>
                Findings
              </NavItem>
              <NavItem to="/evidence" icon={<FileCheck className="w-4 h-4" />}>
                Evidence
              </NavItem>
              <NavItem to="/trust-score" icon={<ShieldCheck className="w-4 h-4" />}>
                Trust Score
              </NavItem>
            </NavGroup>

            <NavGroup label="IMPROVE">
              <NavItem to="/remediation" icon={<CheckSquare className="w-4 h-4" />} badge={3}>
                Remediation
              </NavItem>
            </NavGroup>

            <NavGroup label="REPORT">
              <NavItem to="/reports" icon={<FileText className="w-4 h-4" />}>
                Reports
              </NavItem>
            </NavGroup>
          </>
        ) : (
          <>
            <NavGroup label="PERSONAL WORKSPACE">
              <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
                My Dashboard
              </NavItem>
              <NavItem to="/scan" icon={<Globe className="w-4 h-4" />}>
                Run Website Check
              </NavItem>
            </NavGroup>

            <div className="p-4 rounded-xl bg-[#164030] border border-[#1C4D3A] space-y-3 mt-4">
              <h4 className="text-xs font-bold text-[#E3CFAE]">Need Enterprise Compliance?</h4>
              <p className="text-[11px] text-[#D5E0DA] leading-relaxed">
                Setup an organization profile to unlock statutory DPDP assessments, legal evidence verification, and executive PDF reports.
              </p>
              <button
                onClick={() => {
                  setAccountMode('ORGANIZATION');
                  navigate('/onboarding');
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-[#E3CFAE] text-[#0F2E22] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#D5BD97] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Organization Account</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sidebar Footer / Settings */}
      <div className="p-3 border-t border-[#164030]">
        <NavItem to="/settings" icon={<Settings className="w-4 h-4" />}>
          Settings
        </NavItem>
      </div>
    </aside>
  );
};
