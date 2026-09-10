import React from 'react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
}

interface SidebarProps {
  items: NavItem[];
  activeItem?: string;
  onItemClick?: (href: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeItem,
  onItemClick,
  collapsed = false,
  onToggleCollapse,
  footer,
  className = '',
}) => {
  return (
    <aside
      className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200">
        {!collapsed && (
          <span className="text-lg font-bold text-slate-900">AI Recruit</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <svg
            className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => item.href && onItemClick?.(item.href)}
            className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeItem === item.href
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>
      {footer && (
        <div className="border-t border-slate-200 p-3">{footer}</div>
      )}
    </aside>
  );
};
