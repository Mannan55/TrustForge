import React, { useState } from 'react';
import { 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight,
  Filter,
  X,
  Info
} from 'lucide-react';
import { WEBSITE_SCAN_CARDS, MOCK_COMPANY } from '../../data/mockData';

export default function WebsiteScanResults({ onTriggerScan, onShowToast }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'pass' | 'warning'
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleReScan = () => {
    setIsScanning(true);
    onTriggerScan();
    setTimeout(() => {
      setIsScanning(false);
      onShowToast('Domain re-scan complete for technova.in. 16 audit items updated.', 'success');
    }, 1000);
  };

  const filteredCards = WEBSITE_SCAN_CARDS.filter((card) => {
    const matchesFilter = filter === 'all' || card.status === filter;
    const matchesSearch = 
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      card.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const passCount = WEBSITE_SCAN_CARDS.filter(c => c.status === 'pass').length;
  const warningCount = WEBSITE_SCAN_CARDS.filter(c => c.status === 'warning').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <Globe className="w-4 h-4" />
            <span>Target Domain: {MOCK_COMPANY.website}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Website Security & Privacy Scan
          </h1>
          <p className="text-xs text-slate-500">
            Automated technical audit of public web assets against DPDP Act 2023 requirements.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleReScan}
            disabled={isScanning}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Target...' : 'Re-Scan Domain'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Audits (16)
          </button>
          <button
            onClick={() => setFilter('pass')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              filter === 'pass' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Pass ({passCount})</span>
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              filter === 'warning' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Warnings ({warningCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scan items..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* 16 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCards.map((card) => {
          const isPass = card.status === 'pass';
          return (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                isPass 
                  ? 'border-slate-200/80 hover:border-emerald-300' 
                  : 'border-amber-200/80 bg-amber-50/10 hover:border-amber-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                    isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span className="capitalize">{card.status}</span>
                  </span>

                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                    {card.severity} severity
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1">{card.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal for Selected Scan Item */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  selectedCard.status === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {selectedCard.status === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                  {selectedCard.status}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedCard.title}</h2>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-700 mb-0.5">Description</div>
                <div className="text-slate-600 leading-relaxed">{selectedCard.description}</div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="font-semibold text-blue-900 mb-0.5">TEF Recommendation</div>
                <div className="text-blue-800 leading-relaxed">{selectedCard.recommendation}</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px]">
                <div className="text-slate-400 mb-1">Audit Evidence Output:</div>
                <code>{selectedCard.evidence}</code>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
