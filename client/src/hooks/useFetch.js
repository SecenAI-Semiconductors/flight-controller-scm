import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';

/**
 * Generic data-fetching hook with loading, error, and data states.
 *
 * @param {string|null} url - API path (relative to base). Pass null to skip.
 * @param {object} [options]
 * @param {object} [options.params] - Query parameters.
 * @param {boolean} [options.manual] - If true, don't fetch on mount.
 * @returns {{ data: any, loading: boolean, error: string|null, refetch: Function }}
 */
export function useFetch(url, options = {}) {
  const { params, manual = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchData = useCallback(async (overrideParams) => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url, {
        params: overrideParams || paramsRef.current,
      });
      setData(response.data);
    } catch (err) {
      const message =
        err.response?.data?.error?.message || err.message || 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!manual && url) {
      fetchData();
    }
  }, [fetchData, manual, url]);

  // Re-fetch when params change (serialize to detect changes)
  const serializedParams = JSON.stringify(params);
  useEffect(() => {
    if (!manual && url) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedParams]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Debounce a value.
 * @param {any} value
 * @param {number} delay - ms
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
