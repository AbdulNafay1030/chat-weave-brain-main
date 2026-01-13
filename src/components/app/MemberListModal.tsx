import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/types/sidechat';
import UserAvatar from './UserAvatar';

interface MemberListModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    isOnline: (userId: string) => boolean;
    ownerId?: string;
}

const MemberListModal = ({ isOpen, onClose, users, isOnline, ownerId }: MemberListModalProps) => {
    // Sort users: Online first, then alphabetical
    const sortedUsers = [...users].sort((a, b) => {
        const aOnline = isOnline(a.id);
        const bOnline = isOnline(b.id);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Group Members ({users.length})</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] mt-4 pr-4">
                    <div className="space-y-4">
                        {sortedUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <UserAvatar user={user} size="sm" />
                                        {isOnline(user.id) && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium leading-none">
                                            {user.name}
                                            {user.id === 'ai-agent' && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary">Bot</span>}
                                            {user.id === ownerId && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-[10px] text-yellow-600 border border-yellow-200">Admin</span>}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-0.5">{user.email}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {isOnline(user.id) ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default MemberListModal;
