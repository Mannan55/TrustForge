import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  className = ''
}) => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold text-[#0F2E22] mb-1.5">
        <span className="bg-[#0F2E22]/10 text-[#0F2E22] px-2.5 py-0.5 rounded-full font-mono text-[11px]">
          Step {currentStep} of {totalSteps}
        </span>
        {stepTitle && (
          <span className="text-[#0F2E22]/70 font-medium truncate max-w-[240px]">
            {stepTitle}
          </span>
        )}
      </div>

      <div className="w-full bg-[#E4ECE8] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#0F2E22] h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
