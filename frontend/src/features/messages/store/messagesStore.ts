/**
 * Messages In-Memory Store
 * Persists conversation state across route navigations within the same session.
 *
 * API Routes (real backend):
 *   GET  /api/conversations                  → { data: Conversation[] }
 *   GET  /api/conversations/:id/messages     → { data: Message[] }
 *   POST /api/conversations/:id/messages     → { data: Message }
 *     Request: { content: string, type: MessageType }
 *   POST /api/conversations                  → { data: Conversation }
 *     Request: { participantIds: string[], type: ConversationType }
 */

import type { Conversation, ChatMessage, ChatUser } from '../types/messages.types';

export const CURRENT_USER: ChatUser = {
  id: 'current-user',
  name: 'You',
  avatar: '',
  isOnline: true,
};

const MOCK_USERS: Record<string, ChatUser> = {
  'user-sarah': {
    id: 'user-sarah',
    name: 'Sarah Jenkins',
    avatar: 'avatar:768be8c6c602934c7f4f0c51ce322a03d7bc3607',
    isOnline: true,
    distance: '1.2 miles away',
  },
  'user-marcus': {
    id: 'user-marcus',
    name: 'Marcus Chen',
    avatar: 'avatar:244cc22520475607918c3b4e0806b6cd19231fd4',
    isOnline: false,
  },
  'user-alex': {
    id: 'user-alex',
    name: 'Alex Rivera',
    avatar: 'avatar:85f2b1fcf9fbde97cb43de566e1fc58d7dc5f9a2',
    isOnline: false,
  },
  'user-linh': {
    id: 'user-linh',
    name: 'Linh Nguyễn',
    avatar: 'avatar:a0f2df621eb14a30acc7eee63a30e2de7f9d53d6',
    isOnline: true,
  },
};

export { MOCK_USERS };

function makeId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function ts(offsetMinutes: number): string {
  const d = new Date('2026-05-08T17:40:00');
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toISOString();
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    type: '1-1',
    participants: [CURRENT_USER, MOCK_USERS['user-sarah']],
    unreadCount: 2,
    messages: [
      {
        id: makeId(),
        senderId: 'system',
        content: 'Match Found! You and Sarah are confirmed for 1v1 Tennis. Start coordinating!',
        type: 'match_found',
        timestamp: ts(0),
        read: true,
      },
      {
        id: makeId(),
        senderId: 'user-sarah',
        content: "Hey! I'm super pumped for the match later.",
        type: 'text',
        timestamp: ts(2),
        read: true,
      },
      {
        id: makeId(),
        senderId: 'current-user',
        content: 'Same here! Did you want to meet at the main gate?',
        type: 'text',
        timestamp: ts(5),
        read: true,
      },
      {
        id: makeId(),
        senderId: 'user-sarah',
        content: 'Yeah, main gate is perfect. Court looks open right now!',
        type: 'text',
        timestamp: ts(8),
        imageUrl: 'avatar:c1c6d62b4135dfdd55aafefa06abfdf8321f96cf',
        read: false,
      },
      {
        id: makeId(),
        senderId: 'system',
        content: 'Venue Booked: Riverside Courts (Court 3)',
        type: 'venue_booked',
        timestamp: ts(10),
        read: false,
      },
      {
        id: makeId(),
        senderId: 'user-sarah',
        content: 'Are we still on for the 6PM match?',
        type: 'text',
        timestamp: ts(90),
        read: false,
      },
    ],
    get lastMessage() {
      return this.messages[this.messages.length - 1] ?? null;
    },
  },
  {
    id: 'conv-2',
    type: 'group',
    name: 'Downtown Hoopers',
    participants: [
      CURRENT_USER,
      MOCK_USERS['user-marcus'],
      { id: 'user-mike', name: 'Mike', avatar: 'avatar:95f383dad4232d71e1e9fb7cf04dfe3fdab3bd30', isOnline: false },
    ],
    unreadCount: 0,
    messages: [
      {
        id: makeId(),
        senderId: 'system',
        content: 'Group "Downtown Hoopers" was created.',
        type: 'system',
        timestamp: ts(-180),
        read: true,
      },
      {
        id: makeId(),
        senderId: 'user-marcus',
        content: 'Hey everyone, game is on for Sunday! 🏀',
        type: 'text',
        timestamp: ts(-120),
        read: true,
      },
      {
        id: makeId(),
        senderId: 'current-user',
        content: "Can't wait!",
        type: 'text',
        timestamp: ts(-90),
        read: true,
      },
      {
        id: makeId(),
        senderId: 'user-mike',
        content: "I'll bring the extra ball.",
        type: 'text',
        timestamp: ts(-60),
        read: true,
      },
    ],
    get lastMessage() {
      return this.messages[this.messages.length - 1] ?? null;
    },
  },
  {
    id: 'conv-3',
    type: '1-1',
    participants: [CURRENT_USER, MOCK_USERS['user-alex']],
    unreadCount: 0,
    messages: [
      {
        id: makeId(),
        senderId: 'current-user',
        content: 'Hey, are you up for a game this weekend?',
        type: 'text',
        timestamp: ts(-1440),
        read: true,
      },
      {
        id: makeId(),
        senderId: 'user-alex',
        content: 'Sounds good, see you there.',
        type: 'text',
        timestamp: ts(-1400),
        read: true,
      },
    ],
    get lastMessage() {
      return this.messages[this.messages.length - 1] ?? null;
    },
  },
];

// Module-level store
let _conversations: Conversation[] = INITIAL_CONVERSATIONS.map(c => ({ ...c }));

export function getConversations(): Conversation[] {
  return _conversations;
}

export function getConversationById(id: string): Conversation | undefined {
  return _conversations.find(c => c.id === id);
}

export function findConversationWithUser(userId: string): Conversation | undefined {
  return _conversations.find(
    c => c.type === '1-1' && c.participants.some(p => p.id === userId)
  );
}

export function addMessageToConversation(
  convId: string,
  msg: ChatMessage,
  markRead: boolean = true
): void {
  const conv = _conversations.find(c => c.id === convId);
  if (conv) {
    conv.messages.push(msg);
    if (markRead) {
      msg.read = true;
      conv.unreadCount = 0;
    } else {
      conv.unreadCount += 1;
    }
  }
}

export function markConversationRead(convId: string): void {
  const conv = _conversations.find(c => c.id === convId);
  if (conv) {
    conv.unreadCount = 0;
    conv.messages.forEach(m => { m.read = true; });
  }
}

export function createOrOpenConversation(user: ChatUser, introMessage?: string): Conversation {
  const existing = findConversationWithUser(user.id);
  if (existing) {
    return existing;
  }

  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
    type: '1-1',
    participants: [CURRENT_USER, user],
    unreadCount: 0,
    messages: introMessage
      ? [
          {
            id: makeId(),
            senderId: 'system',
            content: introMessage,
            type: 'system',
            timestamp: new Date().toISOString(),
            read: true,
          },
        ]
      : [],
    get lastMessage() {
      return this.messages[this.messages.length - 1] ?? null;
    },
  };

  _conversations = [newConv, ..._conversations];
  return newConv;
}

export function sendMessage(convId: string, content: string): ChatMessage {
  const msg: ChatMessage = {
    id: makeId(),
    senderId: 'current-user',
    content,
    type: 'text',
    timestamp: new Date().toISOString(),
    read: true,
  };
  addMessageToConversation(convId, msg, true);
  return msg;
}