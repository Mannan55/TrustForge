import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Search, ShieldAlert, User, LogOut, Menu, Activity } from 'lucide-react';

export const AdminTopbar: React.FC<{ onMobileMenuToggle?: () => void }> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getAdminPageTitle = (path: string) => {
    if (path === '/admin') return 'Command Center';
    if (path.startsWith('/admin/analytics')) return 'Platform Analytics';
    if (path.startsWith('/admin/organizations')) return 'Organization Management';
    if (path.startsWith('/admin/users')) return 'User Access Management';
    if (path.startsWith('/admin/assessments')) return 'Assessment Operations';
    if (path.startsWith('/admin/scans')) return 'Website Scanner Monitor';
    if (path.startsWith('/admin/findings')) return 'Platform Compliance Findings';
    if (path.startsWith('/admin/evidence')) return 'Evidence Review Vault';
    if (path.startsWith('/admin/ai-review')) return 'Human-in-the-Loop AI Review';
    if (path.startsWith('/admin/rules')) return 'Compliance Rules Engine';
    if (path.startsWith('/admin/reports')) return 'Reports Engine Monitor';
    if (path.startsWith('/admin/system-health')) return 'System Health & Metrics';
    if (path.startsWith('/admin/audit-logs')) return 'Security Audit Trail';
    if (path.startsWith('/admin/settings')) return 'Admin Settings';
    return 'Command Center';
  };

  return (
    <header className="h-16 border-b border-[#E3DDD0] bg-white px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-4">
        {onMobileMenuToggle && (
          <button onClick={onMobileMenuToggle} className="md:hidden p-2 rounded-lg text-[#0F2E22] hover:bg-[#FAF8F5]">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-[#0F2E22] text-[#F2EDE1] text-[10px] font-bold tracking-wider uppercase">
            Platform Admin
          </span>
          <span className="text-[#CFC7B7] hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-[#0F2E22] truncate hidden sm:block">
            {getAdminPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Global Admin Search Bar */}
      <div className="hidden md:flex items-center max-w-xs w-full relative">
        <Search className="w-3.5 h-3.5 absolute left-3 text-[#7A8981]" />
        <input
          type="text"
          placeholder="Search orgs, users, scan URLs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#CFC7B7] bg-[#FAF8F5] text-xs text-[#0F2E22] placeholder:text-[#7A8981] focus:outline-none focus:ring-2 focus:ring-[#0F2E22]"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-semibold text-[#166534]">
          <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" />
          <span>Production Operational</span>
        </div>

        {/* Admin User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#FAF8F5] border border-transparent hover:border-[#E3DDD0] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#0B2319] text-[#E3CFAE] flex items-center justify-center text-xs font-bold border border-[#164030]">
              AD
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E3DDD0] shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-[#E3DDD0]">
                <p className="text-xs font-bold text-[#0F2E22]">Super Admin</p>
                <p className="text-[11px] text-[#7A8981]">admin@trustforge.in</p>
              </div>
              <Link
                to="/admin/settings"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#4A5750] hover:bg-[#FAF8F5] hover:text-[#0F2E22]"
              >
                <User className="w-4 h-4 text-[#7A8981]" />
                <span>Admin Settings</span>
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#4A5750] hover:bg-[#FAF8F5] hover:text-[#0F2E22]"
              >
                <Activity className="w-4 h-4 text-[#7A8981]" />
                <span>User Console View</span>
              </Link>
              <div className="border-t border-[#E3DDD0] my-1" />
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#991B1B] hover:bg-[#FEE2E2] text-left font-medium"
              >
                <LogOut className="w-4 h-4 text-[#991B1B]" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
