import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { MessageSquare } from 'lucide-react';
import type { Conversation, ChatMessage } from '../types/messages.types';
import {
  getConversations,
  createOrOpenConversation,
  sendMessage,
  markConversationRead,
  MOCK_USERS,
} from '../store/messagesStore';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>(() => getConversations());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | '1-1' | 'group'>('all');

  // Handle "Contact Now" navigation: ?with=userId&name=...&avatar=...&sport=...
  useEffect(() => {
    const withUserId = searchParams.get('with');
    const name = searchParams.get('name') ?? '';
    const avatar = searchParams.get('avatar') ?? '';
    const sport = searchParams.get('sport') ?? '';

    if (withUserId) {
      // Look up user from MOCK_USERS or create a minimal one
      const knownUser = MOCK_USERS[withUserId];
      const user = knownUser ?? { id: withUserId, name, avatar, isOnline: false };

      const sportLabel = sport ? `${sport.charAt(0).toUpperCase() + sport.slice(1)}` : 'sport';
      const intro = `You reached out about ${name}'s ${sportLabel} post. Say hi! 👋`;

      const conv = createOrOpenConversation(user, intro);
      setConversations(getConversations());
      setActiveId(conv.id);
      markConversationRead(conv.id);

      // Clear URL params cleanly
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Auto-open first conversation if none active
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveId(conv.id);
    markConversationRead(conv.id);
    setConversations(getConversations());
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!activeId) return;
    sendMessage(activeId, content);
    setConversations([...getConversations()]);

    // Simulate a reply for demo purposes (only for 1-1 with Sarah)
    const conv = getConversations().find(c => c.id === activeId);
    if (conv?.type === '1-1') {
      const other = conv.participants.find(p => p.id !== 'current-user');
      if (other && other.isOnline) {
        const replies = [
          "Sounds great! 🙌",
          "See you there!",
          "Perfect, let's do it!",
          "Can't wait! 🎾",
          "Awesome, that works for me.",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        setTimeout(() => {
          const replyMsg: ChatMessage = {
            id: `msg-reply-${Date.now()}`,
            senderId: other.id,
            content: randomReply,
            type: 'text',
            timestamp: new Date().toISOString(),
            read: false,
          };
          const storeConv = getConversations().find(c => c.id === activeId);
          if (storeConv) {
            storeConv.messages.push(replyMsg);
            setConversations([...getConversations()]);
          }
        }, 1200 + Math.random() * 800);
      }
    }
  }, [activeId]);

  const activeConversation = conversations.find(c => c.id === activeId) ?? null;

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 60px)', background: '#fff8f6' }}
    >
      {/* Left sidebar - Conversation list */}
      <div className="w-[320px] shrink-0 flex flex-col overflow-hidden">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Right panel - Chat window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            onSendMessage={handleSendMessage}
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
              Your Messages
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8b7266', marginTop: 8, maxWidth: 300 }}>
              Select a conversation or contact someone from the Discover page
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
              Browse Discover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}