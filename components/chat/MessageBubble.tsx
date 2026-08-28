import React from 'react';
import { Paperclip, Check } from 'lucide-react';
import { ChatMessage } from './types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  lang: 'ar' | 'en';
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i;
// Uploads are stored server-side as "<uuid><ext>" (see backend utils/chatUploads.ts).
// When history is reloaded the original name is lost, so the URL basename is just an
// opaque UUID like "28881b7f-1edb-40c3-b273-117a0372bcd3.pdf" — not worth showing.
const OPAQUE_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extensionOf(nameOrUrl: string): string {
  const m = /\.([a-z0-9]{1,10})(?:\?|$)/i.exec(nameOrUrl);
  return m ? m[1].toUpperCase() : '';
}

// Attachments are forwarded to respond.io and the server copy is deleted straight
// after (see backend utils/chatUploads.ts), so there is nothing to link back to.
// The bubble just confirms the file left the visitor's side.
function AttachmentContent({ url, fileName, lang }: { url: string; fileName?: string; lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const probe = fileName ?? url;
  const rawName = fileName ?? decodeURIComponent(url.split('/').pop() ?? '');
  const hasRealName = !!rawName && !OPAQUE_NAME_RE.test(rawName);
  const ext = extensionOf(probe);

  const typeLabel = IMAGE_EXT_RE.test(probe)
    ? isAr ? 'صورة' : 'Image'
    : VIDEO_EXT_RE.test(probe)
      ? isAr ? 'فيديو' : 'Video'
      : AUDIO_EXT_RE.test(probe)
        ? isAr ? 'ملف صوتي' : 'Audio file'
        : ext === 'PDF'
          ? isAr ? 'مستند PDF' : 'PDF document'
          : isAr ? 'ملف مرفق' : 'Attachment';
  const label = hasRealName ? rawName : typeLabel;

  return (
    <div className="flex w-full max-w-[16rem] items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 text-start">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#002B49]/5 text-[#002B49]">
        <Paperclip className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-gray-800">{label}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600">
          <Check className="w-3 h-3 shrink-0" />
          {isAr ? 'تم الإرسال بنجاح' : 'Sent successfully'}
        </span>
      </span>
    </div>
  );
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
      <div className={`flex flex-col ${isVisitor ? 'max-w-[75%] items-end' : 'flex-1 min-w-0 items-start'}`}>
        {isVisitor ? (
          <div
            className={`rounded-2xl text-sm leading-relaxed break-words text-gray-900 ${message.attachmentUrl ? '' : 'bg-gray-100 px-3.5 py-2'} ${message.pending ? 'opacity-60' : ''}`}
          >
            {message.attachmentUrl
              ? <AttachmentContent url={message.attachmentUrl} fileName={message.attachmentFileName} lang={lang} />
              : message.messageText}
          </div>
        ) : (
          <div className={`w-full text-sm leading-relaxed break-words text-gray-900 ${message.pending ? 'opacity-60' : ''}`}>
            {message.attachmentUrl
              ? <AttachmentContent url={message.attachmentUrl} fileName={message.attachmentFileName} lang={lang} />
              : message.messageText}
          </div>
        )}
        <span className="text-[10px] text-gray-400 mt-0.5 px-1">{time}</span>
      </div>
    </div>
  );
};
