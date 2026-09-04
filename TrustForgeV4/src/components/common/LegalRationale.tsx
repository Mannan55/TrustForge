import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Scale } from 'lucide-react';

interface LegalRationaleProps {
  whyWeAsk: string;
  dpdpContext: string;
  dpdpSectionRef?: string;
  defaultOpen?: boolean;
  className?: string;
}

export const LegalRationale: React.FC<LegalRationaleProps> = ({
  whyWeAsk,
  dpdpContext,
  dpdpSectionRef,
  defaultOpen = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border border-[#0F2E22]/15 bg-[#F2EDE1]/60 overflow-hidden transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#F2EDE1] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F2E22]">
          <Scale className="w-4 h-4 text-[#0F2E22]" />
          <span>Why We Ask & DPDP Legal Rationale</span>
          {dpdpSectionRef && (
            <span className="ml-2 px-2 py-0.5 rounded bg-[#0F2E22]/10 text-[10px] font-mono text-[#0F2E22]">
              {dpdpSectionRef}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-3 text-xs border-t border-[#0F2E22]/10">
          <div>
            <div className="font-semibold text-[#0F2E22] flex items-center gap-1.5 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Why We Ask:</span>
            </div>
            <p className="text-slate-700 leading-relaxed pl-5">
              {whyWeAsk}
            </p>
          </div>

          <div>
            <div className="font-semibold text-[#0F2E22] flex items-center gap-1.5 mb-1">
              <Scale className="w-3.5 h-3.5 text-emerald-800" />
              <span>DPDP Legal Context:</span>
            </div>
            <p className="text-slate-700 leading-relaxed pl-5">
              {dpdpContext}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
