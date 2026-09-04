import React from 'react';
import { Severity, EvidenceStatus, FindingStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'beige' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    default: 'bg-[#F2EDE1] text-[#0F2E22] border border-[#E3DDD0]',
    emerald: 'bg-[#0F2E22] text-[#F2EDE1]',
    beige: 'bg-[#E3CFAE] text-[#0F2E22] border border-[#D5BD97]',
    success: 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]',
    warning: 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]',
    danger: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]',
    info: 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: Severity; size?: 'sm' | 'md' }> = ({ severity, size = 'md' }) => {
  if (severity === 'HIGH') return <Badge variant="danger" size={size}>HIGH PRIORITY</Badge>;
  if (severity === 'MEDIUM') return <Badge variant="warning" size={size}>MEDIUM PRIORITY</Badge>;
  return <Badge variant="info" size={size}>LOW PRIORITY</Badge>;
};

export const EvidenceBadge: React.FC<{ status: EvidenceStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'VERIFIED':
      return <Badge variant="success" size={size}>✓ Verified Evidence</Badge>;
    case 'DETECTED':
      return <Badge variant="beige" size={size}>🔍 Detected Signal</Badge>;
    case 'INFERRED':
      return <Badge variant="info" size={size}>💡 Inferred</Badge>;
    case 'NOT_FOUND':
      return <Badge variant="danger" size={size}>✕ Not Found</Badge>;
    default:
      return <Badge variant="default" size={size}>Not Assessed</Badge>;
  }
};

export const FindingStatusBadge: React.FC<{ status: FindingStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'REQUIRES_REVIEW':
      return <Badge variant="warning" size={size}>Requires Review</Badge>;
    case 'OPEN':
      return <Badge variant="danger" size={size}>Open Action</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="info" size={size}>In Progress</Badge>;
    case 'REMEDIATED':
      return <Badge variant="success" size={size}>Resolved</Badge>;
    default:
      return <Badge variant="default" size={size}>Dismissed</Badge>;
  }
};
