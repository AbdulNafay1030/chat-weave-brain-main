export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  status: 'online' | 'offline' | 'away';
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: User[];
  createdAt: Date;
  ownerId?: string;
  type?: 'group' | 'dm';
  avatar?: string;
}

export interface Message {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  createdAt: Date;
  isAI?: boolean;
  threadId?: string;
  replyToId?: string;
  replyTo?: Message;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isPinned?: boolean;
}

export interface PrivateThread {
  id: string;
  groupId: string;
  name: string;
  members: User[];
  createdAt: Date;
  isActive: boolean;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: Date;
  replyToId?: string;
  replyTo?: ThreadMessage;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isPinned?: boolean;
}
