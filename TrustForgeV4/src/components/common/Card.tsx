import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'emerald' | 'beige';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick
}) => {
  const variantStyles = {
    default: 'bg-white border border-[#0F2E22]/10 shadow-xs',
    bordered: 'bg-white border-2 border-[#0F2E22]/15',
    emerald: 'bg-[#0F2E22] text-[#F2EDE1] border border-[#184736]',
    beige: 'bg-[#F2EDE1] border border-[#E3CFAE] text-[#0F2E22]'
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 transition-all duration-200 ${variantStyles[variant]} ${onClick ? 'cursor-pointer hover:border-[#0F2E22]/30 hover:shadow-sm' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
