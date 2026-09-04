import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface ScannerAnimationProps {
  progress: number;
  stageMessage: string;
  isComplete?: boolean;
}

export const ScannerAnimation: React.FC<ScannerAnimationProps> = ({
  progress,
  stageMessage,
  isComplete = false
}) => {
  return (
    <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
      {/* Brand Native Pulsing Ring */}
      <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
        {/* Outer Pulsing Ring */}
        <div
          className={`absolute inset-0 rounded-full border-4 border-[#E3CFAE]/40 ${
            !isComplete ? 'animate-ping opacity-40' : ''
          }`}
        />

        {/* Rotating Progress Arc */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#E3DDD0"
            strokeWidth="3.5"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#0F2E22"
            strokeWidth="3.5"
            strokeDasharray={`${progress}, 100`}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Inner Shield Badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <div className="p-3 bg-[#DCFCE7] text-[#166534] rounded-full shadow-sm animate-in zoom-in-50 duration-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
          ) : (
            <div className="p-3 bg-[#0F2E22] text-[#E3CFAE] rounded-full shadow-sm">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Message & Progress Indicator */}
      <div className="space-y-2">
        <h4 className="text-lg font-bold text-[#0F2E22]">
          {isComplete ? 'Trust Evaluation Complete!' : 'Trust Intelligence Core Processing...'}
        </h4>
        <p className="text-xs text-[#4A5750] leading-relaxed">{stageMessage}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono font-semibold text-[#0F2E22]">
          <span>Analysis Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-[#E3DDD0] h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F2E22] rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
