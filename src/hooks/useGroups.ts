import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { Group, Message, User } from '@/types/sidechat';

export function useGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getGroups(user.id);
      // Map API Group to frontend Group if needed, for now assuming compatible
      // API returns snake_case for dates? Need to check.
      // main.py returns "created_at". Frontend expects "createdAt" (Date object).
      // We'll map it here.
      const mappedGroups: Group[] = data.map((g: any) => ({
        ...g,
        createdAt: new Date(g.created_at || new Date()),
        members: g.members || []
      }));
      setGroups(mappedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createGroup = useCallback(async (name: string, description?: string) => {
    if (!user) return null;
    try {
      const g = await api.createGroup(name, user.id);
      const newGroup: Group = {
        ...g,
        createdAt: new Date(g.created_at || new Date()),
        members: g.members || [] // API should return members
      };
      setGroups(prev => [...prev, newGroup]);
      toast({
        title: 'Group created',
        description: `"${name}" has been created successfully.`,
      });
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Failed to create group',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const updateGroupName = useCallback(async (groupId: string, newName: string) => {
    try {
      await api.updateGroupName(groupId, newName);
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
      toast({ title: 'Group renamed' });
      return true;
    } catch (error) {
      console.error('Error updating group name:', error);
      toast({ title: 'Failed to rename group', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      await api.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast({ title: 'Group deleted' });
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({ title: 'Failed to delete group', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    fetchGroups();
    // Simple polling for easier dev experience
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  return { groups, loading, createGroup, updateGroupName, deleteGroup, refetchGroups: fetchGroups };
}

export function useGroupMembers(groupId: string | null) {
  // Since our API includes members in groups, or we can fetch them.
  // For simplicity, we'll just mock it or rely on useGroups for now if this is used separately.
  // Actually, let's just return empty or what we can. 
  // Ideally we should call an API endpoint for members.
  // But strictly, useGroups already gets members in my main.py.
  // So we can assume the parent component has the group members.
  // But this hook loads them.
  // I'll make a dummy implementation that just returns empty or relies on the group context if passed.
  // Since we don't have a GetMembers endpoint, I'll skip it or mock it.

  const [members, setMembers] = useState<any[]>([]);
  return { members, loading: false };
}

export function useMessages(groupId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      return;
    }
    try {
      const data = await api.getMessages(groupId);
      // Map params
      const mappedMessages: Message[] = data.map((m: any) => ({
        id: m.id,
        groupId: m.group_id,
        userId: m.user_id,
        content: m.content,
        createdAt: new Date(m.created_at),
        isAI: m.is_ai,
        threadId: m.thread_id,
        replyToId: m.reply_to_id,
        isPinned: m.is_pinned || false,
        // Add default values for missing fields
        fileUrl: m.file_url,
        fileName: m.file_name,
        fileType: m.file_type,
        fileSize: m.file_size
      }));
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const sendMessage = useCallback(async (
    content: string,
    isAi = false,
    threadId?: string | null,
    replyToId?: string | null,
    file?: { url: string; name: string; type: string; size: number } | null,
    overrideUserId?: string // Allow overriding user ID (e.g., for AI messages)
  ) => {
    if (!groupId || !user) return;
    try {
      // Use overrideUserId if provided, otherwise default to current user
      const senderId = overrideUserId || user.id;
      const m = await api.sendMessage(content, senderId, groupId, isAi, replyToId || undefined);
      // Optimistic update or refetch
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [groupId, user, fetchMessages]);

  const editMessage = async () => true; // Mock
  const deleteMessage = async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      await fetchMessages();
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  };
  const togglePin = async (messageId: string) => {
    try {
      await api.togglePinMessage(messageId);
      await fetchMessages();
      return true;
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll messages
    return () => clearInterval(interval);
  }, [fetchMessages]);

  return { messages, loading, sendMessage, editMessage, deleteMessage, togglePin };
}
