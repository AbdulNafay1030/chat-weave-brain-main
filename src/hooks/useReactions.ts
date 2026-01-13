import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export function useMessageReactions(messageIds: string[]) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    if (messageIds.length === 0) {
      setReactions({});
      setLoading(false);
      return;
    }

    try {
      // Fetch reactions for all messages at once
      const allReactions = await api.getReactions(messageIds);
      
      const reactionsList: Reaction[] = allReactions.map((r: any) => ({
        id: r.id,
        message_id: r.message_id,
        user_id: r.user_id,
        emoji: r.emoji,
        created_at: r.created_at,
      }));

      const grouped = reactionsList.reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
        return acc;
      }, {} as Record<string, Reaction[]>);

      setReactions(grouped);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [messageIds.join(',')]);

  useEffect(() => {
    fetchReactions();

    // Poll for reaction changes (since we don't have real-time subscriptions with local backend)
    const interval = setInterval(fetchReactions, 3000);
    return () => clearInterval(interval);
  }, [fetchReactions]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    try {
      await api.addReaction(messageId, user.id, emoji);
      // Refresh reactions after adding
      setTimeout(() => fetchReactions(), 100);
      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }, [user, fetchReactions]);

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    try {
      await api.removeReaction(messageId, user.id, emoji);
      // Refresh reactions after removing
      setTimeout(() => fetchReactions(), 100);
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }, [user, fetchReactions]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    const messageReactions = reactions[messageId] || [];
    const hasReacted = messageReactions.some(r => r.user_id === user.id && r.emoji === emoji);

    if (hasReacted) {
      return removeReaction(messageId, emoji);
    } else {
      return addReaction(messageId, emoji);
    }
  }, [user, reactions, addReaction, removeReaction]);

  const getReactionGroups = useCallback((messageId: string): ReactionGroup[] => {
    const messageReactions = reactions[messageId] || [];
    const grouped = messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [], hasReacted: false };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user_id);
      if (user && reaction.user_id === user.id) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {} as Record<string, ReactionGroup>);

    return Object.values(grouped);
  }, [reactions, user]);

  return { reactions, loading, addReaction, removeReaction, toggleReaction, getReactionGroups };
}

export function useSideThreadMessageReactions(messageIds: string[]) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    if (messageIds.length === 0) {
      setReactions({});
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('side_thread_message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;

      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
        return acc;
      }, {} as Record<string, Reaction[]>);

      setReactions(grouped);
    } catch (error) {
      console.error('Error fetching side thread reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [messageIds.join(',')]);

  useEffect(() => {
    fetchReactions();

    const channel = supabase
      .channel('side_thread_message_reactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'side_thread_message_reactions',
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReactions]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    const messageReactions = reactions[messageId] || [];
    const hasReacted = messageReactions.some(r => r.user_id === user.id && r.emoji === emoji);

    try {
      if (hasReacted) {
        const { error } = await supabase
          .from('side_thread_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('side_thread_message_reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji });
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  }, [user, reactions]);

  const getReactionGroups = useCallback((messageId: string): ReactionGroup[] => {
    const messageReactions = reactions[messageId] || [];
    const grouped = messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [], hasReacted: false };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user_id);
      if (user && reaction.user_id === user.id) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {} as Record<string, ReactionGroup>);

    return Object.values(grouped);
  }, [reactions, user]);

  return { reactions, loading, toggleReaction, getReactionGroups };
}
