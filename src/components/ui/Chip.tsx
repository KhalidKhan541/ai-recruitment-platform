import React from 'react';

type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface ChipProps {
  children: React.ReactNode;
  variant?: ChipVariant;
  selected?: boolean;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const variantStyles: Record<ChipVariant, { base: string; active: string }> = {
  default: { base: 'border-slate-300 text-slate-700', active: 'bg-slate-900 text-white border-slate-900' },
  primary: { base: 'border-blue-300 text-blue-700', active: 'bg-blue-600 text-white border-blue-600' },
  success: { base: 'border-emerald-300 text-emerald-700', active: 'bg-emerald-600 text-white border-emerald-600' },
  warning: { base: 'border-amber-300 text-amber-700', active: 'bg-amber-500 text-white border-amber-500' },
  danger: { base: 'border-red-300 text-red-700', active: 'bg-red-600 text-white border-red-600' },
};

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  selected = false,
  onClick,
  removable = false,
  onRemove,
  className = '',
}) => {
  const styles = variantStyles[variant];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        selected ? styles.active : `bg-white ${styles.base}`
      } ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10"
        >
          <svg className="h-3 w-3" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 1.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
    </span>
  );
};
