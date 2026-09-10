import React from 'react';

type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressBarVariant;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const variantStyles: Record<ProgressBarVariant, string> = {
  default: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-600',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  label,
  showValue = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {showValue && <span className="text-sm text-slate-500">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full ${sizeStyles[size]}`}>
        <div
          className={`${variantStyles[variant]} rounded-full transition-all duration-300 ${sizeStyles[size]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
