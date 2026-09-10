import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  navItems: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
  }>;
  headerProps?: {
    title?: string;
    subtitle?: string;
    onSearch?: (query: string) => void;
    notifications?: number;
    onNotificationsClick?: () => void;
    user?: { name: string; avatar?: string };
    onLogout?: () => void;
    actions?: React.ReactNode;
  };
  sidebarFooter?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  navItems,
  headerProps,
  sidebarFooter,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(navItems[0]?.href || '');

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        items={navItems}
        activeItem={activeItem}
        onItemClick={setActiveItem}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        footer={sidebarFooter}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header {...headerProps} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
