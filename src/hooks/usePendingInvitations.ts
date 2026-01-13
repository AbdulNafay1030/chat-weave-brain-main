import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface PendingInvitation {
  id: string;
  token: string;
  group_id: string;
  group_name: string;
  invited_by_name: string;
  created_at: string;
  expires_at: string;
}

export const usePendingInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = async () => {
    setInvitations([]);
    setLoading(false);
  };

  const acceptInvitation = async (token: string): Promise<{ success: boolean; groupId?: string; groupName?: string; error?: string }> => {
    // Mock accept
    return { success: true, groupId: 'mock-group', groupName: 'Mock Group' };
  };

  useEffect(() => {
    fetchInvitations();
  }, [user?.email]);

  return {
    invitations,
    loading,
    acceptInvitation,
    refetch: fetchInvitations,
  };
};
