import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { OrgSwitcher } from './OrgSwitcher';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, LogOut, Settings, HelpCircle, Shield, Menu } from 'lucide-react';

export const Topbar: React.FC<{ onMobileMenuToggle?: () => void }> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard':
        return 'Trust Center';
      case '/assessment':
        return 'DPDP Compliance Assessment';
      case '/scan':
        return 'Website Scanner';
      case '/findings':
        return 'Compliance Findings';
      case '/evidence':
        return 'Evidence Verification Vault';
      case '/trust-score':
        return 'Trust Score & Pillar Analysis';
      case '/remediation':
        return 'Remediation Roadmap';
      case '/reports':
        return 'Compliance Reports';
      case '/settings':
        return 'Settings';
      default:
        return 'Trust Center';
    }
  };

  return (
    <header className="h-16 border-b border-[#E3DDD0] bg-white px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-4">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-[#0F2E22] hover:bg-[#FAF8F5]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <OrgSwitcher />
          <span className="text-[#CFC7B7] hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-[#0F2E22] truncate hidden sm:block">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/scan"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E3DDD0] text-xs font-medium text-[#0F2E22] hover:bg-[#F2EDE1] transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-[#0F2E22]" />
          <span>New Scan</span>
        </Link>

        {/* User Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#FAF8F5] border border-transparent hover:border-[#E3DDD0] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#0F2E22] text-[#F2EDE1] flex items-center justify-center text-xs font-bold shadow-xs">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'TF'}
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E3DDD0] shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-[#E3DDD0]">
                <p className="text-xs font-bold text-[#0F2E22] truncate">{user?.name || 'Compliance Lead'}</p>
                <p className="text-[11px] text-[#7A8981] truncate">{user?.email || 'user@technova.in'}</p>
              </div>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#4A5750] hover:bg-[#FAF8F5] hover:text-[#0F2E22] text-left"
              >
                <User className="w-4 h-4 text-[#7A8981]" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#4A5750] hover:bg-[#FAF8F5] hover:text-[#0F2E22] text-left"
              >
                <Settings className="w-4 h-4 text-[#7A8981]" />
                <span>Settings</span>
              </button>
              <a
                href="https://meity.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#4A5750] hover:bg-[#FAF8F5] hover:text-[#0F2E22]"
              >
                <HelpCircle className="w-4 h-4 text-[#7A8981]" />
                <span>DPDP Guidance</span>
              </a>
              <div className="border-t border-[#E3DDD0] my-1" />
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
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
