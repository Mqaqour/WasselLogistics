import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { ChatMessage } from './types/chat.types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { chatApi } from './services/chatApi';
import { socketClient } from './services/socketClient';

interface ChatWindowProps {
  lang: 'ar' | 'en';
  sessionId: string;
  onClose: () => void;
  onSessionExpired?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ lang, sessionId, onClose, onSessionExpired }) => {
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [sending, setSending]             = useState(false);
  const [connected, setConnected]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const bottomRef                         = useRef<HTMLDivElement>(null);
  const isAr                              = lang === 'ar';

  const t = {
    title:       isAr ? 'دعم واصل' : 'Wassel Support',
    online:      isAr ? 'متصل' : 'Online',
    offline:     isAr ? 'غير متصل' : 'Offline',
    loading:     isAr ? 'جاري التحميل...' : 'Loading...',
  };

  // Load history + connect socket
  useEffect(() => {
    let cancelled = false;

    chatApi.getMessages(sessionId)
      .then(({ messages: hist }) => { if (!cancelled) setMessages(hist); })
      .catch((err) => {
        if (err instanceof Error && err.message === 'Session not found.') {
          onSessionExpired?.();
        }
      });

    const sock = socketClient.connect();
    socketClient.joinSession(sessionId);

    sock.on('connect',    () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));
    setConnected(sock.connected);

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socketClient.onMessage(handleNewMessage);

    return () => {
      cancelled = true;
      socketClient.offMessage(handleNewMessage);
      socketClient.leaveSession(sessionId);
    };
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (text: string) => {
    setErrorMsg('');
    const tempId = `temp_${Date.now()}`;
    const optimistic: ChatMessage = {
      messageId:   tempId,
      senderType:  'visitor',
      messageType: 'text',
      messageText: text,
      createdAt:   new Date().toISOString(),
      pending:     true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    try {
      const { messageId } = await chatApi.sendMessage(sessionId, text);
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === tempId ? { ...m, messageId, pending: false } : m
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      if (err instanceof Error && err.message === 'Session not found.') {
        onSessionExpired?.();
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : (isAr ? 'فشل الإرسال' : 'Send failed'));
    } finally {
      setSending(false);
    }
  }, [sessionId, isAr]);

  return (
    <div
      className="flex flex-col"
      style={{ height: '100%' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[#002B49] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFCD00] flex items-center justify-center text-[#002B49] font-extrabold text-sm">
            W
          </div>
          <div>
            <p className="text-sm font-bold leading-none">{t.title}</p>
            <p className="flex items-center gap-1 text-[10px] text-gray-300 mt-0.5">
              {connected
                ? <><Wifi className="w-3 h-3 text-green-400" />{t.online}</>
                : <><WifiOff className="w-3 h-3 text-red-400" />{t.offline}</>}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-white space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-8">
            {isAr ? 'ابدأ المحادثة...' : 'Start the conversation...'}
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.messageId} message={msg} lang={lang} />
        ))}
        {errorMsg && (
          <p className="text-center text-xs text-red-500">{errorMsg}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput lang={lang} disabled={sending} onSend={handleSend} />
    </div>
  );
};
