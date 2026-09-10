import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine key={i} className="h-4 w-full" />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-xl border border-slate-200 p-6 space-y-4 ${className}`}>
    <div className="flex items-center gap-4">
      <SkeletonLine className="h-12 w-12 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonLine className="h-3 w-full" />
    <SkeletonLine className="h-3 w-5/6" />
    <SkeletonLine className="h-3 w-2/3" />
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
  return <SkeletonLine className={`rounded-full ${sizes[size]} ${className}`} />;
};
