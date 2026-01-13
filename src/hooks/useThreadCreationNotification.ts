import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThreadNotification {
  id: string;
  creatorName: string;
  threadName: string;
  timestamp: number;
}

export function useThreadCreationNotification(groupId: string | undefined, currentUserId: string) {
  const [notification, setNotification] = useState<ThreadNotification | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`thread-creation-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'side_threads',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newThread = payload.new as {
            id: string;
            name: string;
            created_by: string;
            group_id: string;
          };

          // Don't show notification for threads created by current user
          if (newThread.created_by === currentUserId) return;

          // Fetch creator's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', newThread.created_by)
            .single();

          const creatorName = profile?.full_name || profile?.email || 'Someone';

          setNotification({
            id: newThread.id,
            creatorName,
            threadName: newThread.name,
            timestamp: Date.now(),
          });

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, currentUserId]);

  const dismissNotification = () => setNotification(null);

  return { notification, dismissNotification };
}
