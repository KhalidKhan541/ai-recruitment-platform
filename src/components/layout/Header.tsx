import React from 'react';
import { SearchBar } from '../ui/SearchBar';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  notifications?: number;
  onNotificationsClick?: () => void;
  user?: {
    name: string;
    avatar?: string;
  };
  onLogout?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onSearch,
  notifications = 0,
  onNotificationsClick,
  user,
  onLogout,
  actions,
  className = '',
}) => {
  return (
    <header className={`flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 ${className}`}>
      <div className="flex items-center gap-4">
        {title && (
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}
        {onSearch && (
          <div className="w-80">
            <SearchBar placeholder="Search candidates, jobs..." onSearch={onSearch} size="sm" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {onNotificationsClick && (
          <button
            onClick={onNotificationsClick}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {notifications > 99 ? '99+' : notifications}
              </span>
            )}
          </button>
        )}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
            </div>
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Logout
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
