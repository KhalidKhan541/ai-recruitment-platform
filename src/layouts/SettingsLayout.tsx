import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children: React.ReactNode;
  navigation: React.ReactNode;
  className?: string;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  navigation,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your account and preferences.</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="w-full shrink-0 lg:w-56">
          {navigation}
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
