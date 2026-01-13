import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/integrations/supabase/client'; // Disabled: App uses FastAPI backend
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
    // Disabled: This app uses FastAPI backend, not Supabase for read receipts
    // Read receipts are handled client-side via localStorage if needed
    return;
  }, [messageIds.join(',')]);

  const markAsRead = useCallback(async (messageId: string) => {
    // Disabled: This app uses FastAPI backend, not Supabase for read receipts
    // Read receipts are handled client-side via localStorage if needed
    return;
  }, []);

  const getReadBy = useCallback((messageId: string) => {
    return readReceipts.get(messageId) || [];
  }, [readReceipts]);

  return { readReceipts, markAsRead, getReadBy };
}

export function useSideThreadReadReceipts(messageIds: string[]) {
  const { user } = useAuth();
  const [readReceipts, setReadReceipts] = useState<Map<string, ReadReceipt[]>>(new Map());

  useEffect(() => {
    // Disabled: This app uses FastAPI backend, not Supabase for read receipts
    // Read receipts are handled client-side via localStorage if needed
    return;
  }, [messageIds.join(',')]);

  const markAsRead = useCallback(async (messageId: string) => {
    // Disabled: This app uses FastAPI backend, not Supabase for read receipts
    // Read receipts are handled client-side via localStorage if needed
    return;
  }, []);

  const getReadBy = useCallback((messageId: string) => {
    return readReceipts.get(messageId) || [];
  }, [readReceipts]);

  return { readReceipts, markAsRead, getReadBy };
}

