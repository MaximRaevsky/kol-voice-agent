import { useState, useEffect, useCallback } from 'react';
import type { Lead } from '@kol/shared';
import { getLeads } from '../services/apiClient';

interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return {
    leads,
    loading,
    error,
    refresh: loadLeads,
  };
}

export default useLeads;
