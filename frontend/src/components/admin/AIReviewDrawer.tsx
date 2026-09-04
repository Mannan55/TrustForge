import React, { useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AIReviewItem } from '../../data/adminMockData';
import { useToast } from '../../context/ToastContext';
import { Sparkles, CheckCircle2, Flag, RefreshCw, ShieldAlert, BookOpen, FileText } from 'lucide-react';

interface AIReviewDrawerProps {
  item: AIReviewItem | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const AIReviewDrawer: React.FC<AIReviewDrawerProps> = ({ item, onClose, onActionComplete }) => {
  const { addToast } = useToast();
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      addToast('AI Finding Approved', `Assessment for ${item.orgName} marked verified by admin.`, 'success');
      if (onActionComplete) onActionComplete();
      onClose();
    }, 400);
  };

  const handleFlag = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      addToast('Finding Flagged', `Flagged ${item.title} for legal compliance team audit.`, 'warning');
      if (onActionComplete) onActionComplete();
      onClose();
    }, 400);
  };

  const handleRequestReanalysis = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      addToast('Re-analysis Queued', `Triggered AI scan re-evaluation for ${item.targetPolicy}.`, 'info');
      if (onActionComplete) onActionComplete();
      onClose();
    }, 400);
  };

  return (
    <Drawer
      isOpen={!!item}
      onClose={onClose}
      title={item.title}
      subtitle={`AI Assessment Review · ${item.orgName}`}
      width="lg"
    >
      <div className="space-y-6">
        {/* Confidence & Status Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E3DDD0]">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#7A8981] uppercase">AI Confidence Score</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${item.confidence < 60 ? 'text-[#991B1B]' : 'text-[#166534]'}`}>
                {item.confidence}% Confidence
              </span>
              {item.confidence < 60 && <Badge variant="danger">Low Confidence Flag</Badge>}
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[11px] font-bold text-[#7A8981] uppercase">Review Status</span>
            <div>
              <Badge variant={item.status === 'Reviewed' ? 'success' : item.status === 'Flagged' ? 'warning' : 'info'}>
                {item.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* 1. Target Entity & Document Policy */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">Target Resource</h4>
          <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs space-y-1">
            <div className="font-semibold text-[#0F2E22]">{item.orgName}</div>
            <div className="text-[#7A8981] font-mono text-[11px]">{item.targetPolicy}</div>
          </div>
        </div>

        {/* 2. Extracted Evidence Snippet */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#0F2E22]" />
            <span>Extracted Evidence Snippet</span>
          </h4>
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] text-xs font-mono text-[#0F2E22] leading-relaxed">
            {item.evidenceSnippet}
          </div>
        </div>

        {/* 3. AI Assessment Rationale Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0F2E22]" />
            <span>AI Assessment Rationale</span>
          </h4>
          <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs text-[#4A5750] leading-relaxed">
            {item.aiRationaleSummary}
          </div>
        </div>

        {/* 4. Legal Regulatory Reference */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#0F2E22]" />
            <span>Indian Legal Provision</span>
          </h4>
          <div className="p-4 rounded-xl bg-[#E3CFAE]/30 border border-[#D5BD97] text-xs text-[#0F2E22] font-semibold">
            {item.dpdpReference}
          </div>
        </div>

        {/* Admin Review Notes Input */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-[#0F2E22]">Admin Review Note (Optional)</label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add reviewer notes for audit trail entry..."
            className="w-full p-3 rounded-lg border border-[#CFC7B7] bg-white text-xs text-[#0F2E22] focus:outline-none focus:ring-2 focus:ring-[#0F2E22] min-h-[80px]"
          />
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#E3DDD0] flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestReanalysis}
            isLoading={isSubmitting}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-analyze
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleFlag}
            isLoading={isSubmitting}
            leftIcon={<Flag className="w-3.5 h-3.5" />}
          >
            Flag for Manual Audit
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApprove}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Approve Finding
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
