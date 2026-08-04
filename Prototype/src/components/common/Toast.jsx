import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-medium backdrop-blur-md ${
        isSuccess 
          ? 'bg-slate-900 text-white border-slate-800' 
          : isWarning 
            ? 'bg-amber-950 text-amber-100 border-amber-800' 
            : 'bg-white text-slate-900 border-slate-200'
      }`}>
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
        {!isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
        
        <span>{toast.message}</span>

        <button 
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
