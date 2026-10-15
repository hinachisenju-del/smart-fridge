import React from 'react';

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
}

/**
 * Tasteful, restrained card container providing clean surface elevation,
 * subtle border transition, and zero gimmicky neon glow.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border border-[#e6e1d6] hover:border-[#cfc8b9] shadow-[0_1px_3px_0_rgba(20,36,38,0.04)] hover:shadow-[0_4px_12px_0_rgba(20,36,38,0.06)] transition-all duration-150 flex flex-col justify-between ${className}`}
    >
      {children}
    </div>
  );
};
