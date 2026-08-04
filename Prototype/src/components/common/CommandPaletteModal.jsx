import React, { useState, useEffect } from 'react';
import { Search, Shield, FileText, Globe, BarChart2, AlertTriangle, Settings, CheckCircle2, ArrowRight, X } from 'lucide-react';

export default function CommandPaletteModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'dashboard', name: 'Go to Trust Center Dashboard', category: 'Navigation', icon: Shield, shortcut: 'G D' },
    { id: 'assessment', name: 'Start DPDP Assessment Wizard', category: 'Actions', icon: FileText, shortcut: 'G A' },
    { id: 'scan', name: 'View Website Security & Privacy Scan', category: 'Audit', icon: Globe, shortcut: 'G W' },
    { id: 'score', name: 'Analyze Trust Score & 6 Pillars', category: 'Analytics', icon: BarChart2, shortcut: 'G S' },
    { id: 'findings', name: 'Review Open Remediation Findings', category: 'Audit', icon: AlertTriangle, shortcut: 'G F' },
    { id: 'reports', name: 'Export DPDP Executive Compliance Report', category: 'Reports', icon: CheckCircle2, shortcut: 'G R' },
    { id: 'settings', name: 'Manage Organization & DPO Settings', category: 'Settings', icon: Settings, shortcut: 'G T' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id) => {
    onNavigate(id);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search TrustForge... (e.g. Scan, Report, DPDP)"
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching commands or actions found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50/70 text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
                        {cmd.name}
                      </div>
                      <div className="text-xs text-slate-400 font-normal">
                        {cmd.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                      {cmd.shortcut}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">ESC</kbd> Close</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Trust Intelligence Core v2.4</span>
        </div>
      </div>
    </div>
  );
}
