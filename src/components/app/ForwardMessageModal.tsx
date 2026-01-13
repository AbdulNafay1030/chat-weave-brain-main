import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, Lock, Forward, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForwardTarget {
  id: string;
  name: string;
  type: 'group' | 'thread';
  groupId?: string;
}

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  groups: { id: string; name: string }[];
  threads: { id: string; name: string; group_id: string }[];
  onForward: (targetId: string, targetType: 'group' | 'thread') => Promise<void>;
}

const ForwardMessageModal = ({
  isOpen,
  onClose,
  messageContent,
  groups,
  threads,
  onForward,
}: ForwardMessageModalProps) => {
  const [selectedTarget, setSelectedTarget] = useState<ForwardTarget | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);

  const handleForward = async () => {
    if (!selectedTarget) return;
    
    setIsForwarding(true);
    try {
      await onForward(selectedTarget.id, selectedTarget.type);
      onClose();
    } finally {
      setIsForwarding(false);
      setSelectedTarget(null);
    }
  };

  const handleClose = () => {
    setSelectedTarget(null);
    onClose();
  };

  const targets: ForwardTarget[] = [
    ...groups.map(g => ({ id: g.id, name: g.name, type: 'group' as const })),
    ...threads.map(t => ({ 
      id: t.id, 
      name: t.name, 
      type: 'thread' as const, 
      groupId: t.group_id 
    })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="w-5 h-5" />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        {/* Message Preview */}
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Message to forward:</p>
          <p className="text-sm text-foreground line-clamp-3">{messageContent}</p>
        </div>

        {/* Targets List */}
        <ScrollArea className="h-64">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1 py-2 sticky top-0 bg-background">
              Select destination
            </p>
            
            {/* Groups */}
            {groups.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground px-1 mb-1 uppercase tracking-wider">
                  Groups
                </p>
                {groups.map((group) => (
                  <button
                    key={`group-${group.id}`}
                    onClick={() => setSelectedTarget({ id: group.id, name: group.name, type: 'group' })}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                      selectedTarget?.id === group.id && selectedTarget?.type === 'group'
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1 text-left">
                      {group.name}
                    </span>
                    {selectedTarget?.id === group.id && selectedTarget?.type === 'group' && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Threads */}
            {threads.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground px-1 mb-1 uppercase tracking-wider">
                  Private Threads
                </p>
                {threads.map((thread) => {
                  const parentGroup = groups.find(g => g.id === thread.group_id);
                  return (
                    <button
                      key={`thread-${thread.id}`}
                      onClick={() => setSelectedTarget({ 
                        id: thread.id, 
                        name: thread.name, 
                        type: 'thread',
                        groupId: thread.group_id
                      })}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                        selectedTarget?.id === thread.id && selectedTarget?.type === 'thread'
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{thread.name}</p>
                        {parentGroup && (
                          <p className="text-xs text-muted-foreground">in {parentGroup.name}</p>
                        )}
                      </div>
                      {selectedTarget?.id === thread.id && selectedTarget?.type === 'thread' && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isForwarding}>
            Cancel
          </Button>
          <Button 
            onClick={handleForward} 
            disabled={!selectedTarget || isForwarding}
            className="gap-2"
          >
            {isForwarding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Forwarding...
              </>
            ) : (
              <>
                <Forward className="w-4 h-4" />
                Forward
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageModal;