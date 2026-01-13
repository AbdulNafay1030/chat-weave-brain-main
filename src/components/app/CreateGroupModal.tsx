import { useState } from 'react';
import { User } from '@/types/sidechat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Users } from 'lucide-react';
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

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, members: User[]) => void;
  availableMembers: User[];
  currentUser: User;
}

const CreateGroupModal = ({
  isOpen,
  onClose,
  onCreate,
  availableMembers,
  currentUser,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState('');
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
    if (groupName.trim() && selectedMembers.length >= 1) {
      onCreate(groupName.trim(), selectedMembers);
      setGroupName('');
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
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display">Create New Group</DialogTitle>
              <DialogDescription>Start a new group chat with your team</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 py-2">
          {/* Group Name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Group Name
            </label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Product Team"
              className="w-full"
            />
          </div>

          {/* Members */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Add Members ({selectedMembers.length} selected)
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
            disabled={!groupName.trim()}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
