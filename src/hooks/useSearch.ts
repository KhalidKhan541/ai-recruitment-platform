import { useState, useMemo } from 'react';

interface UseSearchProps<T> {
  items: T[];
  keys: (keyof T)[];
  threshold?: number;
}

export function useSearch<T>({ items, keys, threshold = 0.3 }: UseSearchProps<T>) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();
    return items.filter((item) =>
      keys.some((key) => {
        const val = String(item[key] ?? '').toLowerCase();
        if (val.includes(lowerQuery)) return true;
        return fuzzyMatch(val, lowerQuery) <= threshold;
      })
    );
  }, [items, keys, query, threshold]);

  return { query, setQuery, results };
}

function fuzzyMatch(str: string, pattern: string): number {
  let pi = 0;
  let misses = 0;
  for (let si = 0; si < str.length && pi < pattern.length; si++) {
    if (str[si] === pattern[pi]) pi++;
    else misses++;
  }
  return pi === pattern.length ? misses / str.length : 1;
}
