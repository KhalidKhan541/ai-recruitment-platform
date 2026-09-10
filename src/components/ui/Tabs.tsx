import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab: controlledTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id || '');
  const activeTab = controlledTab ?? internalTab;

  const handleChange = (id: string) => {
    if (onChange) onChange(id);
    else setInternalTab(id);
  };

  return (
    <div className={className}>
      <div
        className={`flex gap-1 ${
          variant === 'underline'
            ? 'border-b border-slate-200'
            : 'bg-slate-100 rounded-lg p-1'
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleChange(tab.id)}
            disabled={tab.disabled}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              variant === 'underline'
                ? `border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`
                : `rounded-md ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
