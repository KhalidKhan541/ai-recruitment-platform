import React from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn('flex min-h-screen', className)}>
      <div className="hidden w-1/2 bg-gradient-to-br from-purple-600 to-indigo-600 lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md px-8 text-center">
          <h1 className="text-3xl font-bold text-white">AI Recruitment Platform</h1>
          <p className="mt-4 text-lg text-purple-100">
            Streamline your hiring process with intelligent candidate matching and automated workflows.
          </p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};
