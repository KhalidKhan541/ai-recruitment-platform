import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}) => {
  const sizes = { sm: 'h-5 w-9', md: 'h-6 w-11', lg: 'h-7 w-14' };
  const dotSizes = { sm: 'h-3.5 w-3.5', md: 'h-4.5 w-4.5', lg: 'h-5.5 w-5.5' };

  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`relative inline-flex shrink-0 rounded-full transition-colors ${
          sizes[size]
        } ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform ${
            dotSizes[size]
          } ${checked ? `translate-x-${size === 'sm' ? '4' : size === 'lg' ? '7' : '5'}` : 'translate-x-0'}`}
        />
      </button>
      <div>
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
    </label>
  );
};
