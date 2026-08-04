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
  Building2, 
  Sparkles,
  ExternalLink,
  Award
} from 'lucide-react';
import { MOCK_COMPANY } from '../../data/mockData';

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  isCollapsed, 
  onToggleCollapse 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Trust Center', icon: Shield, badge: null },
    { id: 'assessment', label: 'Assessment Wizard', icon: FileText, badge: 'TEF v2.4' },
    { id: 'scan', label: 'Website Scan', icon: Globe, badge: '16 Audits' },
    { id: 'score', label: 'Trust Score', icon: BarChart2, badge: '89/100' },
    { id: 'findings', label: 'Findings', icon: AlertTriangle, badge: '7 Items' },
    { id: 'reports', label: 'Reports', icon: CheckCircle2, badge: 'PDF' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside 
      className={`relative z-40 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
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
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Organization Selector Header */}
      {!isCollapsed && (
        <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                TN
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  TechNova Solutions
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
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
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
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Trust Engine Active"></div>
          </div>
        )}
      </div>
    </aside>
  );
}
