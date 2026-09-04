import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  Wrench, 
  TrendingUp, 
  Filter,
  X
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAssessment } from '../context/AssessmentContext';
import { Finding } from '../types';

export const FindingsPage: React.FC = () => {
  const { findings, updateFindingStatus } = useAssessment();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalFinding, setActiveModalFinding] = useState<Finding | null>(null);

  const filteredFindings = findings.filter(f => {
    if (selectedCategory === 'all') return true;
    return f.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <AppLayout
      title="Compliance Findings & Remediation"
      subtitle="Prioritized gap resolution roadmap under DPDP Act 2023"
    >
      <div className="space-y-6">
        {/* Header & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#0F2E22]/15">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F2E22] tracking-tight">
              Identified Compliance Gaps ({findings.length})
            </h2>
            <p className="text-xs text-slate-600">
              Clear actionable advice on what is wrong, why it matters, and how to improve.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'Consent', 'Retention', 'Processors'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F2E22] text-[#F2EDE1]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-4">
          {filteredFindings.map((item) => (
            <Card
              key={item.id}
              className={`p-6 bg-white border-2 transition-all space-y-4 ${
                item.severity === 'high' || item.severity === 'critical'
                  ? 'border-amber-200 hover:border-amber-400'
                  : 'border-[#0F2E22]/15 hover:border-[#0F2E22]/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0F2E22]/10 pb-3">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={item.severity === 'high' ? 'amber' : 'emerald'}
                    className="uppercase font-mono text-[10px]"
                  >
                    {item.severity} severity
                  </Badge>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {item.dpdpSection}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-700">{item.category}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-rose-600">
                    {item.scoreImpact} pts impact
                  </span>
                  <Badge variant={item.status === 'resolved' ? 'emerald' : 'amber'}>
                    {item.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0F2E22] leading-snug">
                  {item.title}
                </h3>
              </div>

              {/* 4 Structured Remediation Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0F2E22] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>What is wrong?</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{item.whatIsWrong}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0F2E22] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Why does it matter?</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{item.whyItMatters}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F2EDE1] border border-[#E3CFAE] space-y-1">
                  <div className="font-bold text-[#0F2E22] flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#0F2E22]" />
                    <span>What should we do?</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{item.whatShouldWeDo}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>How can we improve?</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed">{item.howToImprove}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModalFinding(item)}
                >
                  View Details & Guide
                </Button>

                {item.status !== 'resolved' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateFindingStatus(item.id, 'resolved')}
                  >
                    Mark as Resolved
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Resolved
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Action Modal for Finding Details */}
        {activeModalFinding && (
          <div className="fixed inset-0 z-50 bg-[#0F2E22]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border-2 border-[#0F2E22] shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#0F2E22]/10 pb-3">
                <Badge variant="amber" className="uppercase font-mono">
                  {activeModalFinding.dpdpSection}
                </Badge>
                <button
                  onClick={() => setActiveModalFinding(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-[#0F2E22]">
                {activeModalFinding.title}
              </h3>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-[#0F2E22] mb-1">Step-by-Step Remediation Action</div>
                  <p className="leading-relaxed">{activeModalFinding.howToImprove}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="font-bold mb-1">Trust Score Impact</div>
                  <p>Resolving this gap will restore <span className="font-bold font-mono">+{Math.abs(activeModalFinding.scoreImpact)} points</span> to your overall TEF baseline score.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModalFinding(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    updateFindingStatus(activeModalFinding.id, 'resolved');
                    setActiveModalFinding(null);
                  }}
                >
                  Resolve Finding Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
