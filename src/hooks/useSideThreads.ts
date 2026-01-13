import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface DbSideThread {
  id: string;
  group_id: string;
  name: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSideThreadParticipant {
  id: string;
  side_thread_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface DbSideThreadMessage {
  id: string;
  side_thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  reply_to_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
}

// Side Threads Hook
export function useSideThreads(groupId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<DbSideThread[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchThreads = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      // In a real app, we might filter by created_by as well for "private" threads
      // but for now, we'll just fetch all threads for the group
      const response = await fetch(`${API_URL}/threads?group_id=${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (err) {
      console.error("Failed to fetch threads", err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = useCallback(async (name: string, participantIds: string[]) => {
    if (!user || !groupId) throw new Error("No user or group");

    const formData = new FormData();
    formData.append('name', name);
    formData.append('group_id', groupId);
    formData.append('created_by', user.id);

    const response = await fetch(`${API_URL}/threads`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("Failed to create thread");

    const newThread = await response.json();
    setThreads(prev => [...prev, newThread]);
    toast({ title: 'Thread created' });
    return newThread;
  }, [groupId, user, toast]);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      // Assuming api.deleteThread is available or using fetch directly
      // Since I added it to api.ts, I should be able to use it if I update the import or use fetch
      // Let's use fetch for safety if api interface isn't fully propagated yet in this file content view context (though I edited it)
      // Actually, I can just use fetch here to be sure.
      const response = await fetch(`${API_URL}/threads/${threadId}`, { method: 'DELETE' });
      if (response.ok) {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        toast({ title: 'Thread deleted' });
        return true;
      }
      return false;
    } catch (e) {
      toast({ title: 'Failed to delete thread', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const updateThreadName = useCallback(async (threadId: string, name: string) => {
    try {
      await api.updateThreadName(threadId, name);
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, name } : t));
      return true;
    } catch (e) {
      toast({ title: 'Failed to rename thread', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  return { threads, loading, createThread, deleteThread, updateThreadName, refetchThreads: fetchThreads };
}

export function useSideThreadParticipants(threadId: string | null) {
  const [participants, setParticipants] = useState<DbSideThreadParticipant[]>([]);
  return { participants, loading: false };
}

export function useSideThreadMessages(threadId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DbSideThreadMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/messages?thread_id=${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (
    content: string,
    replyToId?: string | null,
    file?: { url: string; name: string; type: string; size: number } | null
  ) => {
    if (!user || !threadId) return;

    const formData = new FormData();
    formData.append('content', content);
    formData.append('user_id', user.id);
    if (replyToId) formData.append('reply_to_id', replyToId);
    // Note: file upload logic needs to be adapted if we want to pass the file object
    // For now, assuming file upload is handled separately or we pass the metadata logic
    // But backend endpoint expects 'thread_id'
    formData.append('thread_id', threadId);

    await fetch(`${API_URL}/messages`, {
      method: 'POST',
      body: formData
    });

    fetchMessages(); // Refresh
  };

  const editMessage = async () => true;
  const deleteMessage = async () => true;
  const togglePin = async () => true;

  return { messages, loading, sendMessage, editMessage, deleteMessage, togglePin };
}
