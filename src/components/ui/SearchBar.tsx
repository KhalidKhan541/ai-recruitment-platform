import React from 'react';

interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onSearch?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'pl-9 pr-3 py-1.5 text-sm',
  md: 'pl-10 pr-4 py-2 text-sm',
  lg: 'pl-12 pr-4 py-3 text-base',
};

const iconSizes = {
  sm: 'h-4 w-4 left-3',
  md: 'h-5 w-5 left-3.5',
  lg: 'h-5 w-5 left-4',
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  size = 'md',
  className = '',
  ...props
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.((e.target as HTMLInputElement).value);
    }
  };

  return (
    <div className="relative">
      <svg
        className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${iconSizes[size]}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        className={`w-full rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${sizeMap[size]} ${className}`}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
};
