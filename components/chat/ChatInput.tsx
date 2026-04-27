import React, { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  lang: 'ar' | 'en';
  disabled?: boolean;
  onSend: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ lang, disabled, onSend }) => {
  const [text, setText] = useState('');
  const isAr = lang === 'ar';

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex items-end gap-2 border-t border-gray-100 p-3 bg-white"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <textarea
        rows={1}
        maxLength={7000}
        disabled={disabled}
        placeholder={isAr ? 'اكتب رسالتك...' : 'Type your message...'}
        className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] outline-none disabled:opacity-50 max-h-28 overflow-y-auto"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#002B49] text-white hover:bg-[#003a61] transition-colors disabled:opacity-40"
        aria-label={isAr ? 'إرسال' : 'Send'}
      >
        {disabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
        )}
      </button>
    </div>
  );
};
