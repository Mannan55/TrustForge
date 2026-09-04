import React, { useState } from 'react';
import { MOCK_AI_REVIEWS, AIReviewItem } from '../../data/adminMockData';
import { AIReviewDrawer } from '../../components/admin/AIReviewDrawer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Sparkles, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const AIReviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Pending Review');
  const [selectedReview, setSelectedReview] = useState<AIReviewItem | null>(null);

  const filteredReviews = MOCK_AI_REVIEWS.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.status === activeTab;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            HUMAN-IN-THE-LOOP CONSOLE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">AI Review Workbench</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Audit low-confidence automated compliance assessments before publishing findings.
          </p>
        </div>

        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'Pending Review', label: 'Pending Review', count: MOCK_AI_REVIEWS.filter((r) => r.status === 'Pending Review').length },
            { id: 'Flagged', label: 'Flagged', count: MOCK_AI_REVIEWS.filter((r) => r.status === 'Flagged').length },
            { id: 'Reviewed', label: 'Reviewed', count: MOCK_AI_REVIEWS.filter((r) => r.status === 'Reviewed').length }
          ]}
        />
      </div>

      {/* AI Rationale Guidelines Banner */}
      <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] flex items-center justify-between gap-4 text-xs text-[#4A5750]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0F2E22]" />
          <span>
            <strong className="text-[#0F2E22]">Human Validation Principle:</strong> AI confidence scores below 60% are automatically held for platform admin validation. Review rationale summaries and approve or flag.
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredReviews.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedReview(item)}
            className="p-6 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-xs transition-all cursor-pointer space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={item.confidence < 60 ? 'danger' : 'success'}>
                  AI Confidence: {item.confidence}%
                </Badge>
                <span className="text-xs font-semibold text-[#0F2E22]">{item.orgName}</span>
              </div>
              <Badge variant={item.status === 'Reviewed' ? 'success' : item.status === 'Flagged' ? 'warning' : 'info'}>
                {item.status}
              </Badge>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0F2E22]">{item.title}</h3>
              <p className="text-xs text-[#4A5750] mt-1 leading-relaxed">{item.aiRationaleSummary}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E3DDD0] text-xs font-mono text-[#0F2E22]">
              "{item.evidenceSnippet}"
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#FAF8F5] text-xs text-[#7A8981]">
              <span>Legal Provision: <strong className="text-[#0F2E22]">{item.dpdpReference}</strong></span>
              <span className="font-semibold text-[#0F2E22] flex items-center gap-1">
                Open AI Review Workbench →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Review Drawer */}
      <AIReviewDrawer
        item={selectedReview}
        onClose={() => setSelectedReview(null)}
      />
    </div>
  );
};
