import React from 'react';
import { CheckCircle2, Shield, FileCheck, Lock, Activity, Server, Cpu } from 'lucide-react';

interface AnalysisEngineProps {
  currentStage: number;
  onComplete?: () => void;
}

export const TrustForgeAnalysisEngine: React.FC<AnalysisEngineProps> = ({ currentStage }) => {
  const STAGES = [
    { title: 'Preparing assessment framework', icon: Activity, desc: 'Initializing TEF vector matrix & ruleset' },
    { title: 'Scanning website signals', icon: Server, desc: 'Auditing SSL/TLS headers & cookies' },
    { title: 'Validating security configuration', icon: Lock, desc: 'Verifying AES-256 encryption at rest' },
    { title: 'Reviewing submitted evidence', icon: FileCheck, desc: 'Parsing uploaded policy PDFs & certificates' },
    { title: 'Evaluating compliance controls', icon: Shield, desc: 'Mapping DPDP Act 2023 statutory clauses' },
    { title: 'Applying TrustForge assessment framework', icon: Cpu, desc: 'Computing multi-pillar risk weightings' },
    { title: 'Preparing assessment results', icon: CheckCircle2, desc: 'Generating posture report & gap roadmap' }
  ];

  const totalStages = STAGES.length;
  const progressPercent = Math.min(Math.round((currentStage / totalStages) * 100), 100);

  return (
    <div className="w-full max-w-xl mx-auto p-8 rounded-3xl bg-[#0F2E22] text-[#F2EDE1] border border-[#184736] shadow-2xl space-y-8 animate-pulse-subtle">
      {/* Central Geometric Radar & Circular Progress Indicator */}
      <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
        {/* Outer Circular Progress Ring */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="5"
            className="text-[#184736]"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="5"
            className="text-[#E3CFAE] transition-all duration-500 ease-out"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * progressPercent) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Technical Radar & Scanning Line */}
        <div className="absolute inset-4 rounded-full border border-[#22634B]/60 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#22634B_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[#E3CFAE] to-transparent animate-scan-line" />
          
          <div className="text-center z-10">
            <span className="text-2xl font-black font-mono text-[#E3CFAE]">
              {progressPercent}%
            </span>
            <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mt-0.5">
              TEF ENGINE
            </div>
          </div>
        </div>
      </div>

      {/* Header Description */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-[#F2EDE1] tracking-tight">
          TrustForge Analysis Engine
        </h3>
        <p className="text-xs text-[#E3CFAE]/80">
          Executing automated DPDP Act 2023 baseline verification
        </p>
      </div>

      {/* Sequential Processing Stages Checklist */}
      <div className="space-y-2.5 bg-[#0B1E16] p-4 rounded-2xl border border-[#184736]">
        {STAGES.map((stage, idx) => {
          const stepNumber = idx + 1;
          const isDone = currentStage > stepNumber;
          const isActive = currentStage === stepNumber;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between text-xs ${
                isActive
                  ? 'bg-[#184736] border-[#E3CFAE] text-[#F2EDE1] shadow-xs'
                  : isDone
                  ? 'bg-[#0F2E22]/60 border-emerald-800/40 text-emerald-300'
                  : 'bg-transparent border-transparent text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-mono text-[11px] font-bold ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isActive
                      ? 'bg-[#E3CFAE] text-[#0F2E22]'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
                </div>

                <div className="min-w-0">
                  <div className={`font-semibold truncate ${isActive ? 'text-[#F2EDE1]' : ''}`}>
                    {stage.title}
                  </div>
                  {isActive && (
                    <div className="text-[10px] text-[#E3CFAE]/90 truncate">
                      {stage.desc}
                    </div>
                  )}
                </div>
              </div>

              {isActive && (
                <span className="w-2 h-2 rounded-full bg-[#E3CFAE] animate-ping" />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-[11px] font-mono text-slate-400">
        Engine Status: Auditing compliance controls & evidence signatures
      </div>
    </div>
  );
};
