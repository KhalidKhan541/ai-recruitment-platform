import { useState, useEffect, useCallback } from 'react';

interface UseFetchOptions<T> {
  url: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  transform?: (data: unknown) => T;
  immediate?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFetch<T = unknown>({
  url,
  method = 'GET',
  body,
  headers = {},
  transform,
  immediate = true,
}: UseFetchOptions<T>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(transform ? transform(json) : (json as T));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, method, body, headers, transform]);

  useEffect(() => {
    if (immediate) fetchData();
  }, [immediate, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
