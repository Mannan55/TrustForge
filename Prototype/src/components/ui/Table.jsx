import React from 'react';

export default function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
            {headers.map((h, idx) => (
              <th key={idx} className={`py-2.5 px-3 ${h.align === 'right' ? 'text-right' : ''}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
