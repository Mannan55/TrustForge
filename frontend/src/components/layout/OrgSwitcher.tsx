import React, { useState, useRef, useEffect } from 'react';
import { useOrg } from '../../context/OrgContext';
import { Building2, ChevronDown, Check } from 'lucide-react';

export const OrgSwitcher: React.FC = () => {
  const { currentOrg, organizations, switchOrg } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E3DDD0] bg-white text-[#0F2E22] hover:bg-[#FAF8F5] transition-colors cursor-pointer text-xs font-medium"
      >
        <Building2 className="w-3.5 h-3.5 text-[#0F2E22]" />
        <span className="font-semibold max-w-[140px] truncate">{currentOrg.name}</span>
        <ChevronDown className="w-3 h-3 text-[#7A8981]" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl border border-[#E3DDD0] shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[11px] font-semibold text-[#7A8981] uppercase tracking-wider">
            Switch Organization
          </div>
          {organizations.map((org) => {
            const isSelected = org.id === currentOrg.id;
            return (
              <button
                key={org.id}
                onClick={() => {
                  switchOrg(org.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#F2EDE1] text-[#0F2E22] font-semibold' : 'text-[#4A5750] hover:bg-[#FAF8F5] hover:text-[#0F2E22]'
                }`}
              >
                <div className="truncate">
                  <div className="truncate font-medium">{org.name}</div>
                  <div className="text-[10px] text-[#7A8981] truncate">{org.industry}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#0F2E22] shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
