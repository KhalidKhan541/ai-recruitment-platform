import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'border-blue-600',
  className = '',
}) => {
  return (
    <div
      className={`animate-spin rounded-full ${color} border-current border-r-transparent ${sizeMap[size]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
