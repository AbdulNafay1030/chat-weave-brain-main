import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { isSameDay, format } from 'date-fns';
import { Group, Message, User, PrivateThread } from '@/types/sidechat';
import { Button } from '@/components/ui/button';
import { Users, MessageSquarePlus, Hash, UserPlus, Lock, Trash2, User as UserIcon, Pin, Search, Pencil, ChevronDown, Link, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';
import InviteMemberModal from './InviteMemberModal';
import TypingIndicator from './TypingIndicator';
import MessageSearch from './MessageSearch';
import ForwardMessageModal from './ForwardMessageModal';
import DateSeparator from './DateSeparator';
import EditNameModal from './EditNameModal';
import MemberListModal from './MemberListModal';
import SystemMessage from './SystemMessage';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageReactions } from '@/hooks/useReactions';
import { useMessageReadReceipts } from '@/hooks/useReadReceipts';
import { usePresence } from '@/hooks/usePresence';
import { useLastSeen } from '@/hooks/useLastSeen';
import { useSystemEvents } from '@/hooks/useSystemEvents';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SideThreadItem {
  id: string;
  name: string;
  is_active: boolean;
  created_by: string;
}

interface GroupChatProps {
  group: Group;
  messages: (Message & { is_pinned?: boolean })[];
  users: User[];
  currentUserId: string;
  onSendMessage: (content: string, replyToId?: string | null, file?: { url: string; name: string; type: string; size: number } | null) => void;
  onStartThread: () => void;
  onReplyPrivately?: (message: Message) => void;
  onEditMessage?: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onTogglePin?: (messageId: string) => Promise<boolean>;
  activeThread?: PrivateThread | null;
  groupId?: string;
  sideThreads?: SideThreadItem[];
  onSelectThread?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onForwardMessage?: (content: string, targetId: string, targetType: 'group' | 'thread') => Promise<void>;
  allGroups?: { id: string; name: string }[];
  onEditGroupName?: (newName: string) => Promise<void>;
  onEditThreadName?: (threadId: string, newName: string) => Promise<boolean>;
  isGroupOwner?: boolean;
  onAskAI?: (content: string, file?: { url: string; name: string; type: string; size: number } | null) => Promise<void>;
  isAILoading?: boolean;
  streamingAIContent?: string | null;
}

const GroupChat = ({
  group,
  messages,
  users,
  currentUserId,
  onSendMessage,
  onStartThread,
  onEditMessage,
  onDeleteMessage,
  onTogglePin,
  activeThread,
  groupId,
  sideThreads = [],
  onSelectThread,
  onDeleteThread,
  onForwardMessage,
  allGroups = [],
  onEditGroupName,
  onEditThreadName,
  isGroupOwner = false,
  onAskAI,
  isAILoading = false,
  streamingAIContent,
  onReplyPrivately,
  initialReply,
  onClearInitialReply
}: GroupChatProps & { initialReply?: Message | null; onClearInitialReply?: () => void }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);

  useEffect(() => {
    if (initialReply) {
      setReplyTo(initialReply);
      onClearInitialReply?.();
    }
  }, [initialReply, onClearInitialReply]);

  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<{ id: string; name: string } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Typing indicator
  const currentUserName = profile?.full_name || 'You';
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    groupId ? `group:${groupId}` : '',
    currentUserName
  );

  // Reactions
  const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
  const { toggleReaction, getReactionGroups } = useMessageReactions(messageIds);

  // Read receipts
  const { markAsRead, getReadBy } = useMessageReadReceipts(messageIds);

  // Presence tracking
  const { isOnline } = usePresence(groupId ? `group:${groupId}` : '');
  const { getLastSeen } = useLastSeen(groupId ? `group:${groupId}` : '');

  // System events (thread creation, member join/leave)
  const { events: systemEvents } = useSystemEvents(groupId, currentUserId);

  // Pinned messages
  const pinnedMessages = useMemo(() => messages.filter(m => m.is_pinned), [messages]);

  // Message lookup for replies
  const messageMap = useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach(m => map.set(m.id, m));
    return map;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if user is near the bottom of the chat
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 150; // pixels from bottom
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    return (scrollHeight - scrollTop - clientHeight) < threshold;
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const element = messagesContainerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      element.classList.add('bg-primary/20');
      setTimeout(() => {
        element.classList.remove('bg-primary/20');
      }, 2000);
    }
  }, []);

  // Only auto-scroll if user is near the bottom
  useEffect(() => {
    // Only scroll if user is already near the bottom (not scrolled up)
    if (isNearBottom()) {
      scrollToBottom();
    }
  }, [messages, isNearBottom]);

  // Mark messages as read when visible
  useEffect(() => {
    if (!messages.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              markAsRead(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const container = messagesContainerRef.current;
    if (container) {
      container.querySelectorAll('[data-message-id]').forEach((el) => {
        observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, [messages, markAsRead]);

  const getUserById = (userId: string) => users.find((u) => u.id === userId);
  const getCreatorName = (createdBy: string) => {
    const creator = getUserById(createdBy);
    return creator?.name || 'Unknown';
  };

  const handleDeleteClick = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    setThreadToDelete(threadId);
  };

  const confirmDelete = () => {
    if (threadToDelete && onDeleteThread) {
      onDeleteThread(threadToDelete);
    }
    setThreadToDelete(null);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleForward = (message: Message) => {
    setMessageToForward(message);
  };

  const handleForwardSubmit = async (targetId: string, targetType: 'group' | 'thread') => {
    if (messageToForward && onForwardMessage) {
      await onForwardMessage(messageToForward.content, targetId, targetType);
    }
  };

  const handleSendMessage = (content: string, file?: { url: string; name: string; type: string; size: number } | null) => {
    onSendMessage(content, replyTo?.id || null, file);
    setReplyTo(null);
  };

  const creatorName = "Abdul Nafay"; // Ideally fetched from group metadata, hardcoded for demo as per screenshot
  const creationTime = format(new Date(), 'h:mm a');

  const getHeaderName = () => {
    if (group.type === 'dm') {
      const otherMember = group.members.find(m => m.id !== currentUserId);
      return otherMember ? otherMember.name : "Private Chat";
    }
    return group.name;
  };


  const handleSummarize = useCallback(async () => {
    if (!groupId || !messages.length) {
      toast({
        title: 'No messages',
        description: 'There are no messages to summarize.',
      });
      return;
    }
    
    setIsSummarizing(true);
    setSummary(null);

    try {
      // Use all messages for summarization (not just unread)
      // Limit to last 100 messages to avoid token limits
      const messagesToSummarize = messages.slice(-100);

      // Build context from messages
      const context = messagesToSummarize.map((m) => {
        const msgUser = getUserById(m.userId);
        const timestamp = format(new Date(m.createdAt), 'MMM d, h:mm a');
        return `[${timestamp}] ${msgUser?.name || 'Unknown'}: ${m.content}`;
      }).join('\n');

      // Call AI to summarize
      const prompt = `Summarize the following group chat messages into key discussion points. Format the summary as numbered points (1., 2., 3., etc.). Do not include sources or citations. Keep it concise but informative.\n\n${context}`;
      
      const response = await api.askAI(prompt);
      
      // Handle undefined or null response
      if (!response || !response.content) {
        throw new Error('Invalid response from AI service');
      }
      
      // Remove sources section if present (backend may add it)
      let summaryContent = response.content || '';
      // Remove "Sources:" section at the end
      const sourcesIndex = summaryContent.indexOf('\n\n**Sources:**');
      if (sourcesIndex !== -1) {
        summaryContent = summaryContent.substring(0, sourcesIndex);
      }
      // Also check for other source patterns
      summaryContent = summaryContent.replace(/\n\n\*\*Sources?:\*\*[\s\S]*$/i, '');
      summaryContent = summaryContent.replace(/\n\nSources?:[\s\S]*$/i, '');
      
      setSummary(summaryContent);
    } catch (error) {
      console.error('Error summarizing:', error);
      toast({
        title: 'Summarization failed',
        description: error instanceof Error ? error.message : 'Failed to summarize messages. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  }, [groupId, messages, getUserById, toast]);

  return (
    <div className="flex-1 flex flex-col bg-background h-full font-sans">
      {/* Header - Clean Minimal */}
      <div className="flex items-center justify-between px-6 py-3 bg-transparent">
        <button className="flex items-center gap-2 text-foreground/80 hover:bg-secondary/50 px-2 py-1.5 rounded-lg transition-colors group">
          <span className="text-lg font-medium text-foreground">{getHeaderName()}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsMembersModalOpen(true)} className="text-muted-foreground hover:text-foreground" title="View Members">
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} className="text-muted-foreground hover:text-foreground" title="Search Messages">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Summary Display */}
      {summary && (
        <div className="px-6 py-4 border-b border-border bg-primary/5">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5" />
            <h3 className="font-semibold text-sm">Chat Summary</h3>
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
            {summary.split('\n').map((line, idx) => {
              // Handle numbered points (1., 2., 3., etc.)
              const trimmedLine = line.trim();
              const isNumberedPoint = /^\d+\.\s/.test(trimmedLine);
              
              return (
                <p key={idx} className={isNumberedPoint ? 'pl-0' : trimmedLine.startsWith('•') || trimmedLine.startsWith('-') ? 'pl-2' : ''}>
                  {line || '\u00A0'}
                </p>
              );
            })}
          </div>
          <Button
            onClick={() => setSummary(null)}
            variant="ghost"
            size="sm"
            className="mt-2 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Messages or Empty State */}
      <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground">Today {creationTime}</p>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{creatorName}</span> created the group chat.
              </p>
              <p className="text-xs text-muted-foreground/80">
                Your personal ChatGPT memory is never used in group chats.
              </p>

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="rounded-full h-8 px-4 text-xs font-medium border-border/60 hover:bg-secondary/50"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  Invite with link
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {/* Sort messages: pinned first, then by date */}
            {(() => {
              const sortedMessages = [...messages].sort((a, b) => {
                // Pinned messages first
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // Then by date (oldest first)
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              });
              
              return sortedMessages.map((message, index) => {
                const replyToMessage = message.replyToId ? messageMap.get(message.replyToId) : null;
                const messageDate = new Date(message.createdAt);
                const previousMessage = index > 0 ? sortedMessages[index - 1] : null;
                const previousDate = previousMessage ? new Date(previousMessage.createdAt) : null;
                const showDateSeparator = !previousDate || !isSameDay(messageDate, previousDate);

              return (
                <div key={message.id}>
                  {showDateSeparator && <DateSeparator date={messageDate} />}
                  <div data-message-id={message.id}>
                    <ChatMessage
                      message={{ ...message, is_pinned: message.isPinned }}
                      user={getUserById(message.userId)}
                      isOwn={message.userId === currentUserId}
                      isUserOnline={isOnline(message.userId)}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      onReplyPrivately={onReplyPrivately}
                      onTogglePin={onTogglePin}
                      onReply={handleReply}
                      onForward={onForwardMessage ? handleForward : undefined}
                      reactions={getReactionGroups(message.id)}
                      onToggleReaction={handleToggleReaction}
                      readBy={getReadBy(message.id)}
                      users={users}
                      totalMembers={group.members.length}
                      replyToMessage={replyToMessage}
                    />
                  </div>
                </div>
              );
            });
            })()}

            {/* Streaming AI Message */}
            {isAILoading && streamingAIContent && (
              <div key="streaming-ai">
                <ChatMessage
                  message={{
                    id: 'streaming-ai',
                    groupId: group.id,
                    userId: 'ai-agent',
                    content: streamingAIContent,
                    createdAt: new Date(),
                    isAI: true,
                    isPinned: false
                  }}
                  user={{ id: 'ai-agent', name: 'Sidechat AI', email: 'ai@sidechat.com', status: 'online' }}
                  isOwn={false}
                  isUserOnline={true}
                  users={users}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        onAskAI={group.type === 'dm' ? undefined : onAskAI}
        isAILoading={isAILoading}
        placeholder={group.type === 'dm' ? "Message..." : `Message ${group.name}...`}
        onTyping={startTyping}
        onStopTyping={stopTyping}
        replyTo={replyTo ? { id: replyTo.id, content: replyTo.content, userId: replyTo.userId } : null}
        onCancelReply={() => setReplyTo(null)}
        users={users}
        onSummarize={group.type === 'group' ? handleSummarize : undefined}
        isSummarizing={isSummarizing}
      />

      {/* Invite Modal */}
      {groupId && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={groupId}
          groupName={group.name}
        />
      )}

      {/* Delete Thread Confirmation */}
      <AlertDialog open={!!threadToDelete} onOpenChange={() => setThreadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this private thread and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message Search */}
      {showSearch && (
        <MessageSearch
          messages={messages}
          users={users}
          onClose={() => setShowSearch(false)}
          groupName={group.name}
          scrollToMessage={scrollToMessage}
        />
      )}

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={!!messageToForward}
        onClose={() => setMessageToForward(null)}
        messageContent={messageToForward?.content || ''}
        groups={allGroups}
        threads={sideThreads.map(t => ({ id: t.id, name: t.name, group_id: groupId || '' }))}
        onForward={handleForwardSubmit}
      />

      {/* Member List Modal */}
      <MemberListModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        users={users}
        isOnline={isOnline}
        ownerId={group.ownerId}
      />

      {/* Edit Group Name Modal */}
      <EditNameModal
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        onSave={async (newName) => {
          if (onEditGroupName) {
            await onEditGroupName(newName);
          }
        }}
        currentName={group.name}
        title="Edit Group Name"
        label="Group Name"
      />

      {/* Edit Thread Name Modal */}
      <EditNameModal
        isOpen={!!editingThread}
        onClose={() => setEditingThread(null)}
        onSave={async (newName) => {
          if (editingThread && onEditThreadName) {
            await onEditThreadName(editingThread.id, newName);
          }
        }}
        currentName={editingThread?.name || ''}
        title="Edit Thread Name"
        label="Thread Name"
      />
    </div>
  );
};

export default GroupChat;
