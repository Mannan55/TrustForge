import React from 'react';
import { 
  Shield, 
  FileText, 
  Globe, 
  BarChart2, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Award
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

export default function Sidebar({ isCollapsed, onToggleCollapse, company }) {
  const { currentPath, navigate } = useRouter();

  const navItems = [
    { path: '/dashboard', label: 'Trust Center', icon: Shield, badge: null },
    { path: '/assessment', label: 'Assessment Wizard', icon: FileText, badge: 'TEF v2.4' },
    { path: '/scan', label: 'Website Scan', icon: Globe, badge: '16 Audits' },
    { path: '/trust-score', label: 'Trust Score', icon: BarChart2, badge: '89/100' },
    { path: '/findings', label: 'Findings', icon: AlertTriangle, badge: '7 Items' },
    { path: '/reports', label: 'Reports', icon: CheckCircle2, badge: 'PDF' },
    { path: '/settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside 
      className={`relative z-40 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed ? (
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                TrustForge
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                DIGITAL TRUST PLATFORM
              </div>
            </div>
          </button>
        ) : (
          <button 
            onClick={() => navigate('/')}
            className="w-9 h-9 mx-auto rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md cursor-pointer"
          >
            <Shield className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Organization Badge */}
      {!isCollapsed && (
        <div className="p-3 mx-3 mt-3 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {company?.name ? company.name.substring(0, 2).toUpperCase() : 'TN'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {company?.name || 'TechNova Solutions'}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center">
                  <Award className="w-3 h-3 text-blue-600 mr-1 inline" />
                  Score: 89/100
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span 
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/20 text-white font-semibold' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Panel */}
      <div className="p-3 border-t border-slate-100">
        {!isCollapsed ? (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-900">Trust Engine v2.4</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              TEF & TIC framework synchronized with DPDP Act 2023 Rules.
            </p>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Trust Engine Active" />
          </div>
        )}
      </div>
    </aside>
  );
}
