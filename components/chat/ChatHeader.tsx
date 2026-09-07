import React from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { CopilotToggle } from '../shared/CopilotToggle';

interface ChatHeaderProps {
  lang: 'ar' | 'en';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClose: () => void;
}

/** Shared title bar for the chat widget — rendered above both the pre-chat form
 *  and the live conversation so the title / expand / close controls are always
 *  present, including on first open. */
export const ChatHeader: React.FC<ChatHeaderProps> = ({ lang, isExpanded, onToggleExpand, onClose }) => {
  const isAr = lang === 'ar';
  const t = {
    title:    isAr ? 'مساعد واصل الذكي' : 'Wassel AI Assistant',
    expand:   isAr ? 'توسيع كشريط جانبي' : 'Expand to sidebar',
    collapse: isAr ? 'طي إلى نافذة عائمة' : 'Collapse to floating',
    close:    isAr ? 'إغلاق' : 'Close',
  };

  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 border-b border-gray-100 bg-white">
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <CopilotToggle size={26} interactive={false} label={t.title} className="shrink-0" />
        <span className="text-sm font-medium truncate block text-gray-900">{t.title}</span>
      </div>
      <div className="flex items-center gap-0.5 text-gray-600">
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            title={isExpanded ? t.collapse : t.expand}
            aria-label={isExpanded ? t.collapse : t.expand}
            className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={onClose}
          aria-label={t.close}
          title={t.close}
          className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
