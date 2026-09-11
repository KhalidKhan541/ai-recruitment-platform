'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

interface QueryEntry<T = unknown> {
  data: T | null;
  status: QueryStatus;
  error: string | null;
  timestamp: number;
}

interface QueryContextValue {
  getQuery: <T>(key: string) => QueryEntry<T> | undefined;
  fetchQuery: <T>(key: string, fn: () => Promise<T>, opts?: { staleTime?: number }) => Promise<T>;
  invalidateQuery: (key: string) => void;
  invalidateQueries: (prefix: string) => void;
  setQueryData: <T>(key: string, data: T) => void;
}

const QueryContext = createContext<QueryContextValue | undefined>(undefined);

export function useQueryClient() {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error('useQueryClient must be used within QueryProvider');
  return ctx;
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000;

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef(new Map<string, QueryEntry>());

  const getQuery = useCallback(<T,>(key: string): QueryEntry<T> | undefined => {
    return cacheRef.current.get(key) as QueryEntry<T> | undefined;
  }, []);

  const setQueryData = useCallback(<T,>(key: string, data: T) => {
    cacheRef.current.set(key, {
      data,
      status: 'success',
      error: null,
      timestamp: Date.now(),
    });
  }, []);

  const fetchQuery = useCallback(
    async <T,>(key: string, fn: () => Promise<T>, opts?: { staleTime?: number }) => {
      const staleTime = opts?.staleTime ?? DEFAULT_STALE_TIME;
      const existing = cacheRef.current.get(key);
      if (existing && existing.status === 'success' && Date.now() - existing.timestamp < staleTime) {
        return existing.data as T;
      }

      cacheRef.current.set(key, {
        data: existing?.data ?? null,
        status: 'loading',
        error: null,
        timestamp: Date.now(),
      });

      try {
        const data = await fn();
        cacheRef.current.set(key, { data, status: 'success', error: null, timestamp: Date.now() });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        cacheRef.current.set(key, {
          data: existing?.data ?? null,
          status: 'error',
          error,
          timestamp: Date.now(),
        });
        throw err;
      }
    },
    []
  );

  const invalidateQuery = useCallback((key: string) => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      cacheRef.current.set(key, { ...entry, timestamp: 0 });
    }
  }, []);

  const invalidateQueries = useCallback((prefix: string) => {
    for (const [key, entry] of cacheRef.current) {
      if (key.startsWith(prefix)) {
        cacheRef.current.set(key, { ...entry, timestamp: 0 });
      }
    }
  }, []);

  return (
    <QueryContext.Provider value={{ getQuery, fetchQuery, invalidateQuery, invalidateQueries, setQueryData }}>
      {children}
    </QueryContext.Provider>
  );
};
