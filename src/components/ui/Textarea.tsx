import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  maxLength,
  className = '',
  id,
  value,
  ...props
}) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 resize-y min-h-[80px] ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${className}`}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex items-center justify-between mt-1">
        <div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
        </div>
        {maxLength && (
          <span className="text-xs text-slate-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};
