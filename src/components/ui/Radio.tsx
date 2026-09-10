import React from 'react';

interface RadioOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
}

export const Radio: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>}
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              value === opt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:bg-slate-50'
            } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange?.(opt.value)}
              disabled={opt.disabled}
              className="mt-0.5 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">{opt.label}</span>
              {opt.description && (
                <p className="text-sm text-slate-500">{opt.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
