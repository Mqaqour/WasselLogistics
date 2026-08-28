import React from 'react';

interface WaitingIndicatorProps {
  lang: 'ar' | 'en';
}

// Shown while the customer's last message hasn't been answered yet, so the
// conversation never feels ignored even though respond.io gives no real typing signal.
export const WaitingIndicator: React.FC<WaitingIndicatorProps> = ({ lang }) => (
  <div className="flex justify-start mb-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2.5 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
    </div>
  </div>
);
