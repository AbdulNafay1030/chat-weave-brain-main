import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MutedChats {
  [key: string]: boolean; // groupId or threadId -> muted
}

export const useMuteChat = () => {
  const { user } = useAuth();
  const [mutedChats, setMutedChats] = useState<MutedChats>({});

  // Load muted chats from localStorage
  useEffect(() => {
    if (!user) return;
    
    const stored = localStorage.getItem(`muted_chats_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMutedChats(parsed);
      } catch (e) {
        console.error('Failed to parse muted chats:', e);
      }
    }
  }, [user]);

  // Save muted chats to localStorage
  const saveMutedChats = useCallback((chats: MutedChats) => {
    if (!user) return;
    localStorage.setItem(`muted_chats_${user.id}`, JSON.stringify(chats));
    setMutedChats(chats);
  }, [user]);

  const toggleMute = useCallback((chatId: string) => {
    const newMutedChats = { ...mutedChats };
    if (newMutedChats[chatId]) {
      delete newMutedChats[chatId];
    } else {
      newMutedChats[chatId] = true;
    }
    saveMutedChats(newMutedChats);
  }, [mutedChats, saveMutedChats]);

  const isMuted = useCallback((chatId: string) => {
    return mutedChats[chatId] === true;
  }, [mutedChats]);

  return { isMuted, toggleMute };
};
