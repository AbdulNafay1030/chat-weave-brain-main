import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, Search, UserPlus, X, Send, Mail } from 'lucide-react';
import { api } from '@/services/api';
import { User } from '@/types/sidechat';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';

interface InviteGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string | null;
    userId: string;
    groupName?: string;
    onInviteSent?: () => void;
}

const InviteGroupModal = ({ isOpen, onClose, groupId, userId, groupName, onInviteSent }: InviteGroupModalProps) => {
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [emailList, setEmailList] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'link' | 'users' | 'email'>('users');
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (isOpen && groupId) {
            generateLink();
        } else {
            setLink('');
            setCopied(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
            setEmailInput('');
            setEmailList([]);
            setActiveTab('users');
        }
    }, [isOpen, groupId]);

    // Search users
    const searchUsers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        
        setSearching(true);
        try {
            const apiUsers = await api.getUsers(query);
            // Map API User to sidechat User format
            const users: User[] = apiUsers.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                avatar: u.avatar,
                status: u.status || 'offline'
            }));
            // Filter out current user and already selected users
            const filtered = users.filter(
                u => u.id !== currentUser?.id && !selectedUsers.find(su => su.id === u.id)
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error('Error searching users:', error);
            // Don't show error toast for empty results, only for actual errors
            if (query.trim().length > 0) {
                toast({
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'Failed to search users. Please try again.',
                    variant: 'destructive'
                });
            }
        } finally {
            setSearching(false);
        }
    }, [currentUser?.id, selectedUsers, toast]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, searchUsers]);

    const generateLink = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await api.createInvitation(groupId, userId);
            const fullLink = `${window.location.origin}/invite/${data.token}`;
            setLink(fullLink);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to generate invite link",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Copied!",
            description: "Invite link copied to clipboard",
        });
    };

    const addUser = (user: User) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const removeUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    const sendInvitations = async () => {
        if (!groupId || (selectedUsers.length === 0 && emailList.length === 0) || !currentUser) return;

        setSending(true);
        try {
            const inviteMessage = `👋 You've been invited to join "${groupName || 'the group'}"!\n\nClick here to join: ${link}`;
            let successCount = 0;
            let errorCount = 0;

            // Send to selected users via DM
            for (const targetUser of selectedUsers) {
                try {
                    // Create or get existing DM
                    const dm = await api.createDM(currentUser.id, targetUser.id);
                    
                    // Send invitation message
                    await api.sendMessage(inviteMessage, currentUser.id, dm.id, false);
                    successCount++;
                } catch (error) {
                    console.error(`Error sending invitation to ${targetUser.name}:`, error);
                    errorCount++;
                }
            }

            // Send to email addresses via backend
            if (emailList.length > 0) {
                try {
                    await sendEmailInvitation(emailList);
                    successCount += emailList.length;
                } catch (error) {
                    console.error('Error sending email invitations:', error);
                    errorCount += emailList.length;
                }
            }

            if (successCount > 0) {
                toast({
                    title: "Invitations sent!",
                    description: `Sent ${successCount} invitation(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
                    duration: 10000, // 10 seconds instead of default 4-5 seconds
                });
            }

            setSelectedUsers([]);
            setEmailList([]);
            if (onInviteSent) {
                onInviteSent();
            }
        } catch (error) {
            console.error('Error sending invitations:', error);
            toast({
                title: "Error",
                description: "Failed to send some invitations",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const sendEmailInvitation = async (emails: string[]) => {
        if (!link || emails.length === 0) return;
        
        const subject = `Join ${groupName || 'the group'}`;
        const body = `Hey!\n\nI'd like to invite you to join "${groupName || 'the group'}" on our platform.\n\nClick here to join: ${link}\n\nLooking forward to chatting with you!`;
        
        try {
            const result = await api.sendInvitationEmail(emails, subject, body, link);
            
            if (result.sent > 0) {
                toast({
                    title: "Emails sent!",
                    description: `Successfully sent ${result.sent} invitation email(s)`,
                    duration: 15000, // 15 seconds - stays visible longer
                });
            }
            
            // Show errors if any
            const errors = result.results.filter(r => r.status === 'error');
            if (errors.length > 0) {
                const errorMessages = errors.map(e => e.error || 'Unknown error').join(', ');
                const isDomainError = errorMessages.includes('403') || errorMessages.toLowerCase().includes('domain');
                
                toast({
                    title: "Email sending failed",
                    description: isDomainError 
                        ? "Domain verification required. Please verify your domain in Resend dashboard to send real emails."
                        : `Failed to send ${errors.length} email(s): ${errorMessages}`,
                    variant: "destructive",
                    duration: 20000, // 20 seconds for important error messages
                });
            }
        } catch (error) {
            console.error('Error sending emails:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to send emails",
                variant: "destructive"
            });
        }
    };

    const addEmail = () => {
        const email = emailInput.trim().toLowerCase();
        if (!email) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: 'Invalid email',
                description: 'Please enter a valid email address',
                variant: 'destructive'
            });
            return;
        }

        if (emailList.includes(email)) {
            toast({
                title: 'Email already added',
                description: 'This email is already in the list',
            });
            return;
        }

        setEmailList([...emailList, email]);
        setEmailInput('');
    };

    const removeEmail = (email: string) => {
        setEmailList(emailList.filter(e => e !== email));
    };

    const handleEmailKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEmail();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Invite People</DialogTitle>
                    <DialogDescription>
                        Send invitations directly to users or share the link.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex gap-2 border-b mb-4">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'users'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <UserPlus className="w-4 h-4 inline mr-2" />
                        Send to Users
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'email'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                    </button>
                    <button
                        onClick={() => setActiveTab('link')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'link'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Copy className="w-4 h-4 inline mr-2" />
                        Copy Link
                    </button>
                </div>

                {activeTab === 'users' ? (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                            {searching && (
                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        {/* Search Results */}
                        {searchQuery && searchResults.length > 0 && (
                            <div className="border rounded-lg max-h-48 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => addUser(user)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                                    >
                                        <UserAvatar user={user} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <UserPlus className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchQuery && !searching && searchResults.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                        )}

                        {/* Selected Users */}
                        {(selectedUsers.length > 0 || emailList.length > 0) && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Selected ({selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}, {emailList.length} email{emailList.length !== 1 ? 's' : ''})
                                </p>
                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full"
                                            >
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        user.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-sm">{user.name}</span>
                                                <button
                                                    onClick={() => removeUser(user.id)}
                                                    className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3 text-muted-foreground" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {emailList.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {emailList.map((email) => (
                                            <div
                                                key={email}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full"
                                            >
                                                <Mail className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm">{email}</span>
                                                <button
                                                    onClick={() => removeEmail(email)}
                                                    className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3 text-muted-foreground" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Button
                                    onClick={sendInvitations}
                                    disabled={sending || !link || (selectedUsers.length === 0 && emailList.length === 0)}
                                    className="w-full"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Invitations
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {!searchQuery && selectedUsers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Search for users to invite them directly
                            </p>
                        )}
                    </div>
                ) : activeTab === 'email' ? (
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="Enter email address..."
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyPress={handleEmailKeyPress}
                                className="flex-1"
                            />
                            <Button onClick={addEmail} disabled={!emailInput.trim()}>
                                Add
                            </Button>
                        </div>

                        {/* Email List */}
                        {emailList.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Email Addresses ({emailList.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {emailList.map((email) => (
                                        <div
                                            key={email}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full"
                                        >
                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-sm">{email}</span>
                                            <button
                                                onClick={() => removeEmail(email)}
                                                className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={sendInvitations}
                                    disabled={sending || !link}
                                    className="w-full"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Send Email Invitations
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {emailList.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Add email addresses to send invitations via email
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        {loading ? (
                            <div className="w-full flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <div className="grid flex-1 gap-2">
                                    <Input
                                        id="link"
                                        defaultValue={link}
                                        readOnly
                                        className="w-full text-sm"
                                    />
                                </div>
                                <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                                    <span className="sr-only">Copy</span>
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default InviteGroupModal;
