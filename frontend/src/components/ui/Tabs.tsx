import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 border-b border-[#E3DDD0] overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'border-[#0F2E22] text-[#0F2E22] bg-white/50 font-semibold'
                : 'border-transparent text-[#7A8981] hover:text-[#0F2E22] hover:border-[#CFC7B7]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isActive ? 'bg-[#0F2E22] text-[#F2EDE1]' : 'bg-[#E3DDD0] text-[#0F2E22]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const ProgressBar: React.FC<{ progress: number; className?: string; label?: string }> = ({
  progress,
  className = '',
  label
}) => {
  const percentage = Math.min(100, Math.max(0, progress));
  return (
    <div className={`w-full space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between text-xs font-medium text-[#4A5750]">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-[#E3DDD0] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0F2E22] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-[#E3DDD0]/70 rounded-md ${className}`} />;
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-dashed border-[#CFC7B7] bg-white/60">
      {icon && <div className="p-3 bg-[#F2EDE1] text-[#0F2E22] rounded-xl mb-3">{icon}</div>}
      <h4 className="text-base font-semibold text-[#0F2E22]">{title}</h4>
      <p className="text-xs text-[#4A5750] max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
};
