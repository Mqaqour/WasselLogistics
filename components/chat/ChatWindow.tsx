import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage } from './types/chat.types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { WaitingIndicator } from './WaitingIndicator';
import { chatApi } from './services/chatApi';
import { socketClient } from './services/socketClient';
import { playReplyNotificationSound } from './utils/notificationSound';

interface ChatWindowProps {
  lang: 'ar' | 'en';
  sessionId: string;
  onSessionExpired?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ lang, sessionId, onSessionExpired }) => {
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [sending, setSending]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const bottomRef                         = useRef<HTMLDivElement>(null);
  const isAr                              = lang === 'ar';

  // The customer's own last message hasn't been answered yet — show a "waiting" indicator
  // so it doesn't feel unread, even though respond.io gives us no real typing signal.
  const lastMessage    = messages[messages.length - 1];
  const awaitingReply  = !!lastMessage && lastMessage.senderType === 'visitor' && !lastMessage.pending;

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

    // Session room join/leave is owned by ChatWidget so it persists across panel open/close.
    const sock = socketClient.connect();

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.senderType === 'agent') {
        playReplyNotificationSound();
      }
    };

    socketClient.onMessage(handleNewMessage);

    return () => {
      cancelled = true;
      socketClient.offMessage(handleNewMessage);
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

  const handleSendFile = useCallback(async (file: File) => {
    setErrorMsg('');
    const tempId = `temp_${Date.now()}`;
    // Show the visitor's own file from a local blob URL — the server copy is
    // deleted right after respond.io fetches it, so it isn't safe to reload.
    const localUrl = URL.createObjectURL(file);
    const optimistic: ChatMessage = {
      messageId:          tempId,
      senderType:         'visitor',
      messageType:        'attachment',
      messageText:        null,
      attachmentUrl:      localUrl,
      attachmentFileName: file.name,
      createdAt:          new Date().toISOString(),
      pending:            true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    try {
      const attachment = await chatApi.uploadAttachment(file);
      const { messageId } = await chatApi.sendMessage(sessionId, undefined, attachment);
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === tempId ? { ...m, messageId, pending: false } : m
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      URL.revokeObjectURL(localUrl);
      if (err instanceof Error && err.message === 'Session not found.') {
        onSessionExpired?.();
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : (isAr ? 'فشل رفع الملف' : 'Upload failed'));
    } finally {
      setSending(false);
    }
  }, [sessionId, isAr, onSessionExpired]);

  return (
    <div
      className="flex flex-1 min-h-0 flex-col"
      dir={isAr ? 'rtl' : 'ltr'}
    >
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
        {awaitingReply && <WaitingIndicator lang={lang} />}
        {errorMsg && (
          <p className="text-center text-xs text-red-500">{errorMsg}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput lang={lang} disabled={sending} onSend={handleSend} onSendFile={handleSendFile} />
    </div>
  );
};
