import React, { useState, useCallback, useEffect } from 'react';
import { ChatButton } from './ChatButton';
import { PreChatForm } from './PreChatForm';
import { ChatWindow } from './ChatWindow';
import { chatApi } from './services/chatApi';
import { PreChatFormData, WidgetState } from './types/chat.types';

const SESSION_STORAGE_KEY = 'wassel_chat_session_id';

interface ChatWidgetProps {
  lang?: 'ar' | 'en';
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ lang = 'ar' }) => {
  const [state, setState]         = useState<WidgetState>('closed');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [unread, setUnread]       = useState(0);

  // Restore session from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) setSessionId(saved);
  }, []);

  const handleOpen = useCallback(() => {
    setUnread(0);
    if (state === 'closed') {
      setState(sessionId ? 'chat' : 'pre-chat');
    } else {
      setState('closed');
    }
  }, [state, sessionId]);

  const handlePreChatSubmit = useCallback(async (data: PreChatFormData) => {
    const { sessionId: sid } = await chatApi.startChat({
      firstName:      data.firstName,
      phone:          data.phone,
      email:          data.email,
      serviceType:    data.serviceType,
      trackingNumber: data.trackingNumber,
      language:       data.language,
    });

    localStorage.setItem(SESSION_STORAGE_KEY, sid);
    setSessionId(sid);
    setState('chat');

    // Send first message
    await chatApi.sendMessage(sid, data.firstMessage);
  }, []);

  const handleClose = useCallback(() => {
    setState('closed');
  }, []);

  const isOpen = state !== 'closed';

  return (
    <>
      {/* Floating button */}
      <ChatButton
        isOpen={isOpen}
        lang={lang}
        onClick={handleOpen}
        unreadCount={unread}
      />

      {/* Widget panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[22rem] sm:w-96 rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden flex flex-col"
          style={{ height: '500px', maxHeight: 'calc(100vh - 7rem)' }}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {state === 'pre-chat' && (
            <PreChatForm lang={lang} onSubmit={handlePreChatSubmit} />
          )}
          {state === 'chat' && sessionId && (
            <ChatWindow lang={lang} sessionId={sessionId} onClose={handleClose} />
          )}
        </div>
      )}
    </>
  );
};
