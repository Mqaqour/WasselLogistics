import React from 'react';
import { ChatMessage } from './types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  lang: 'ar' | 'en';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, lang }) => {
  const isVisitor = message.senderType === 'visitor';
  const isSystem  = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
          {message.messageText}
        </span>
      </div>
    );
  }

  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-PS' : 'en-US', {
        hour:   '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={`flex ${isVisitor ? 'justify-end' : 'justify-start'} mb-2`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {!isVisitor && (
        <div className="w-7 h-7 rounded-full bg-[#002B49] flex items-center justify-center text-[#FFCD00] text-xs font-bold mr-2 mt-1 shrink-0">
          W
        </div>
      )}
      <div className={`max-w-[75%] ${isVisitor ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
            isVisitor
              ? 'bg-[#002B49] text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          } ${message.pending ? 'opacity-60' : ''}`}
        >
          {message.messageText}
        </div>
        <span className="text-[10px] text-gray-400 mt-0.5 px-1">{time}</span>
      </div>
    </div>
  );
};
