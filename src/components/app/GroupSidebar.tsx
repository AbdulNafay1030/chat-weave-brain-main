import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Group } from '@/types/sidechat';
import { cn } from '@/lib/utils';
import {
  Hash, Plus, Minus, ChevronDown, ChevronRight,
  Search, PenSquare, MoreHorizontal, Trash2, UserPlus, SquarePen, Bell, BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserMenu from './UserMenu';
import SidechatLogo from '@/components/SidechatLogo';
import PendingInvitationsCard from './PendingInvitationsCard';
import { PendingInvitation } from '@/hooks/usePendingInvitations';
import { useToast } from '@/hooks/use-toast';
import { useMuteChat } from '@/hooks/useMuteChat';
import { useUnreadCount } from '@/hooks/useUnreadCount';

interface SideThread {
  id: string;
  name: string;
  is_active: boolean;
  created_by: string;
  group_id: string;
}

interface GroupSidebarProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
  pendingInvitations?: PendingInvitation[];
  onAcceptInvitation?: (token: string) => void;
  invitationsLoading?: boolean;
  sideThreads?: SideThread[];
  activeThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
  onCreateThread?: () => void;
  onDeleteGroup?: (groupId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onRenameGroup?: (groupId: string, currentName: string) => void;
  onRenameThread?: (threadId: string, currentName: string) => void;
  currentUserId: string;
  onCreateDM?: () => void;
  onInviteGroup?: (groupId: string) => void;
}

const GroupSidebar = ({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  pendingInvitations = [],
  onAcceptInvitation,
  invitationsLoading = false,
  sideThreads = [],
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteGroup,
  onDeleteThread,
  onRenameGroup,
  onRenameThread,
  currentUserId,
  onCreateDM,
  onInviteGroup,
}: GroupSidebarProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);
  const [isDMsOpen, setIsDMsOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMuted, toggleMute } = useMuteChat();
  
  // Get all group IDs for unread count calculation
  const allGroupIds = useMemo(() => groups.map(g => g.id), [groups]);
  const { getUnreadCount } = useUnreadCount(allGroupIds);

  const toggleGroupExpand = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getThreadsForGroup = (groupId: string) => {
    return sideThreads.filter(t => t.group_id === groupId);
  };

  const regularGroups = groups.filter(g => g.type !== 'dm');
  const directMessages = groups.filter(g => g.type === 'dm');

  return (
    <div className="w-[260px] h-full bg-sidebar flex flex-col font-sans text-sm border-r border-sidebar-border text-sidebar-foreground">
      {/* Top Header Section */}
      <div className="p-3 pb-0 space-y-4">
        <button
          type="button"
          className="px-2 text-left"
          onClick={() => {
            window.location.href = `${window.location.origin}/`;
          }}
          aria-label="Go to landing page"
        >
          <SidechatLogo size="sm" />
        </button>

        <div className="px-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search Chat"
              className="w-full pl-9 h-9 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && onAcceptInvitation && (
          <div className="mb-4">
            <PendingInvitationsCard
              invitations={pendingInvitations}
              onAccept={onAcceptInvitation}
              loading={invitationsLoading}
            />
          </div>
        )}

        {/* Group Chat Section */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between group">
            <div className="flex-1 flex items-center gap-2 cursor-pointer select-none" onClick={onCreateGroup}>
              <h3 className="text-sm font-semibold text-foreground/90">Group chats</h3>
            </div>
            <div
              className="p-1 cursor-pointer hover:bg-secondary rounded text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setIsGroupsOpen(!isGroupsOpen);
              }}
            >
              {isGroupsOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </div>
          </div>

          <AnimatePresence>
            {isGroupsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-hidden"
              >
                {regularGroups.map((group) => {
                  const groupThreads = getThreadsForGroup(group.id);
                  const isExpanded = expandedGroups.has(group.id);
                  const hasThreads = groupThreads.length > 0;
                  const isActive = activeGroupId === group.id && !activeThreadId;
                  const muted = isMuted(group.id);
                  const unreadCount = getUnreadCount(group.id);

                  return (
                    <div key={group.id}>
                      <motion.div
                        onClick={() => onSelectGroup(group.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 group cursor-pointer relative",
                          isActive
                            ? "bg-[#ececec] text-foreground"
                            : "text-foreground/80 hover:bg-[#ececec]"
                        )}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                          {group.avatar ? (
                            <img src={group.avatar} alt={group.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (() => {
                              const words = group.name.trim().split(/\s+/);
                              if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
                              return group.name.substring(0, 2).toUpperCase();
                            })()
                          )}
                        </div>

                        <span className="truncate flex-1 font-normal text-sm">{group.name}</span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Mute icon */}
                          {muted && (
                            <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          
                          {/* Unread count badge (only show for muted chats) */}
                          {muted && unreadCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}

                          {hasThreads && (
                            <button
                              onClick={(e) => toggleGroupExpand(group.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 rounded text-muted-foreground transition-opacity"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          )}

                          {onDeleteGroup && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {onRenameGroup && (
                                    <DropdownMenuItem onClick={() => onRenameGroup(group.id, group.name)}>
                                      <PenSquare className="w-4 h-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                  )}
                                  {onInviteGroup && (
                                    <DropdownMenuItem onClick={() => onInviteGroup(group.id)}>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Invite People
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => {
                                    toggleMute(group.id);
                                    toast({
                                      title: isMuted(group.id) ? 'Unmuted' : 'Muted',
                                      description: isMuted(group.id) ? `You will receive notifications from ${group.name}` : `${group.name} has been muted`,
                                    });
                                  }}>
                                    {isMuted(group.id) ? (
                                      <>
                                        <Bell className="w-4 h-4 mr-2" />
                                        Unmute
                                      </>
                                    ) : (
                                      <>
                                        <BellOff className="w-4 h-4 mr-2" />
                                        Mute
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDeleteGroup(group.id)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete group
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {isExpanded && hasThreads && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden ml-4 pl-3 border-l border-border/40 mt-1 space-y-0.5"
                          >
                            {groupThreads.map((thread) => (
                              <motion.button
                                key={thread.id}
                                onClick={() => {
                                  onSelectGroup(group.id);
                                  onSelectThread?.(thread.id);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors duration-150 text-xs",
                                  activeThreadId === thread.id
                                    ? "bg-[#ececec] text-foreground"
                                    : "text-muted-foreground hover:bg-[#ececec] hover:text-foreground"
                                )}
                              >
                                <span className="truncate flex-1">{thread.name}</span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Private Chat Section */}
        <div>
          <div className="px-3 mb-2 pt-2 flex items-center justify-between group">
            <div className="flex-1 flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsDMsOpen(!isDMsOpen)}>
              <h3 className="text-sm font-semibold text-foreground/90">Private chats</h3>
            </div>
            <div className="text-muted-foreground mr-1">
              {isDMsOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </div>
          </div>

          <AnimatePresence>
            {isDMsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-hidden"
              >
                {directMessages.map((dm) => {
                  const otherMember = dm.members.find(m => m.id !== currentUserId) || dm.members[0];
                  const isActive = activeGroupId === dm.id;
                  const muted = isMuted(dm.id);
                  const unreadCount = getUnreadCount(dm.id);

                  return (
                    <div key={dm.id}>
                      <motion.div
                        onClick={() => onSelectGroup(dm.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 group cursor-pointer relative",
                          isActive
                            ? "bg-[#ececec] text-foreground"
                            : "text-foreground/80 hover:bg-[#ececec]"
                        )}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="relative">
                          {otherMember?.avatar ? (
                            <img
                              src={otherMember.avatar}
                              alt={otherMember.name}
                              className="w-5 h-5 rounded-full object-cover bg-secondary"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                              {otherMember?.name?.substring(0, 2).toUpperCase() || "??"}
                            </div>
                          )}
                          {otherMember?.status === 'online' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-background rounded-full" />
                          )}
                        </div>
                        <span className="truncate flex-1 font-normal text-sm">{otherMember?.name || "Unknown User"}</span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Mute icon */}
                          {muted && (
                            <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          
                          {/* Unread count badge (only show for muted chats) */}
                          {muted && unreadCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}

                          {onDeleteGroup && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    toggleMute(dm.id);
                                    toast({
                                      title: isMuted(dm.id) ? 'Unmuted' : 'Muted',
                                      description: isMuted(dm.id) ? 'You will receive notifications from this chat' : 'This chat has been muted',
                                    });
                                  }}>
                                    {isMuted(dm.id) ? (
                                      <>
                                        <Bell className="w-4 h-4 mr-2" />
                                        Unmute
                                      </>
                                    ) : (
                                      <>
                                        <BellOff className="w-4 h-4 mr-2" />
                                        Mute
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDeleteGroup(dm.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete chat</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {sideThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => {
                      onSelectGroup(thread.group_id);
                      if (onSelectThread) onSelectThread(thread.id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors font-normal text-sm group cursor-pointer relative",
                      activeThreadId === thread.id
                        ? "bg-[#ececec] text-foreground"
                        : "text-foreground/80 hover:bg-[#ececec]"
                    )}
                  >
                    <span className="truncate flex-1">{thread.name}</span>
                    {onDeleteThread && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onRenameThread && <DropdownMenuItem onClick={() => onRenameThread(thread.id, thread.name)}><PenSquare className="w-4 h-4 mr-2" />Rename</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => onDeleteThread(thread.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete chat</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}

                {directMessages.length === 0 && sideThreads.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground/60 italic">No private chats yet.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer with User Menu */}
      <div className="p-3 mt-auto border-t border-transparent">
        <UserMenu />
      </div>
    </div >
  );
};

export default GroupSidebar;