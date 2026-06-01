import axios from 'axios';
import { API_BASE_URL, isMockApi } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types/commonTypes';
import type { Conversation, ChatMessage, ChatUser } from '../types/messages.types';
import { getCurrentUser, getToken } from '@/features/auth/store/authStore';
import {
  getConversations,
  getConversationById,
  createOrOpenConversation,
  sendMessage as sendMockMessage,
  markConversationRead,
} from '../store/messagesStore';

const FALLBACK_USER: ChatUser = {
  id: 'current-user',
  name: 'You',
  avatar: '',
  isOnline: true,
};

const buildAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildCurrentUser = (): ChatUser => {
  const user = getCurrentUser();
  if (!user) return FALLBACK_USER;

  return {
    id: user._id,
    name: user.name || user.email,
    avatar: user.avatar || '',
    isOnline: true,
  };
};

const buildAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const buildPeerUser = (peer?: { id?: string; name?: string; email?: string; isOnline?: boolean }): ChatUser => {
  const label = peer?.name || peer?.email || 'Unknown';
  return {
    id: peer?.id || 'unknown',
    name: label,
    avatar: buildAvatarUrl(label),
    isOnline: Boolean(peer?.isOnline),
  };
};

const mapApiMessage = (message: any, currentUserId: string): ChatMessage => {
  const isOwner = Boolean(message.isOwner) || message.senderId === currentUserId;
  const read = isOwner ? true : message.status === 'seen';

  return {
    id: message.id,
    senderId: message.senderId,
    content: message.content,
    type: 'text',
    timestamp: message.createdAt || new Date().toISOString(),
    read,
    imageUrl: undefined,
  };
};

const mapApiConversation = (summary: any, currentUser: ChatUser): Conversation => {
  const peerUser = buildPeerUser(summary.peerUser);
  const lastMessage = summary.lastMessage
    ? mapApiMessage(summary.lastMessage, currentUser.id)
    : null;

  return {
    id: summary.id,
    type: summary.type === 'direct' ? '1-1' : 'group',
    participants: [currentUser, peerUser],
    messages: lastMessage ? [lastMessage] : [],
    lastMessage,
    unreadCount: summary.unseenCount || 0,
    name: peerUser.name,
  };
};

export async function listConversations(): Promise<ApiResponse<{ items: Conversation[] }>> {
  if (isMockApi) {
    return { success: true, message: 'OK', data: { items: getConversations() } };
  }

  try {
    const currentUser = buildCurrentUser();
    const res = await axios.get(`${API_BASE_URL}/chat/conversations`, {
      headers: buildAuthHeader(),
    });
    const items = (res.data.data.items || []).map((summary: any) =>
      mapApiConversation(summary, currentUser)
    );
    return { success: true, message: res.data.message, data: { items } };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to fetch conversations.',
      data: { items: [] },
    };
  }
}

export async function getConversationMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<ApiResponse<{ items: ChatMessage[] }>> {
  if (isMockApi) {
    const conversation = getConversationById(conversationId);
    if (!conversation) {
      return { success: false, message: 'Conversation not found.', data: { items: [] } };
    }
    return { success: true, message: 'OK', data: { items: conversation.messages } };
  }

  try {
    const currentUser = buildCurrentUser();
    const res = await axios.get(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
      headers: buildAuthHeader(),
      params: { page, limit },
    });
    const items = (res.data.data.items || []).map((message: any) =>
      mapApiMessage(message, currentUser.id)
    );
    return { success: true, message: res.data.message, data: { items } };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to fetch messages.',
      data: { items: [] },
    };
  }
}

export async function createDirectConversation(
  targetUserId: string
): Promise<ApiResponse<Conversation>> {
  if (isMockApi) {
    const mockUser = { id: targetUserId, name: 'New Contact', avatar: '', isOnline: false };
    const conv = createOrOpenConversation(mockUser);
    return { success: true, message: 'Conversation ready.', data: conv };
  }

  try {
    const currentUser = buildCurrentUser();
    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/direct`,
      { target_user_id: targetUserId },
      { headers: buildAuthHeader() }
    );
    const conversation = mapApiConversation(res.data.data, currentUser);
    return { success: true, message: res.data.message, data: conversation };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to create conversation.',
      data: null as unknown as Conversation,
    };
  }
}

export async function sendChatMessage(
  conversationId: string,
  payload: { content: string; attachments?: unknown[] }
): Promise<ApiResponse<ChatMessage>> {
  if (isMockApi) {
    const message = sendMockMessage(conversationId, payload.content);
    return { success: true, message: 'Message sent.', data: message };
  }

  try {
    const currentUser = buildCurrentUser();
    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      payload,
      { headers: buildAuthHeader() }
    );
    const message = mapApiMessage(res.data.data, currentUser.id);
    return { success: true, message: res.data.message, data: message };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to send message.',
      data: null as unknown as ChatMessage,
    };
  }
}

export async function markConversationSeen(
  conversationId: string
): Promise<ApiResponse<{ updatedCount: number }>> {
  if (isMockApi) {
    markConversationRead(conversationId);
    return { success: true, message: 'Messages marked as seen.', data: { updatedCount: 0 } };
  }

  try {
    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/${conversationId}/seen`,
      {},
      { headers: buildAuthHeader() }
    );
    return { success: true, message: res.data.message, data: res.data.data };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to mark messages as seen.',
      data: { updatedCount: 0 },
    };
  }
}
