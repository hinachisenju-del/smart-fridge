import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shineColor?: string;
}

/**
 * Clean, accessible typography wrapper without duplicate pseudo-DOM spans or gaudy shimmer.
 */
export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className = '',
}) => {
  return <span className={className}>{text}</span>;
};
