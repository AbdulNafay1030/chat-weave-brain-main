import { useState, useMemo } from 'react';
import { Search, X, Hash, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message, User } from '@/types/sidechat';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageSearchProps {
  messages: Message[];
  users: User[];
  onClose: () => void;
  onMessageClick?: (messageId: string) => void;
  groupName?: string;
  scrollToMessage?: (messageId: string) => void;
}

const MessageSearch = ({ 
  messages, 
  users, 
  onClose, 
  onMessageClick,
  groupName,
  scrollToMessage 
}: MessageSearchProps) => {
  const [query, setQuery] = useState('');

  const handleMessageClick = (messageId: string) => {
    onMessageClick?.(messageId);
    scrollToMessage?.(messageId);
    onClose();
  };

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  const filteredMessages = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return messages
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .slice(0, 50) // Limit results
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, query]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search messages in ${groupName || 'chat'}...`}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!query.trim() ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Start typing to search messages
              </p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No messages found for "{query}"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-4">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
              </p>
              {filteredMessages.map((message) => {
                const user = getUserById(message.userId);
                const isThread = !!message.threadId;
                
                return (
                  <button
                    key={message.id}
                    onClick={() => handleMessageClick(message.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      {isThread ? (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Hash className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-2">
                      {highlightMatch(message.content, query)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageSearch;