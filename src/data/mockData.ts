import { User, Group, Message, PrivateThread, ThreadMessage } from '@/types/threadly';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    email: 'alex@threadly.io',
    status: 'online',
  },
  {
    id: 'user-2',
    name: 'Sarah Miller',
    email: 'sarah@threadly.io',
    status: 'online',
  },
  {
    id: 'user-3',
    name: 'Jordan Lee',
    email: 'jordan@threadly.io',
    status: 'away',
  },
  {
    id: 'user-4',
    name: 'Maya Patel',
    email: 'maya@threadly.io',
    status: 'offline',
  },
];

export const currentUser = mockUsers[0];

export const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Product Team',
    description: 'Main product discussions and updates',
    members: mockUsers,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'group-2',
    name: 'Design Sprint',
    description: 'Q1 design sprint collaboration',
    members: [mockUsers[0], mockUsers[1], mockUsers[2]],
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'group-3',
    name: 'Marketing Ideas',
    description: 'Campaign brainstorming',
    members: [mockUsers[0], mockUsers[3]],
    createdAt: new Date('2024-02-10'),
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    groupId: 'group-1',
    userId: 'user-2',
    content: 'Hey team! Ready to brainstorm on the new feature?',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'msg-2',
    groupId: 'group-1',
    userId: 'user-3',
    content: 'Absolutely! I have some ideas about the user onboarding flow.',
    createdAt: new Date(Date.now() - 3000000),
  },
  {
    id: 'msg-3',
    groupId: 'group-1',
    userId: 'user-1',
    content: 'Let\'s start a private thread to hash out the details first.',
    createdAt: new Date(Date.now() - 2400000),
  },
];

export const mockThreads: PrivateThread[] = [];

export const mockThreadMessages: ThreadMessage[] = [];
