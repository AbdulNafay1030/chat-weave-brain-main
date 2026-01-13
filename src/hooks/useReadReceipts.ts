import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export function useMessageReadReceipts(messageIds: string[]) {
  const { user } = useAuth();
  const [readReceipts, setReadReceipts] = useState<Map<string, ReadReceipt[]>>(new Map());

  useEffect(() => {
    if (!messageIds.length) return;

    const fetchReadReceipts = async () => {
      const { data, error } = await supabase
        .from('message_reads')
        .select('*')
        .in('message_id', messageIds);

      if (error) {
        console.error('Error fetching read receipts:', error);
        return;
      }

      const receiptsMap = new Map<string, ReadReceipt[]>();
      data?.forEach((receipt) => {
        const existing = receiptsMap.get(receipt.message_id) || [];
        receiptsMap.set(receipt.message_id, [...existing, receipt]);
      });
      setReadReceipts(receiptsMap);
    };

    fetchReadReceipts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('message_reads_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
        },
        (payload) => {
          const newReceipt = payload.new as ReadReceipt;
          if (messageIds.includes(newReceipt.message_id)) {
            setReadReceipts((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(newReceipt.message_id) || [];
              if (!existing.some((r) => r.user_id === newReceipt.user_id)) {
                newMap.set(newReceipt.message_id, [...existing, newReceipt]);
              }
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageIds.join(',')]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    // Check if already marked as read
    const existing = readReceipts.get(messageId);
    if (existing?.some((r) => r.user_id === user.id)) return;

    try {
      const { error } = await supabase
        .from('message_reads')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error marking message as read:', error);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [user, readReceipts]);

  const getReadBy = useCallback((messageId: string) => {
    return readReceipts.get(messageId) || [];
  }, [readReceipts]);

  return { readReceipts, markAsRead, getReadBy };
}

export function useSideThreadReadReceipts(messageIds: string[]) {
  const { user } = useAuth();
  const [readReceipts, setReadReceipts] = useState<Map<string, ReadReceipt[]>>(new Map());

  useEffect(() => {
    if (!messageIds.length) return;

    const fetchReadReceipts = async () => {
      const { data, error } = await supabase
        .from('side_thread_message_reads')
        .select('*')
        .in('message_id', messageIds);

      if (error) {
        console.error('Error fetching side thread read receipts:', error);
        return;
      }

      const receiptsMap = new Map<string, ReadReceipt[]>();
      data?.forEach((receipt) => {
        const existing = receiptsMap.get(receipt.message_id) || [];
        receiptsMap.set(receipt.message_id, [...existing, receipt]);
      });
      setReadReceipts(receiptsMap);
    };

    fetchReadReceipts();

    const channel = supabase
      .channel('side_thread_message_reads_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'side_thread_message_reads',
        },
        (payload) => {
          const newReceipt = payload.new as ReadReceipt;
          if (messageIds.includes(newReceipt.message_id)) {
            setReadReceipts((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(newReceipt.message_id) || [];
              if (!existing.some((r) => r.user_id === newReceipt.user_id)) {
                newMap.set(newReceipt.message_id, [...existing, newReceipt]);
              }
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageIds.join(',')]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    const existing = readReceipts.get(messageId);
    if (existing?.some((r) => r.user_id === user.id)) return;

    try {
      const { error } = await supabase
        .from('side_thread_message_reads')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });

      if (error && error.code !== '23505') {
        console.error('Error marking side thread message as read:', error);
      }
    } catch (error) {
      console.error('Error marking side thread message as read:', error);
    }
  }, [user, readReceipts]);

  const getReadBy = useCallback((messageId: string) => {
    return readReceipts.get(messageId) || [];
  }, [readReceipts]);

  return { readReceipts, markAsRead, getReadBy };
}
