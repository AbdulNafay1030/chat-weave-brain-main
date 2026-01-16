import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Group, Message } from '@/types/sidechat';
import { useAuth } from '@/contexts/AuthContext';
// import { supabase } from '@/integrations/supabase/client'; // REMOVED
import { api } from '@/services/api';
import { useGroups, useMessages, useGroupMembers } from '@/hooks/useGroups';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useSideThreads, useSideThreadMessages, DbSideThread } from '@/hooks/useSideThreads';
import { useAllSideThreads } from '@/hooks/useAllSideThreads';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import GroupSidebar from './GroupSidebar';
import GroupChat from './GroupChat';
import PrivateThreadPanel from './PrivateThreadPanel';
import CreateThreadModal from './CreateThreadModal';
import CreateGroupModal from './CreateGroupModal';
import RenameModal from './RenameModal';
import InviteGroupModal from './InviteGroupModal';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const AppShell = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Real database hooks
  const { groups: dbGroups, loading: groupsLoading, createGroup: dbCreateGroup, updateGroupName: dbUpdateGroupName, deleteGroup: dbDeleteGroup, refetchGroups } = useGroups();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { messages: dbMessages, sendMessage: dbSendMessage, editMessage: dbEditMessage, deleteMessage: dbDeleteMessage, togglePin: dbTogglePin } = useMessages(activeGroupId);
  const { members: dbMembers } = useGroupMembers(activeGroupId);

  // Pending invitations
  const { invitations: pendingInvitations, acceptInvitation, loading: invitationsLoading } = usePendingInvitations();

  // Side threads from database
  const {
    threads: dbThreads,
    loading: threadsLoading,
    createThread: dbCreateThread,
    deleteThread: dbDeleteThread,
    updateThreadName: dbUpdateThreadName
  } = useSideThreads(activeGroupId);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { messages: threadMessages, sendMessage: sendThreadMessage, editMessage: editThreadMessage, deleteMessage: deleteThreadMessage, togglePin: toggleThreadPin } = useSideThreadMessages(activeThreadId);

  // All threads for sidebar (across all groups)
  const groupIds = useMemo(() => dbGroups.map(g => g.id), [dbGroups]);
  const { threads: allThreads } = useAllSideThreads(groupIds);

  // Notification sound
  const { play: playNotificationSound } = useNotificationSound();
  const prevMessageCount = useRef<number>(0);

  // Create a User object from the authenticated user
  const currentUser: User = useMemo(() => ({
    id: user?.id || 'unknown',
    name: profile?.full_name || user?.name || user?.email?.split('@')[0] || 'You',
    email: user?.email || profile?.email || '',
    avatar: profile?.avatar_url || user?.avatar || undefined,
    status: 'online' as const,
  }), [user, profile]);


  // Convert db groups to Group format
  const groups: Group[] = useMemo(() => {
    return dbGroups.map(g => ({
      ...g,
      id: g.id,
      name: g.name,
      members: g.members || [],
      createdAt: g.createdAt || new Date(),
      ownerId: (g as any).owner_id || g.ownerId,
      type: (g as any).type || 'group', // Preserve type property, default to 'group'
    }));
  }, [dbGroups]);

  // Convert db messages to Message format with replies
  const groupMessages = useMemo(() => {
    const messageMap = new Map(dbMessages.map(m => [m.id, m]));

    return dbMessages.map(m => {
      const replyTo = m.replyToId ? messageMap.get(m.replyToId) : null;
      return {
        id: m.id,
        groupId: m.groupId,
        userId: m.userId,
        content: m.content,
        createdAt: m.createdAt || new Date(),
        isAI: m.isAI,
        threadId: m.threadId,
        isPinned: m.isPinned,
        replyToId: m.replyToId,
        replyTo: replyTo ? {
          id: replyTo.id,
          groupId: replyTo.groupId,
          userId: replyTo.userId,
          content: replyTo.content,
          createdAt: replyTo.createdAt,
        } : undefined,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
        fileSize: m.fileSize,
      };
    });
  }, [dbMessages]);

  // Get active thread object
  const activeThread: DbSideThread | null = useMemo(() => {
    return dbThreads.find(t => t.id === activeThreadId) || null;
  }, [dbThreads, activeThreadId]);

  // Convert thread messages to the format needed by PrivateThreadPanel with replies
  const currentThreadMessages = useMemo(() => {
    const messageMap = new Map(threadMessages.map(m => [m.id, m]));

    return threadMessages.map(m => {
      const replyTo = m.reply_to_id ? messageMap.get(m.reply_to_id) : null;
      return {
        id: m.id,
        threadId: m.side_thread_id,
        userId: m.user_id,
        content: m.content,
        createdAt: new Date(m.created_at),
        isPinned: m.is_pinned,
        replyToId: m.reply_to_id || undefined,
        replyTo: replyTo ? {
          id: replyTo.id,
          threadId: replyTo.side_thread_id,
          userId: replyTo.user_id,
          content: replyTo.content,
          createdAt: new Date(replyTo.created_at),
        } : undefined,
        fileUrl: m.file_url || undefined,
        fileName: m.file_name || undefined,
        fileType: m.file_type || undefined,
        fileSize: m.file_size || undefined,
      };
    });
  }, [threadMessages]);

  // Unread count tracking - must be before useEffects that use it
  const groupIdsForUnread = useMemo(() => groups.map(g => g.id), [groups]);
  const { getUnreadCount, markAsRead } = useUnreadCount(groupIdsForUnread);

  // Set initial active group
  useEffect(() => {
    if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  // Mark messages as read when group is opened
  useEffect(() => {
    if (activeGroupId && !activeThreadId) {
      markAsRead(activeGroupId);
    }
  }, [activeGroupId, activeThreadId, markAsRead]);

  // Play notification sound for new messages
  useEffect(() => {
    if (prevMessageCount.current > 0 && dbMessages.length > prevMessageCount.current) {
      // Check if the new message is from someone else
      const latestMessage = dbMessages[dbMessages.length - 1];
      if (latestMessage && latestMessage.userId !== user?.id) {
        playNotificationSound();
      }
    }
    prevMessageCount.current = dbMessages.length;
  }, [dbMessages, user?.id, playNotificationSound]);

  // Check for pending invite after auth
  useEffect(() => {
    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (pendingInvite && user) {
      sessionStorage.removeItem('pendingInvite');
    }
  }, [user]);

  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSendingToAI, setIsSendingToAI] = useState(false);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [streamingAIContent, setStreamingAIContent] = useState<string | null>(null);

  const [renameData, setRenameData] = useState<{ id: string; type: 'group' | 'thread'; name: string } | null>(null);
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  // Convert db members (from activeGroup) to User objects with proper fallbacks
  const groupUsers = useMemo((): User[] => {
    const rawMembers = activeGroup?.members || [];

    // Basic mapping
    const memberUsers: User[] = rawMembers.map((m: any) => {
      const email = m.email || '';
      const emailName = email ? email.split('@')[0] : '';
      const displayName = m.name || emailName || 'User';

      return {
        id: m.id,
        name: displayName,
        email: email,
        avatar: m.avatar || undefined,
        status: m.status || 'offline',
      };
    });

    const existingCurrentUser = memberUsers.find(u => u.id === currentUser.id);
    if (!existingCurrentUser && activeGroup) {
      memberUsers.push(currentUser);
    } else if (existingCurrentUser) {
      const idx = memberUsers.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        memberUsers[idx] = {
          ...memberUsers[idx],
          name: currentUser.name || memberUsers[idx].name,
          avatar: currentUser.avatar || memberUsers[idx].avatar,
        };
      }
    }

    return memberUsers;
  }, [activeGroup, currentUser]);

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveThreadId(null);
    // Mark messages as read when group is opened
    markAsRead(groupId);
  };

  const handleSelectGroupMobile = (groupId: string) => {
    handleSelectGroup(groupId);
    setIsMobileSidebarOpen(false);
  };

  const handleAcceptInvitation = async (token: string) => {
    const result = await acceptInvitation(token);
    if (result.success) {
      toast({
        title: 'Invitation accepted!',
        description: `You've joined ${result.groupName || 'the group'}`,
      });
      // Refresh groups list to show new group
      await refetchGroups();
      if (result.groupId) {
        setActiveGroupId(result.groupId);
      }
    } else {
      toast({
        title: 'Failed to accept invitation',
        description: result.error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = useCallback(async (
    content: string,
    replyToId?: string | null,
    file?: { url: string; name: string; type: string; size: number } | null
  ) => {
    if (!activeGroupId) return;
    await dbSendMessage(content, false, null, replyToId, file);
  }, [activeGroupId, dbSendMessage]);

  const handleCreateThread = async (name: string, members: User[]) => {
    if (!activeGroupId) return;

    const memberIds = members.map(m => m.id);
    const newThread = await dbCreateThread(name, memberIds);

    if (newThread) {
      setActiveThreadId(newThread.id);
    }
  };

  const handleCreateGroup = async (name: string) => {
    const newGroup = await dbCreateGroup(name);
    if (newGroup) {
      setActiveGroupId(newGroup.id);
    }
  };

  const handleSendThreadMessage = useCallback(async (
    content: string,
    replyToId?: string | null,
    file?: { url: string; name: string; type: string; size: number } | null
  ) => {
    if (!activeThreadId) return;
    await sendThreadMessage(content, replyToId, file);
  }, [activeThreadId, sendThreadMessage]);

  // Forward message handler
  const handleForwardMessage = useCallback(async (
    content: string,
    targetId: string,
    targetType: 'group' | 'thread'
  ) => {
    if (targetType === 'group') {
      await dbSendMessage(`📨 Forwarded message:\n\n${content}`, false, null, null, null);
    } else {
      await sendThreadMessage(`📨 Forwarded message:\n\n${content}`, null, null);
    }
    toast({
      title: 'Message forwarded',
      description: 'The message has been forwarded successfully.',
    });
  }, [dbSendMessage, sendThreadMessage, toast]);

  const handleSendToAI = async () => {
    if (!activeThread || !activeGroupId || currentThreadMessages.length === 0) return;

    setIsSendingToAI(true);

    try {
      // Build thread context with actual user names
      const threadContext = currentThreadMessages.map((m) => {
        const msgUser = groupUsers.find((u) => u.id === m.userId);
        return `${msgUser?.name || 'Unknown'}: ${m.content}`;
      }).join('\n');

      const data = await api.askAI(`Summarize this thread: ${activeThread.name}`, threadContext);
      const aiContent = data.content;

      // Insert AI message to database
      await dbSendMessage(
        `**Summary of "${activeThread.name}":**\n\n${aiContent}`,
        true,
        activeThread.id
      );

      setActiveThreadId(null);

      toast({
        title: 'AI response posted',
        description: 'The AI has analyzed your discussion and shared insights in the main chat.',
      });
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        title: 'AI request failed',
        description: error instanceof Error ? error.message : 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingToAI(false);
    }
  };

  // Handle "Ask AI" in group chat - sends user message + gets AI response (Streaming)
  const handleAskAIInChat = useCallback(async (userMessage: string, file?: { url: string; name: string; type: string; size: number } | null) => {
    if (!activeGroupId || !user) return;

    setIsAskingAI(true);

    try {
      // 1. Post user question
      // 1. Post user question
      await dbSendMessage(
        userMessage,
        false,
        null, // No threadId for main chat AI questions, or maybe generic?
        null,
        file ? { url: file.url, name: file.name, type: file.type, size: file.size } : null
      );

      // 2. Build context
      const recentContext = groupMessages.slice(-15).map((m) => {
        const msgUser = groupUsers.find((u) => u.id === m.userId);
        return `${msgUser?.name || 'Unknown'}: ${m.content}`;
      }).join('\n');

      let aiQuestion = userMessage;
      if (file) {
        aiQuestion += `\n\n[User attached a file: ${file.name} (${file.type})]`;
      }

      // 3. Create a temporary placeholder message for streaming
      const tempId = `temp-ai-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        groupId: activeGroupId,
        userId: 'ai-agent', // Force AI User ID for Left Alignment
        content: '',
        createdAt: new Date(),
        isAI: true,
        // Add required fields
        isPinned: false,
        threadId: null,
        replyToId: null,
        replyTo: undefined,
        fileUrl: undefined,
        fileName: undefined,
        fileType: undefined,
        fileSize: undefined
      };

      // Add to local state immediately so user sees "Sidechat AI" appear
      // Note: We need a way to update this state. Since 'groupMessages' comes from useGroups hook,
      // we might need to manipulate the hook's state or just rely on the final save.
      // Ideally, pass a callback or use a local state overlay.
      // For now, we'll just stream to a variable and save at the end, 
      // BUT to show IT TYPING, we need to update the UI.
      // Since `useGroups` controls `messages`, we can't easily inject a temp message without refactoring useGroups to expose setMessages.
      // A quick hack: We will wait for the stream to finish before showing? NO, user wants streaming.

      // Better approach: We'll accumulate the text in a ref or local state, but we really want it in the message list.
      // Let's rely on the final save for persistence, but for visual feedback, we might need a separate "streamingMessage" state 
      // passed to GroupChat if we can't touch useGroups state.

      // Actually, we can use `api.sendMessage` for the final result.
      // For streaming visual, we can add a `streamingMessage` prop to GroupChat?
      // Let's do that. It's cleaner than hacking the hook.

      let collectedContent = "";

      // We need to expose setStreamingContent to the UI.
      // I'll add a state `streamingAIContent` to AppShell and pass it to GroupChat.

      await api.askAIStream(aiQuestion, recentContext, (chunk) => {
        collectedContent += chunk;
        setStreamingAIContent(collectedContent);
      });

      // 4. Stream finished, save to DB (remove emoji prefix to match ChatGPT style)
      await dbSendMessage(collectedContent, true, null, null, null, 'ai-agent'); // Pass 'ai-agent' as overrideUserId

      setStreamingAIContent(null); // Clear streaming state

      toast({
        title: 'AI responded',
        description: 'The AI has answered your question.',
      });
    } catch (error) {
      console.error('Error asking AI:', error);
      toast({
        title: 'AI request failed',
        description: error instanceof Error ? error.message : 'Failed to get AI response.',
        variant: 'destructive',
      });
      setStreamingAIContent(null);
    } finally {
      setIsAskingAI(false);
    }
  }, [activeGroupId, user, dbSendMessage, groupMessages, groupUsers, toast]);

  const handleCloseThread = () => {
    setActiveThreadId(null);
  };

  const handleDeleteThread = async (threadId: string) => {
    const success = await dbDeleteThread(threadId);
    if (success && activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const success = await dbDeleteGroup(groupId);
    if (success && activeGroupId === groupId) {
      setActiveGroupId(null);
    }
  };

  const [pendingReplyMessage, setPendingReplyMessage] = useState<Message | null>(null);

  const handleReplyPrivately = async (message: Message) => {
    try {
      const dm = await api.createDM(currentUser.id, message.userId);
      await refetchGroups();
      setActiveGroupId(dm.id);
      setActiveThreadId(null);
      setPendingReplyMessage(message);
    } catch (error) {
      console.error('Failed to create private chat:', error);
      toast({
        title: 'Error',
        description: `Failed to create private chat: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };


  // Loading state
  if (groupsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="h-screen flex bg-background overflow-hidden">
        {/* Sidebar */}
        <GroupSidebar
          groups={groups}
          activeGroupId={activeGroupId}
          currentUserId={currentUser.id}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={() => setIsGroupModalOpen(true)}
          pendingInvitations={pendingInvitations}
          onAcceptInvitation={handleAcceptInvitation}
          invitationsLoading={invitationsLoading}
          sideThreads={allThreads.map(t => ({ ...t, group_id: t.group_id }))}
          activeThreadId={activeThreadId}
          onSelectThread={(threadId) => {
            const thread = allThreads.find(t => t.id === threadId);
            if (thread) {
              setActiveGroupId(thread.group_id);
              setActiveThreadId(threadId);
            }
          }}
        />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              No groups yet
            </h2>
            <p className="text-muted-foreground">Click the + button to create a group</p>
          </div>
        </div>


        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onCreate={(name) => handleCreateGroup(name)}
          availableMembers={[currentUser]}
          currentUser={currentUser}
        />
      </div>
    );
  }

  // Convert activeThread to the format expected by PrivateThreadPanel
  const activeThreadForPanel = activeThread ? {
    id: activeThread.id,
    groupId: activeThread.group_id,
    name: activeThread.name,
    members: groupUsers,
    createdAt: new Date(activeThread.created_at),
    isActive: activeThread.is_active,
  } : null;


  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex">
        <GroupSidebar
          groups={groups}
          currentUserId={currentUser.id}
          activeGroupId={activeGroupId}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={() => setIsGroupModalOpen(true)}
          pendingInvitations={pendingInvitations}
          onAcceptInvitation={handleAcceptInvitation}
          invitationsLoading={invitationsLoading}
          sideThreads={dbThreads}
          activeThreadId={activeThreadId}
          onSelectThread={(threadId) => {
            setActiveThreadId(threadId);
          }}
          onDeleteThread={handleDeleteThread}
          onDeleteGroup={handleDeleteGroup}
          onRenameGroup={(id, name) => setRenameData({ id, type: 'group', name })}
          onRenameThread={(id, name) => setRenameData({ id, type: 'thread', name })}
          onInviteGroup={(groupId) => setInviteGroupId(groupId)}
          onCreateThread={async () => {
            if (dbCreateThread) {
              try {
                const newThread = await dbCreateThread("New Chat", []);
                if (newThread) {
                  setActiveThreadId(newThread.id);
                  // setIsThreadOpen(true); // If this state exists, assume logic handles switching
                }
              } catch (e) {
                console.error("Failed to create thread", e);
              }
            }
          }}
        />
      </div>

      {/* Sidebar (mobile) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[260px]">
          <GroupSidebar
            groups={groups}
            currentUserId={currentUser.id}
            activeGroupId={activeGroupId}
            onSelectGroup={handleSelectGroupMobile}
            onCreateGroup={() => setIsGroupModalOpen(true)}
            pendingInvitations={pendingInvitations}
            onAcceptInvitation={handleAcceptInvitation}
            invitationsLoading={invitationsLoading}
            sideThreads={dbThreads}
            activeThreadId={activeThreadId}
            onSelectThread={(threadId) => {
              setActiveThreadId(threadId);
              setIsMobileSidebarOpen(false);
            }}
            onDeleteThread={handleDeleteThread}
            onDeleteGroup={handleDeleteGroup}
            onRenameGroup={(id, name) => setRenameData({ id, type: 'group', name })}
            onRenameThread={(id, name) => setRenameData({ id, type: 'thread', name })}
            onInviteGroup={(groupId) => setInviteGroupId(groupId)}
            onCreateThread={async () => {
              if (dbCreateThread) {
                try {
                  const newThread = await dbCreateThread("New Chat", []);
                  if (newThread) {
                    setActiveThreadId(newThread.id);
                    setIsMobileSidebarOpen(false);
                  }
                } catch (e) {
                  console.error("Failed to create thread", e);
                }
              }
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat */}
      <GroupChat
        group={activeGroup}
        messages={groupMessages}
        users={groupUsers}
        currentUserId={currentUser.id}
        onSendMessage={handleSendMessage}
        onStartThread={() => setIsThreadModalOpen(true)}
        onEditMessage={dbEditMessage}
        onDeleteMessage={dbDeleteMessage}
        onTogglePin={dbTogglePin}
        activeThread={activeThreadForPanel}
        groupId={activeGroupId || undefined}
        sideThreads={dbThreads}
        onSelectThread={(threadId) => setActiveThreadId(threadId)}
        onDeleteThread={handleDeleteThread}
        onForwardMessage={handleForwardMessage}
        allGroups={groups.map(g => ({ id: g.id, name: g.name }))}
        onEditGroupName={async (newName) => {
          if (activeGroupId) {
            await dbUpdateGroupName(activeGroupId, newName);
          }
        }}
        onEditThreadName={dbUpdateThreadName}
        isGroupOwner={activeGroup?.id ? dbGroups.find(g => g.id === activeGroup.id)?.ownerId === currentUser.id : false}
        onAskAI={handleAskAIInChat}
        isAILoading={isAskingAI}

        streamingAIContent={streamingAIContent}
        onReplyPrivately={handleReplyPrivately}
        initialReply={pendingReplyMessage}
        onClearInitialReply={() => setPendingReplyMessage(null)}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Private Thread Panel */}
      <AnimatePresence>
        {activeThreadForPanel && (
          <PrivateThreadPanel
            thread={activeThreadForPanel}
            messages={currentThreadMessages}
            users={groupUsers}
            currentUserId={currentUser.id}
            onClose={handleCloseThread}
            onSendMessage={handleSendThreadMessage}
            onSendToAI={handleSendToAI}
            onEditMessage={editThreadMessage}
            onDeleteMessage={deleteThreadMessage}
            onTogglePin={toggleThreadPin}
            isSendingToAI={isSendingToAI}
          />
        )}
      </AnimatePresence>


      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={isThreadModalOpen}
        onClose={() => setIsThreadModalOpen(false)}
        onCreate={handleCreateThread}
        availableMembers={groupUsers}
        currentUser={currentUser}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreate={(name) => handleCreateGroup(name)}
        availableMembers={[currentUser]}
        currentUser={currentUser}
      />

      {/* Rename Modal */}
      {renameData && (
        <RenameModal
          isOpen={!!renameData}
          onClose={() => setRenameData(null)}
          onRename={async (newName) => {
            if (renameData.type === 'group') {
              await dbUpdateGroupName(renameData.id, newName);
            } else {
              await dbUpdateThreadName(renameData.id, newName);
            }
            setRenameData(null);
          }}
          currentName={renameData.name}
          title={renameData.type === 'group' ? "Rename Group" : "Rename Chat"}
        />
      )}

      {/* Invite Group Modal */}
      <InviteGroupModal
        isOpen={!!inviteGroupId}
        onClose={() => setInviteGroupId(null)}
        groupId={inviteGroupId}
        userId={currentUser.id}
        groupName={groups.find(g => g.id === inviteGroupId)?.name}
        onInviteSent={() => {
          refetchGroups();
        }}
      />
    </div>
  );
};

export default AppShell;
