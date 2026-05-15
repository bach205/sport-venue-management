export type MessageType = 'text' | 'system' | 'match_found' | 'venue_booked' | 'image';
export type ConversationType = '1-1' | 'group';

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  distance?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: MessageType;
  timestamp: string;
  read: boolean;
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string; // for group chats
  groupAvatar?: string;
  participants: ChatUser[];
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
}
