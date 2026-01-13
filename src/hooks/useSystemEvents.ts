import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemEvent {
  id: string;
  type: 'thread_created' | 'member_joined' | 'member_left';
  message: string;
  timestamp: Date;
}

export function useSystemEvents(groupId: string | undefined, currentUserId: string) {
  const [events, setEvents] = useState<SystemEvent[]>([]);

  useEffect(() => {
    if (!groupId) return;

    // Listen for thread creation
    const threadChannel = supabase
      .channel(`system-thread-${groupId}`)
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
          };

          // Fetch creator's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', newThread.created_by)
            .maybeSingle();

          const isCurrentUser = newThread.created_by === currentUserId;
          const creatorName = isCurrentUser 
            ? 'You' 
            : (profile?.full_name || profile?.email?.split('@')[0] || 'Someone');

          const message = `${creatorName} created a private thread "${newThread.name}"`;

          setEvents(prev => [...prev, {
            id: `thread-${newThread.id}`,
            type: 'thread_created',
            message,
            timestamp: new Date(),
          }]);
        }
      )
      .subscribe();

    // Listen for member changes
    const memberChannel = supabase
      .channel(`system-members-${groupId}`)
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
          };

          // Fetch member's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', newMember.user_id)
            .maybeSingle();

          const isCurrentUser = newMember.user_id === currentUserId;
          const memberName = isCurrentUser 
            ? 'You' 
            : (profile?.full_name || profile?.email?.split('@')[0] || 'Someone');

          const message = isCurrentUser ? 'You joined the group' : `${memberName} joined the group`;

          setEvents(prev => [...prev, {
            id: `member-join-${newMember.id}`,
            type: 'member_joined',
            message,
            timestamp: new Date(),
          }]);
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
          };

          if (oldMember.user_id === currentUserId) return;

          // Fetch member's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', oldMember.user_id)
            .maybeSingle();

          const memberName = profile?.full_name || profile?.email?.split('@')[0] || 'Someone';
          const message = `${memberName} left the group`;

          setEvents(prev => [...prev, {
            id: `member-left-${oldMember.id}`,
            type: 'member_left',
            message,
            timestamp: new Date(),
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(threadChannel);
      supabase.removeChannel(memberChannel);
    };
  }, [groupId, currentUserId]);

  const clearEvents = () => setEvents([]);

  return { events, clearEvents };
}
