import React from 'react';

export default function LoadingSkeleton({ count = 3, height = 'h-12', className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`w-full bg-slate-100 rounded-xl animate-pulse ${height}`}
        />
      ))}
    </div>
  );
}
