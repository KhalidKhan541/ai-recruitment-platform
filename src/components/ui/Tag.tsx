import React from 'react';

type TagVariant = 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const variantStyles: Record<TagVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  yellow: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-violet-50 text-violet-700',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Tag: React.FC<TagProps> = ({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-60"
        >
          <svg className="h-3 w-3" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 1.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
    </span>
  );
};
