import React from 'react';

interface BrandLogoProps {
  variant?: 'primary' | 'dark' | 'light' | 'symbol' | 'wordmark';
  height?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'primary',
  height = 32,
  className = ''
}) => {
  let assetPath = '/assets/brand/01-logos/trustforge-logo-primary.svg';

  if (variant === 'dark') {
    assetPath = '/assets/brand/01-logos/trustforge-logo-dark.svg';
  } else if (variant === 'light') {
    assetPath = '/assets/brand/01-logos/trustforge-logo-light.svg';
  } else if (variant === 'symbol') {
    assetPath = '/assets/brand/01-logos/trustforge-symbol.svg';
  } else if (variant === 'wordmark') {
    assetPath = '/assets/brand/01-logos/trustforge-wordmark.svg';
  }

  return (
    <img
      src={assetPath}
      alt="TrustForge"
      style={{ height: `${height}px`, width: 'auto' }}
      className={`object-contain ${className}`}
    />
  );
};
