import React, { useState } from 'react';
import { useOrg } from '../context/OrgContext';
import { MOCK_PILLAR_SCORES, MOCK_FINDINGS } from '../data/mockData';
import { PillarScore } from '../types';
import { ScorePill } from '../components/ui/ScorePill';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Tabs';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { ShieldCheck, ArrowRight, BookOpen, AlertCircle, FileCheck } from 'lucide-react';

export const TrustScorePage: React.FC = () => {
  const { currentOrg } = useOrg();
  const [selectedPillar, setSelectedPillar] = useState<PillarScore | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 pb-12">
      {/* Header */}
      <div className="border-b border-[#E3DDD0] pb-6 space-y-1">
        <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
          TRUST POSTURE EVALUATION
        </span>
        <h2 className="text-2xl font-bold text-[#0F2E22]">Trust Score & 6-Pillar Analysis</h2>
        <p className="text-xs text-[#4A5750]">
          Comprehensive breakdown of your organization's digital trust score under the Indian DPDP framework.
        </p>
      </div>

      {/* Main Posture Score Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3DDD0] shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <ScorePill score={currentOrg.trustScore} statusLabel={currentOrg.postureStatus} size="lg" />

          <div className="flex-1 max-w-xl space-y-2">
            <h3 className="text-base font-bold text-[#0F2E22]">Score Explanation</h3>
            <p className="text-xs text-[#4A5750] leading-relaxed">
              Your overall score of <strong className="text-[#0F2E22]">89/100</strong> reflects strong DPDP compliance governance. Privacy notice structures, encryption protocols, and user rights mechanisms are verified. Minor improvements in data retention schedules are required under Section 8(7).
            </p>
          </div>
        </div>
      </div>

      {/* 6 DPDP Compliance Pillars Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#7A8981] uppercase tracking-wider">
            6 DPDP COMPLIANCE PILLARS
          </h3>
          <span className="text-xs text-[#7A8981]">Click any pillar for deep-dive breakdown</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_PILLAR_SCORES.map((pillar) => (
            <div
              key={pillar.name}
              onClick={() => setSelectedPillar(pillar)}
              className="p-6 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-sm transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-[#0F2E22]">{pillar.name}</h4>
                <Badge variant={pillar.status === 'Strong' ? 'success' : 'warning'}>
                  {pillar.score} / 100
                </Badge>
              </div>

              <ProgressBar progress={pillar.score} />

              <p className="text-xs text-[#4A5750] line-clamp-2">{pillar.explanation}</p>

              <div className="flex items-center justify-between pt-2 border-t border-[#FAF8F5] text-xs">
                <span className="text-[#7A8981]">{pillar.evidenceCoverage}% Evidence Coverage</span>
                <span className="font-semibold text-[#0F2E22] flex items-center gap-1">
                  View Breakdown →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PILLAR BREAKDOWN DRAWER */}
      <Drawer
        isOpen={!!selectedPillar}
        onClose={() => setSelectedPillar(null)}
        title={`${selectedPillar?.name} Pillar Breakdown`}
        subtitle="Detailed evidence & contributing compliance findings"
      >
        {selectedPillar && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#7A8981] uppercase">Pillar Score</span>
                <span className="text-xl font-bold text-[#0F2E22]">{selectedPillar.score} / 100</span>
              </div>
              <ProgressBar progress={selectedPillar.score} />
              <p className="text-xs text-[#4A5750]">{selectedPillar.explanation}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">Evidence Coverage</h4>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs space-y-1">
                <div className="flex justify-between font-semibold text-[#0F2E22]">
                  <span>Verified Signals Ratio</span>
                  <span>{selectedPillar.evidenceCoverage}%</span>
                </div>
                <p className="text-[#4A5750]">
                  High proportion of digital evidence items verified via website scanner & documentation logs.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">
                Outstanding Pillar Actions ({selectedPillar.findingCount})
              </h4>
              {selectedPillar.findingCount === 0 ? (
                <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-xs text-[#166534] font-medium">
                  ✓ No outstanding compliance gaps in this pillar.
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FFEDD5] border border-[#FED7AA] text-xs text-[#9A3412] space-y-2">
                  <div className="font-semibold">Attention Required</div>
                  <p>Review retention policy schedules under Section 8(7) to elevate score to 100.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
