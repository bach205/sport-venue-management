import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { MessageSquare } from 'lucide-react';
import type { Conversation, ChatMessage } from '../types/messages.types';
import {
  getConversations,
  createOrOpenConversation,
  sendMessage as sendMockMessage,
  markConversationRead,
  CURRENT_USER,
  MOCK_USERS,
} from '../store/messagesStore';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';
import { joinUserRoom, socket } from '@/shared/socket/socketClient';
import { isMockApi } from '@/shared/constants/api';
import { useAppSelector } from '@/shared/hooks/useAppSelector';
import {
  createDirectConversation,
  getConversationMessages,
  listConversations,
  markConversationSeen,
  sendChatMessage,
} from '../api/chatApi';
import { useTranslation } from 'react-i18next';

export default function MessagesPage() {
  const { t } = useTranslation('matching');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const authUser = useAppSelector((state) => state.auth.user);
  const currentUserId = authUser?._id ?? CURRENT_USER.id;

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    isMockApi ? getConversations() : []
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | '1-1' | 'group'>('all');

  const loadConversations = useCallback(async () => {
    if (isMockApi) {
      setConversations(getConversations());
      return;
    }

    const res = await listConversations();
    if (res.success) {
      setConversations(res.data.items);
    } else {
      console.error(res.message);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, currentUserId]);

  // Handle "Contact Now" navigation: ?with=userId&name=...&avatar=...&sport=...
  useEffect(() => {
    const withUserId = searchParams.get('with');
    const name = searchParams.get('name') ?? '';
    const avatar = searchParams.get('avatar') ?? '';
    const sport = searchParams.get('sport') ?? '';

    if (!withUserId) return;

    const run = async () => {
      if (isMockApi) {
        // Look up user from MOCK_USERS or create a minimal one
        const knownUser = MOCK_USERS[withUserId];
        const user = knownUser ?? { id: withUserId, name, avatar, isOnline: false };

        const sportLabel = sport ? t(`sports.${sport.toLowerCase()}`, sport) : t('messages.sportFallback');
        const intro = t('messages.contactIntro', { sport: sportLabel, name });

        const conv = createOrOpenConversation(user, intro);
        setConversations(getConversations());
        setActiveId(conv.id);
        setShowChatOnMobile(true);
        markConversationRead(conv.id);
      } else {
        const res = await createDirectConversation(withUserId);
        if (res.success) {
          setConversations((prev) => {
            const filtered = prev.filter((conv) => conv.id !== res.data.id);
            return [res.data, ...filtered];
          });
          setActiveId(res.data.id);
          setShowChatOnMobile(true);
          await markConversationSeen(res.data.id);
        } else {
          console.error(res.message);
        }
      }

      // Clear URL params cleanly
      setSearchParams({}, { replace: true });
    };

    run();
  }, [searchParams, setSearchParams, currentUserId, t]);

  // Auto-open first conversation if none active
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  const appendMessage = useCallback(
    (convId: string, message: ChatMessage, markRead: boolean) => {
      setConversations((prev) => {
        let updated = false;
        const next = prev.map((conv) => {
          if (conv.id !== convId) return conv;
          if (conv.messages.some((msg) => msg.id === message.id)) {
            return conv;
          }

          updated = true;
          const messages = [...conv.messages, message];
          return {
            ...conv,
            messages,
            lastMessage: message,
            unreadCount: markRead ? 0 : conv.unreadCount + 1,
          };
        });

        return updated ? next : prev;
      });
    },
    []
  );

  useEffect(() => {
    if (!activeId || isMockApi) return;

    const run = async () => {
      const res = await getConversationMessages(activeId);
      if (!res.success) {
        console.error(res.message);
        return;
      }

      const ordered = [...res.data.items].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeId
            ? {
                ...conv,
                messages: ordered,
                lastMessage: ordered[ordered.length - 1] ?? conv.lastMessage,
                unreadCount: 0,
              }
            : conv
        )
      );
    };

    run();
  }, [activeId]);

  useEffect(() => {
    const joinUser = () => joinUserRoom(currentUserId);

    if (socket.connected) {
      joinUser();
    }
    socket.on('connect', joinUser);

    return () => {
      socket.off('connect', joinUser);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!activeId) return;

    const joinRoom = () => socket.emit('chat:join', activeId);

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    return () => {
      socket.off('connect', joinRoom);
    };
  }, [activeId]);

  useEffect(() => {
    const handleIncoming = (payload: {
      roomId?: string;
      message?: ChatMessage;
      sender?: { id?: string };
    }) => {
      if (!payload?.roomId || !payload.message) return;
      const markRead = payload.roomId === activeId;
      appendMessage(payload.roomId, {
        ...payload.message,
        read: markRead ? true : payload.message.read,
      }, markRead);
    };

    socket.on('chat:message', handleIncoming);

    return () => {
      socket.off('chat:message', handleIncoming);
    };
  }, [activeId, appendMessage]);

  useEffect(() => {
    const handlePresence = (payload: { userId?: string; isOnline?: boolean }) => {
      if (!payload?.userId) return;

      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          participants: conversation.participants.map((participant) =>
            participant.id === payload.userId
              ? { ...participant, isOnline: Boolean(payload.isOnline) }
              : participant
          ),
        }))
      );
    };

    socket.on('user:presence', handlePresence);

    return () => {
      socket.off('user:presence', handlePresence);
    };
  }, []);

  const handleSelectConversation = useCallback(
    async (conv: Conversation) => {
      setActiveId(conv.id);
      setShowChatOnMobile(true);

      if (isMockApi) {
        markConversationRead(conv.id);
        setConversations(getConversations());
        return;
      }

      setConversations((prev) =>
        prev.map((item) =>
          item.id === conv.id ? { ...item, unreadCount: 0 } : item
        )
      );

      const res = await markConversationSeen(conv.id);
      if (!res.success) {
        console.error(res.message);
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeId) return;

      if (isMockApi) {
        const message = sendMockMessage(activeId, content);
        socket.emit('chat:message', {
          roomId: activeId,
          message,
          sender: { id: currentUserId },
        });
        setConversations([...getConversations()]);
        return;
      }

      const res = await sendChatMessage(activeId, { content });
      if (!res.success) {
        console.error(res.message);
        return;
      }

      appendMessage(activeId, res.data, true);
      socket.emit('chat:message', {
        roomId: activeId,
        message: res.data,
        sender: { id: currentUserId },
      });
    },
    [activeId, currentUserId, appendMessage]
  );

  const activeConversation = conversations.find(c => c.id === activeId) ?? null;

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 60px)', background: '#fff8f6' }}
    >
      {/* Left sidebar - Conversation list */}
      <div className={`${showChatOnMobile ? 'hidden' : 'flex'} w-full shrink-0 flex-col overflow-hidden md:flex md:w-[320px]`}>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUserId={currentUserId}
        />
      </div>

      {/* Right panel - Chat window */}
      <div className={`${showChatOnMobile ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col overflow-hidden md:flex`}>
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            onSendMessage={handleSendMessage}
            currentUserId={currentUserId}
            onBack={() => setShowChatOnMobile(false)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#fff1eb' }}
            >
              <MessageSquare size={36} style={{ color: '#a04100' }} />
            </div>
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', fontWeight: 700, color: '#241914' }}>
              {t('messages.emptyPanel.title')}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8b7266', marginTop: 8, maxWidth: 300 }}>
              {t('messages.emptyPanel.subtitle')}
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="mt-6 h-11 px-6 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(90deg, #a04100 0%, #ff7e36 100%)',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                border: 'none',
              }}
            >
              {t('messages.emptyPanel.goToDiscover')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
