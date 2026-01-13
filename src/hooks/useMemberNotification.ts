import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MemberNotificationType = 'member_joined' | 'member_left';

interface MemberNotification {
  id: string;
  type: MemberNotificationType;
  userName: string;
  timestamp: number;
}

export function useMemberNotification(groupId: string | undefined, currentUserId: string) {
  const [notification, setNotification] = useState<MemberNotification | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`member-changes-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMember = payload.new as {
            id: string;
            user_id: string;
            group_id: string;
          };

          // Don't show notification for current user joining
          if (newMember.user_id === currentUserId) return;

          // Fetch member's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', newMember.user_id)
            .maybeSingle();

          const userName = profile?.full_name || profile?.email || 'Someone';

          setNotification({
            id: newMember.id,
            type: 'member_joined',
            userName,
            timestamp: Date.now(),
          });

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const oldMember = payload.old as {
            id: string;
            user_id: string;
            group_id: string;
          };

          // Don't show notification for current user leaving
          if (oldMember.user_id === currentUserId) return;

          // Fetch member's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', oldMember.user_id)
            .maybeSingle();

          const userName = profile?.full_name || profile?.email || 'Someone';

          setNotification({
            id: oldMember.id,
            type: 'member_left',
            userName,
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
