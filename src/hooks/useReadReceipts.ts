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

    // Skip if Supabase is not configured (using placeholder)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return;
    }

    const fetchReadReceipts = async () => {
      try {
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
      } catch (error) {
        // Silently fail if Supabase is not configured
        console.warn('Read receipts not available:', error);
      }
    };

    fetchReadReceipts();

    // Subscribe to realtime updates (only if Supabase is configured)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
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
    } catch (error) {
      // Silently fail if Supabase is not configured
      console.warn('Read receipts subscription not available:', error);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [messageIds.join(',')]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    // Skip if Supabase is not configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return;
    }

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

      if (error) {
        // Ignore duplicate key errors (23505) and UUID format errors (22P02 - schema mismatch)
        if (error.code !== '23505' && error.code !== '22P02') {
          console.error('Error marking message as read:', error);
        }
      }
    } catch (error) {
      // Silently fail if Supabase is not configured
      console.warn('Error marking message as read:', error);
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

    // Skip if Supabase is not configured (using placeholder)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return;
    }

    const fetchReadReceipts = async () => {
      try {
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
      } catch (error) {
        // Silently fail if Supabase is not configured
        console.warn('Side thread read receipts not available:', error);
      }
    };

    fetchReadReceipts();

    // Subscribe to realtime updates (only if Supabase is configured)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
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
    } catch (error) {
      // Silently fail if Supabase is not configured
      console.warn('Side thread read receipts subscription not available:', error);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [messageIds.join(',')]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    // Skip if Supabase is not configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return;
    }

    const existing = readReceipts.get(messageId);
    if (existing?.some((r) => r.user_id === user.id)) return;

    try {
      const { error } = await supabase
        .from('side_thread_message_reads')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });


        

      if (error) {
        // Ignore duplicate key errors (23505) and UUID format errors (22P02 - schema mismatch)
        if (error.code !== '23505' && error.code !== '22P02') {
          console.error('Error marking side thread message as read:', error);
        }
      }
    } catch (error) {
      // Silently fail if Supabase is not configured
      console.warn('Error marking side thread message as read:', error);
    }
  }, [user, readReceipts]);

  const getReadBy = useCallback((messageId: string) => {
    return readReceipts.get(messageId) || [];
  }, [readReceipts]);

  return { readReceipts, markAsRead, getReadBy };
}

