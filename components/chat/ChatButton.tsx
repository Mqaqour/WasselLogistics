import React from 'react';
import { MessageCircle, X } from 'lucide-react';

interface ChatButtonProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  onClick: () => void;
  unreadCount?: number;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ isOpen, lang, onClick, unreadCount = 0 }) => {
  const label = lang === 'ar' ? 'تواصل مع واصل' : 'Chat with Wassel';

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#002B49] px-4 py-3 text-white shadow-2xl hover:bg-[#003a61] transition-all duration-300 hover:scale-105 active:scale-95"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <>
          <MessageCircle className="w-6 h-6 text-[#FFCD00]" />
          <span className="text-sm font-bold hidden sm:inline">{label}</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  );
};
