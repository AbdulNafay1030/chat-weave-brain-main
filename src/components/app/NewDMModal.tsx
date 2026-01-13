import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserPlus } from 'lucide-react';
import { api, User } from '@/services/api';
import UserAvatar from './UserAvatar';

interface NewDMModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (userId: string) => void;
    currentUserId: string;
}

const NewDMModal = ({ isOpen, onClose, onSelectUser, currentUserId }: NewDMModalProps) => {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async (q?: string) => {
        setLoading(true);
        try {
            const res = await api.getUsers(q);
            setUsers(res.filter(u => u.id !== currentUserId));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) loadUsers(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Private Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No users found.
                            </div>
                        ) : (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => onSelectUser(user.id)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserAvatar user={user} size="sm" showStatus />
                                        <div className="text-left">
                                            <div className="text-sm font-medium">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                    <UserPlus className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewDMModal;
