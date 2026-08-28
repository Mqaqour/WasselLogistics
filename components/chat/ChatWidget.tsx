import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatButton } from './ChatButton';
import { PreChatForm } from './PreChatForm';
import { ChatWindow } from './ChatWindow';
import { chatApi } from './services/chatApi';
import { socketClient } from './services/socketClient';
import { playReplyNotificationSound } from './utils/notificationSound';
import { PreChatFormData, WidgetState, ChatMessage } from './types/chat.types';

const SESSION_STORAGE_KEY = 'wassel_chat_session_id';

interface ChatWidgetProps {
  lang?: 'ar' | 'en';
  /** When provided the widget is externally controlled — no internal ChatButton is rendered */
  externalOpen?: boolean;
  /** Called when the widget wants to close itself in controlled mode */
  onExternalClose?: () => void;
  /** Called whenever the unread reply count changes, so a parent can show a badge elsewhere (e.g. the floating nav) */
  onUnreadChange?: (count: number) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  lang = 'ar',
  externalOpen,
  onExternalClose,
  onUnreadChange,
}) => {
  const controlled = externalOpen !== undefined;

  const [state, setState]         = useState<WidgetState>('closed');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [unread, setUnread]       = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const isOpenRef = useRef(false);

  // Exit-animation bookkeeping: keep the panel mounted a little longer than `isOpen`
  // so the closing transition can play instead of the panel just vanishing.
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({ opacity: 0, transform: 'scale(0.95)' });
  const panelRef = useRef<HTMLDivElement>(null);

  // `state` flips to 'closed' as soon as closing starts, but the panel stays mounted a
  // little longer to animate out — so keep rendering whatever content was last shown
  // instead of it going blank mid-transition.
  const [lastContentState, setLastContentState] = useState<'pre-chat' | 'chat'>('pre-chat');
  useEffect(() => {
    if (state === 'pre-chat' || state === 'chat') {
      setLastContentState(state);
    }
  }, [state]);

  // Restore session from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) setSessionId(saved);
  }, []);

  // Report unread count to the parent (e.g. to badge the floating nav's chat icon)
  useEffect(() => {
    onUnreadChange?.(unread);
  }, [unread, onUnreadChange]);

  // Stay joined to the session's socket room for the session's whole lifetime — not just while
  // the panel is open — so a reply notifies the customer even when they've closed the widget.
  useEffect(() => {
    if (!sessionId) return;

    socketClient.connect();
    socketClient.joinSession(sessionId);

    const handleBackgroundMessage = (msg: ChatMessage) => {
      if (msg.senderType === 'agent' && !isOpenRef.current) {
        setUnread((prev) => prev + 1);
        playReplyNotificationSound();
      }
    };

    socketClient.onMessage(handleBackgroundMessage);

    return () => {
      socketClient.offMessage(handleBackgroundMessage);
      socketClient.leaveSession(sessionId);
    };
  }, [sessionId]);

  // Sync internal state when externally opened/closed
  useEffect(() => {
    if (!controlled) return;
    if (externalOpen) {
      setUnread(0);
      setState((prev) => prev === 'closed' ? (sessionId ? 'chat' : 'pre-chat') : prev);
    } else {
      setState('closed');
    }
  }, [externalOpen, controlled, sessionId]);

  const resetSession = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId(null);
    setState('pre-chat');
  }, []);

  // Only used in standalone (uncontrolled) mode
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
    setIsExpanded(false);
    if (controlled) {
      onExternalClose?.();
    } else {
      setState('closed');
    }
  }, [controlled, onExternalClose]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const isOpen = state !== 'closed';
  isOpenRef.current = isOpen;

  // Drive the enter/exit transition — mount immediately on open, but delay unmount on close
  // until the animation has finished playing. Closing animates toward the "Chat" quick-action
  // button's on-screen position (a minimize-into-the-icon effect), falling back to a plain
  // scale-down if that button can't be found for some reason.
  useEffect(() => {
    if (isOpen) {
      setShouldRenderPanel(true);
      setPanelStyle({ opacity: 0, transform: 'scale(0.95)' });
      const raf = requestAnimationFrame(() => setPanelStyle({ opacity: 1, transform: 'scale(1)' }));
      return () => cancelAnimationFrame(raf);
    }

    const panelEl = panelRef.current;
    const targetEl = document.querySelector<HTMLElement>('[data-quick-action="chat"]');

    if (panelEl && targetEl) {
      const panelRect = panelEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const dx = (targetRect.left + targetRect.width / 2) - (panelRect.left + panelRect.width / 2);
      const dy = (targetRect.top + targetRect.height / 2) - (panelRect.top + panelRect.height / 2);
      setPanelStyle({ opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.05)` });
    } else {
      setPanelStyle({ opacity: 0, transform: 'scale(0.95)' });
    }

    const timer = setTimeout(() => setShouldRenderPanel(false), 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <>
      {/* Standalone floating button — hidden in controlled mode */}
      {!controlled && (
        <ChatButton
          isOpen={isOpen}
          lang={lang}
          onClick={handleOpen}
          unreadCount={unread}
        />
      )}

      {/* Widget panel — floating card, or full-height sidebar when expanded */}
      {shouldRenderPanel && (
        <div
          ref={panelRef}
          className={
            isExpanded
              ? 'fixed inset-y-0 right-0 z-[70] w-full sm:w-[420px] rounded-none sm:rounded-l-2xl shadow-[0px_4px_11.3px_0px_#00000026] border-l border-gray-200 bg-white overflow-hidden flex flex-col transition-all duration-300 ease-out'
              : 'fixed bottom-[5.5rem] right-4 md:right-6 z-[70] w-[calc(100vw-2rem)] sm:w-96 rounded-2xl shadow-[0px_4px_11.3px_0px_#00000026] border border-gray-200 bg-white overflow-hidden flex flex-col transition-all duration-300 ease-out'
          }
          style={{
            ...(isExpanded ? { height: '100%' } : { height: '520px', maxHeight: 'calc(100vh - 6.5rem)' }),
            ...panelStyle,
          }}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {lastContentState === 'pre-chat' && (
            <PreChatForm lang={lang} onSubmit={handlePreChatSubmit} />
          )}
          {lastContentState === 'chat' && sessionId && (
            <ChatWindow
              lang={lang}
              sessionId={sessionId}
              onClose={handleClose}
              onSessionExpired={resetSession}
              isExpanded={isExpanded}
              onToggleExpand={handleToggleExpand}
            />
          )}
        </div>
      )}
    </>
  );
};
