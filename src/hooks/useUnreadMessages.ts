import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UnreadCounts {
  [key: string]: number; // groupId or threadId -> unread count
}

export const useUnreadMessages = (groupIds: string[], threadIds: string[]) => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [key: string]: Date }>({});

  // Load last read timestamps from localStorage
  useEffect(() => {
    if (!user) return;
    
    const stored = localStorage.getItem(`unread_timestamps_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const converted: { [key: string]: Date } = {};
        Object.entries(parsed).forEach(([key, val]) => {
          converted[key] = new Date(val as string);
        });
        setLastReadTimestamps(converted);
      } catch (e) {
        console.error('Failed to parse stored timestamps:', e);
      }
    }
  }, [user]);

  // Calculate unread counts for groups
  useEffect(() => {
    if (!user || groupIds.length === 0) return;

    const fetchGroupUnread = async () => {
      const counts: UnreadCounts = {};
      
      for (const groupId of groupIds) {
        const lastRead = lastReadTimestamps[`group:${groupId}`] || new Date(0);
        
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .neq('user_id', user.id)
          .gt('created_at', lastRead.toISOString());
        
        if (!error && count !== null) {
          counts[`group:${groupId}`] = count;
        }
      }
      
      setUnreadCounts(prev => ({ ...prev, ...counts }));
    };

    fetchGroupUnread();
  }, [user, groupIds, lastReadTimestamps]);

  // Calculate unread counts for threads
  useEffect(() => {
    if (!user || threadIds.length === 0) return;

    const fetchThreadUnread = async () => {
      const counts: UnreadCounts = {};
      
      for (const threadId of threadIds) {
        const lastRead = lastReadTimestamps[`thread:${threadId}`] || new Date(0);
        
        const { count, error } = await supabase
          .from('side_thread_messages')
          .select('*', { count: 'exact', head: true })
          .eq('side_thread_id', threadId)
          .neq('user_id', user.id)
          .gt('created_at', lastRead.toISOString());
        
        if (!error && count !== null) {
          counts[`thread:${threadId}`] = count;
        }
      }
      
      setUnreadCounts(prev => ({ ...prev, ...counts }));
    };

    fetchThreadUnread();
  }, [user, threadIds, lastReadTimestamps]);

  // Mark as read
  const markAsRead = useCallback((type: 'group' | 'thread', id: string) => {
    if (!user) return;
    
    const key = `${type}:${id}`;
    const newTimestamps = { ...lastReadTimestamps, [key]: new Date() };
    setLastReadTimestamps(newTimestamps);
    
    // Store in localStorage
    const serialized: { [key: string]: string } = {};
    Object.entries(newTimestamps).forEach(([k, v]) => {
      serialized[k] = v.toISOString();
    });
    localStorage.setItem(`unread_timestamps_${user.id}`, JSON.stringify(serialized));
    
    // Reset count
    setUnreadCounts(prev => ({ ...prev, [key]: 0 }));
  }, [user, lastReadTimestamps]);

  const getUnreadCount = useCallback((type: 'group' | 'thread', id: string) => {
    return unreadCounts[`${type}:${id}`] || 0;
  }, [unreadCounts]);

  return { getUnreadCount, markAsRead };
};
