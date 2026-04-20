import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Minimize2 } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { getGeminiResponse } from '../services/geminiService';

interface ChatBotProps {
    lang: Language;
    isOpen: boolean;
    onClose: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ lang, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setMessages([
          { role: 'model', text: lang === 'en' ? 'Hello! I am the Wassel AI Assistant. How can I help you today with your shipment or rates?' : 'مرحباً! أنا مساعد واصل الذكي. كيف يمكنني مساعدتك اليوم بخصوص شحنتك أو أسعار الشحن؟' }
      ]);
  }, [lang]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const replyText = await getGeminiResponse(messages, input);
    
    setMessages(prev => [...prev, { role: 'model', text: replyText }]);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 rtl:left-6 ltr:right-6 w-80 sm:w-96 h-[450px] sm:h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 animate-slide-up">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full rtl:ml-2 ltr:mr-2"></div>
            <h3 className="font-semibold">{lang === 'en' ? 'Wassel Support AI' : 'الدعم الفني الذكي'}</h3>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-white">
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rtl:rounded-bl-none ltr:rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rtl:rounded-br-none ltr:rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white p-3 rounded-lg border border-gray-200 rtl:rounded-br-none ltr:rounded-bl-none shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder={lang === 'en' ? "Type your question..." : "اكتب سؤالك..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 disabled:opacity-50"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </form>
    </div>
  );
};