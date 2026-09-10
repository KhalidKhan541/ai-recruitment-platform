import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]', dot: 'h-2 w-2 -bottom-0 -right-0' },
  sm: { container: 'h-8 w-8', text: 'text-xs', dot: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5' },
  md: { container: 'h-10 w-10', text: 'text-sm', dot: 'h-3 w-3 -bottom-0.5 -right-0.5' },
  lg: { container: 'h-12 w-12', text: 'text-base', dot: 'h-3.5 w-3.5 -bottom-0 -right-0' },
  xl: { container: 'h-16 w-16', text: 'text-lg', dot: 'h-4 w-4 -bottom-0 -right-0' },
};

const statusColors: Record<string, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const colors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  status,
  className = '',
}) => {
  const s = sizeMap[size];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${s.container} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${s.container} rounded-full flex items-center justify-center font-medium text-white ${getColor(name)}`}
        >
          <span className={s.text}>{getInitials(name)}</span>
        </div>
      )}
      {status && (
        <span
          className={`absolute ${s.dot} rounded-full border-2 border-white ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
