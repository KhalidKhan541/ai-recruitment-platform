import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  description,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={checkboxId}
        className={`mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${className}`}
        {...props}
      />
      <div>
        {label && (
          <label htmlFor={checkboxId} className="text-sm font-medium text-slate-700 cursor-pointer">
            {label}
          </label>
        )}
        {description && <p className="text-sm text-slate-500">{description}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};
