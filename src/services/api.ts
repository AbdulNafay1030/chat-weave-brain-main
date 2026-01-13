const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
}

export interface Group {
    id: string;
    name: string;
    created_at: string;
    members: User[];
    owner_id: string;
    type?: 'group' | 'dm';
}

export interface Message {
    id: string;
    group_id?: string;
    user_id: string;
    content: string;
    created_at: string;
    is_ai: boolean;
    thread_id?: string;
    is_pinned?: boolean;
    reply_to_id?: string;
    replyTo?: Message; // For UI nesting
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
}

export const api = {
    async getGroups(userId: string): Promise<Group[]> {
        const params = new URLSearchParams({ user_id: userId });
        const res = await fetch(`${API_URL}/groups?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch groups');
        return res.json();
    },

    async createGroup(name: string, userId: string): Promise<Group> {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('user_id', userId);
        const res = await fetch(`${API_URL}/groups`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to create group');
        return res.json();
    },



    async deleteGroup(groupId: string): Promise<void> {
        const res = await fetch(`${API_URL}/groups/${groupId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete group');
    },

    async deleteThread(threadId: string): Promise<void> {
        const res = await fetch(`${API_URL}/threads/${threadId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete thread');
    },

    async updateGroupName(groupId: string, name: string): Promise<void> {
        const formData = new FormData();
        formData.append('name', name);
        const res = await fetch(`${API_URL}/groups/${groupId}/name`, { method: 'PUT', body: formData });
        if (!res.ok) throw new Error('Failed to rename group');
    },

    async updateThreadName(threadId: string, name: string): Promise<void> {
        const formData = new FormData();
        formData.append('name', name);
        const res = await fetch(`${API_URL}/threads/${threadId}/name`, { method: 'PUT', body: formData });
        if (!res.ok) throw new Error('Failed to rename thread');
    },

    async getMessages(groupId?: string, threadId?: string): Promise<Message[]> {
        const params = new URLSearchParams();
        if (groupId) params.append('group_id', groupId);
        if (threadId) params.append('thread_id', threadId);

        const res = await fetch(`${API_URL}/messages?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        return res.json();
    },

    async sendMessage(content: string, userId: string, groupId?: string, isAi: boolean = false, replyToId?: string): Promise<Message> {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('user_id', userId);
        if (groupId) formData.append('group_id', groupId);
        formData.append('is_ai', String(isAi));
        if (replyToId) formData.append('reply_to_id', replyToId);

        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to send message');
        return res.json();
    },

    async askAIStream(question: string, chatContext: string, onChunk: (chunk: string) => void): Promise<void> {
        const response = await fetch(`${API_URL}/ask-ai-stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, chatContext })
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            onChunk(chunk);
        }
    },

    async askAI(question: string, context: string): Promise<{ content: string }> {
        const res = await fetch(`${API_URL}/ask-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, chatContext: context }),
        });
        if (!res.ok) throw new Error('Failed to ask AI');
        return res.json();
    },

    async createInvitation(groupId: string, userId: string): Promise<{ token: string; link: string }> {
        const formData = new FormData();
        formData.append('user_id', userId);
        const res = await fetch(`${API_URL}/groups/${groupId}/invitations`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to create invitation');
        return res.json();
    },

    async sendInvitationEmail(emails: string[], subject: string, body: string, inviteLink: string): Promise<{ results: Array<{ email: string; status: string; error?: string }>; sent: number }> {
        const res = await fetch(`${API_URL}/invitations/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails, subject, body, invite_link: inviteLink })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to send emails');
        }
        return res.json();
    },

    async acceptInvitation(token: string, userId: string): Promise<{ success: boolean; groupId?: string; groupName?: string; error?: string }> {
        try {
            const res = await fetch(`${API_URL}/invitations/accept`, {
                method: 'POST',
                body: JSON.stringify({ token, user_id: userId }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to accept');
            }
            return await res.json();
        } catch (e) {
            console.error(e);
            return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
        }
    },

    async uploadAvatar(file: File, userId: string): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`${API_URL}/users/${userId}/avatar`, {
            method: 'POST',
            body: formData,
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to upload avatar');
        }
        
        const data = await res.json();
        return { url: data.url };
    },

    async login(email: string, password: string): Promise<{ user: User }> {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Login failed');
        }
        return res.json();
    },

    async register(email: string, password: string, name?: string): Promise<{ user: User }> {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Registration failed');
        }
        return res.json();
    },

    async googleLogin(data: { email: string; name: string; avatar?: string; google_id: string; mode: 'login' | 'signup' }): Promise<{ user: User }> {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Google Login failed');
        }
        return res.json();
    },

    async updateUser(userId: string, updates: { name?: string; avatar?: string }): Promise<void> {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update user');
    },

    async getUsers(query?: string): Promise<User[]> {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        const res = await fetch(`${API_URL}/users?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    },

    async getUser(userId: string): Promise<User> {
        const res = await fetch(`${API_URL}/users/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
    },

    async forgotPassword(email: string): Promise<void> {
        const formData = new FormData();
        formData.append("email", email);
        await fetch(`${API_URL}/auth/forgot-password`, { method: 'POST', body: formData });
    },

    async createDM(user1Id: string, user2Id: string): Promise<Group> {
        const res = await fetch(`${API_URL}/dms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user1_id: user1Id, user2_id: user2Id })
        });
        if (!res.ok) throw new Error('Failed to create DM');
        return res.json();
    },

    async deleteMessage(messageId: string): Promise<void> {
        const res = await fetch(`${API_URL}/messages/${messageId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete message');
    },

    async togglePinMessage(messageId: string): Promise<{ is_pinned: boolean }> {
        const res = await fetch(`${API_URL}/messages/${messageId}/pin`, {
            method: 'PUT',
        });
        if (!res.ok) throw new Error('Failed to toggle pin');
        return res.json();
    },

    async getMessageReactions(messageId: string): Promise<any[]> {
        const res = await fetch(`${API_URL}/messages/${messageId}/reactions`);
        if (!res.ok) throw new Error('Failed to fetch reactions');
        return res.json();
    },

    async getReactions(messageIds: string[]): Promise<any[]> {
        const ids = messageIds.join(',');
        const res = await fetch(`${API_URL}/reactions?message_ids=${ids}`);
        if (!res.ok) throw new Error('Failed to fetch reactions');
        return res.json();
    },

    async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('emoji', emoji);
        const res = await fetch(`${API_URL}/messages/${messageId}/reactions`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to add reaction');
    },

    async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
        const params = new URLSearchParams({ user_id: userId, emoji });
        const res = await fetch(`${API_URL}/messages/${messageId}/reactions?${params.toString()}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to remove reaction');
    }
};
