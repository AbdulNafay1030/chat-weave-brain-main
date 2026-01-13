import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Message } from '@/services/api';

interface UnreadCounts {
  [key: string]: number; // groupId or threadId -> unread count
}

export const useUnreadCount = (groupIds: string[]) => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [key: string]: Date }>({});
  const lastReadTimestampsRef = useRef<{ [key: string]: Date }>({});

  // Keep ref in sync with state
  useEffect(() => {
    lastReadTimestampsRef.current = lastReadTimestamps;
  }, [lastReadTimestamps]);

  // Load last read timestamps from localStorage
  useEffect(() => {
    if (!user) return;
    
    const stored = localStorage.getItem(`last_read_timestamps_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const converted: { [key: string]: Date } = {};
        Object.entries(parsed).forEach(([key, val]) => {
          converted[key] = new Date(val as string);
        });
        setLastReadTimestamps(converted);
        lastReadTimestampsRef.current = converted;
      } catch (e) {
        console.error('Failed to parse stored timestamps:', e);
      }
    }
  }, [user]);

  // Calculate unread counts for groups
  useEffect(() => {
    if (!user || groupIds.length === 0) return;

    const fetchUnreadCounts = async () => {
      const counts: UnreadCounts = {};
      
      for (const groupId of groupIds) {
        try {
          // Use ref to get latest timestamps without causing re-runs
          const lastRead = lastReadTimestampsRef.current[groupId] || new Date(0);
          const messages = await api.getMessages(groupId);
          
          // Count messages that are:
          // 1. Not from the current user
          // 2. Created after the last read timestamp
          const unread = messages.filter((msg: Message) => {
            const msgDate = new Date(msg.created_at);
            return msg.user_id !== user.id && msgDate > lastRead;
          }).length;
          
          counts[groupId] = unread;
        } catch (error) {
          console.error(`Error fetching unread count for group ${groupId}:`, error);
          counts[groupId] = 0;
        }
      }
      
      setUnreadCounts(prev => ({ ...prev, ...counts }));
    };

    // Fetch immediately
    fetchUnreadCounts();

    // Poll every 10 seconds to update unread counts (increased from 5 to reduce load)
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [user, groupIds]);

  // Mark as read
  const markAsRead = useCallback((groupId: string) => {
    if (!user) return;
    
    const newTimestamps = { ...lastReadTimestamps, [groupId]: new Date() };
    setLastReadTimestamps(newTimestamps);
    
    // Store in localStorage
    const serialized: { [key: string]: string } = {};
    Object.entries(newTimestamps).forEach(([k, v]) => {
      serialized[k] = v.toISOString();
    });
    localStorage.setItem(`last_read_timestamps_${user.id}`, JSON.stringify(serialized));
    
    // Reset count
    setUnreadCounts(prev => ({ ...prev, [groupId]: 0 }));
  }, [user, lastReadTimestamps]);

  const getUnreadCount = useCallback((groupId: string) => {
    return unreadCounts[groupId] || 0;
  }, [unreadCounts]);

  return { getUnreadCount, markAsRead };
};
