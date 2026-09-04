import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-[#0F2E22]" />;
        let borderClass = 'border-[#CFC7B7]';
        let bgClass = 'bg-white';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-[#166534]" />;
          borderClass = 'border-[#BBF7D0]';
          bgClass = 'bg-[#DCFCE7]';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-[#9A3412]" />;
          borderClass = 'border-[#FED7AA]';
          bgClass = 'bg-[#FFEDD5]';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-5 h-5 text-[#991B1B]" />;
          borderClass = 'border-[#FCA5A5]';
          bgClass = 'bg-[#FEE2E2]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgClass} ${borderClass} transition-all duration-200 animate-in slide-in-from-bottom-5`}
          >
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1">
              <h5 className="text-xs font-semibold text-[#0F2E22]">{toast.title}</h5>
              {toast.message && <p className="text-xs text-[#4A5750] mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-[#7A8981] hover:text-[#0F2E22] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
