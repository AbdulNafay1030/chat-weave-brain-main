import { useState } from 'react';
import { User } from '@/types/sidechat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Lock } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, members: User[]) => void;
  availableMembers: User[];
  currentUser: User;
}

const CreateThreadModal = ({
  isOpen,
  onClose,
  onCreate,
  availableMembers,
  currentUser,
}: CreateThreadModalProps) => {
  const [threadName, setThreadName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([currentUser]);

  const toggleMember = (member: User) => {
    if (member.id === currentUser.id) return; // Can't remove self
    
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member]
    );
  };

  const handleCreate = () => {
    if (threadName.trim() && selectedMembers.length >= 1) {
      onCreate(threadName.trim(), selectedMembers);
      setThreadName('');
      setSelectedMembers([currentUser]);
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display">Start Private Thread</DialogTitle>
              <DialogDescription>Human-only brainstorm</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 py-2">
          {/* Thread Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Thread Name
            </label>
            <Input
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              placeholder="e.g., Feature Brainstorm"
              className="w-full"
            />
          </div>

          {/* Members */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Select Members ({selectedMembers.length} selected)
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableMembers.map((member) => {
                const isSelected = selectedMembers.some((m) => m.id === member.id);
                const isSelf = member.id === currentUser.id;

                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member)}
                    disabled={isSelf}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-secondary/50 hover:bg-secondary border border-transparent",
                      isSelf && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <UserAvatar user={member} size="sm" showStatus />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">
                        {member.name}
                        {isSelf && <span className="text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!threadName.trim() || selectedMembers.length < 1}
          >
            Create Thread
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateThreadModal;
