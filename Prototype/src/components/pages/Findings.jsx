import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  UserCheck,
  Building2
} from 'lucide-react';
import { FINDINGS_LIST } from '../../data/mockData';

export default function Findings({ onShowToast }) {
  const [findings, setFindings] = useState(FINDINGS_LIST);
  const [selectedSeverity, setSelectedSeverity] = useState('all'); // 'all' | 'critical' | 'high' | 'medium' | 'low'
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState('TF-DPDP-041');

  const handleResolve = (id) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: 'resolved' } : f));
    onShowToast(`Finding ${id} marked as resolved. Overall score re-indexing in background.`, 'success');
  };

  const filteredFindings = findings.filter(f => {
    const matchesSev = selectedSeverity === 'all' || f.severity === selectedSeverity;
    const matchesSearch = 
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.pillar.toLowerCase().includes(search.toLowerCase()) ||
      f.dpdpReference.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const countSev = (sev) => findings.filter(f => f.severity === sev && f.status !== 'resolved').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Audit Findings & Remediation Queue</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Findings & Fix Recommendations
          </h1>
          <p className="text-xs text-slate-500">
            Identified non-compliance risks, legal statutory references, and code/policy remediation steps.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 text-xs font-mono font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {countSev('high')} High
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            {countSev('medium')} Medium
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            {countSev('low')} Low
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold overflow-x-auto w-full sm:w-auto">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => {
            const count = sev === 'all' ? findings.length : countSev(sev);
            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap ${
                  selectedSeverity === sev ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {sev} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by ID, Title, DPDP Sec..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Findings Cards List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No findings matching the selected severity filter or search query.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id;
            const isResolved = finding.status === 'resolved';
            const isHigh = finding.severity === 'high';
            const isMedium = finding.severity === 'medium';

            return (
              <div
                key={finding.id}
                className={`rounded-2xl bg-white border transition-all duration-200 overflow-hidden ${
                  isResolved 
                    ? 'border-slate-200 opacity-70 bg-slate-50/50' 
                    : isHigh 
                      ? 'border-red-200 shadow-xs' 
                      : 'border-slate-200 shadow-xs'
                }`}
              >
                {/* Header Strip */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase ${
                      isHigh 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : isMedium 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {finding.severity}
                    </span>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-400">{finding.id}</span>
                        <h3 className="text-sm font-bold text-slate-900">{finding.title}</h3>
                        {isResolved && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Resolved ✓
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Pillar: <strong className="text-slate-700">{finding.pillar}</strong> • Found: {finding.dateFound}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {finding.dpdpReference}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4 text-xs">
                    {/* Why This Matters */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900">
                      <div className="font-bold text-amber-950 mb-0.5">Why This Matters (Legal & Business Risk)</div>
                      <div className="leading-relaxed">{finding.whyItMatters}</div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900">
                      <div className="font-bold text-blue-950 mb-0.5">Recommended Action</div>
                      <div className="leading-relaxed">{finding.recommendation}</div>
                    </div>

                    {/* Evidence & Reference */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px]">
                        <div className="text-slate-400 mb-1 font-bold">Audit Evidence Snippet:</div>
                        <code>{finding.evidence}</code>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800">Statutory & Governance Link</div>
                        <div className="text-slate-600 font-mono font-semibold">{finding.dpdpReference}</div>
                        <div className="text-slate-500 text-[11px] pt-1">Assigned to: <strong className="text-slate-800">{finding.assignedTo}</strong></div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onShowToast(`Code patch instructions copied for ${finding.id}`, 'info')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center space-x-1"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Generate Code Patch</span>
                        </button>
                      </div>

                      {!isResolved && (
                        <button
                          onClick={() => handleResolve(finding.id)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark as Resolved</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
