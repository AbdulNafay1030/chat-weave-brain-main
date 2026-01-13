import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AllSideThread {
  id: string;
  group_id: string;
  name: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export function useAllSideThreads(groupIds: string[]) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AllSideThread[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllThreads = useCallback(async () => {
    setThreads([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllThreads();
  }, [fetchAllThreads]);

  return { threads, loading, refetch: fetchAllThreads };
}