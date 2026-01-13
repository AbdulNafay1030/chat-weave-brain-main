import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface LastSeenState {
  [userId: string]: Date | null;
}

export const useLastSeen = (channelName: string) => {
  const [lastSeenTimes, setLastSeenTimes] = useState<LastSeenState>({});

  useEffect(() => {
    if (!channelName) return;

    const channel = supabase.channel(`presence:${channelName}`);

    channel
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // When user leaves, record the time
        setLastSeenTimes((prev) => ({
          ...prev,
          [key]: new Date(),
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);

  const getLastSeen = useCallback((userId: string, isOnline: boolean) => {
    if (isOnline) return null;
    
    const lastSeen = lastSeenTimes[userId];
    if (!lastSeen) return 'Offline';
    
    return `Last seen ${formatDistanceToNow(lastSeen, { addSuffix: true })}`;
  }, [lastSeenTimes]);

  return { getLastSeen };
};
