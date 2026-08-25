import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../../types';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Loader2, Tag, RefreshCw, X, Pencil, Save, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

// ── RichTextarea — supports Ctrl+B (bold), toolbar buttons for lists ──────────
interface RichTextareaProps {
  value: string;
  onChange: (val: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  rows?: number;
  className?: string;
  dir?: string;
  title?: string;
  placeholder?: string;
}

const RichTextarea: React.FC<RichTextareaProps> = ({ value, onChange, onUploadImage, rows = 4, className = '', dir, title, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const imgUploadInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedSelRef  = useRef({ start: 0, end: 0 });
  const [showImgInput,  setShowImgInput]  = useState(false);
  const [imgUrl,        setImgUrl]        = useState('');
  const [imgUploadError, setImgUploadError] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl,       setLinkUrl]       = useState('');

  const wrapSelection = (before: string, after: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const selected = value.slice(start, end);
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertImageAtSelection = (url: string) => {
    const el = ref.current;
    const pos = el ? el.selectionStart : savedSelRef.current.start;
    const snippet = `![](${url})`;
    onChange(value.slice(0, pos) + snippet + value.slice(pos));
    setTimeout(() => { el?.focus(); }, 0);
  };

  const insertImage = () => {
    const url = imgUrl.trim();
    if (!url) return;
    insertImageAtSelection(url);
    setImgUrl('');
    setImgUploadError('');
    setShowImgInput(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !onUploadImage) {
      return;
    }

    setImgUploading(true);
    setImgUploadError('');

    try {
      const url = await onUploadImage(file);
      setImgUrl(url);
      insertImageAtSelection(url);
      setShowImgInput(false);
    } catch (error) {
      setImgUploadError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setImgUploading(false);
    }
  };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const { start, end } = savedSelRef.current;
    const selectedText = value.slice(start, end);
    const snippet = `[${selectedText}](${url})`;
    onChange(value.slice(0, start) + snippet + value.slice(end));
    setLinkUrl('');
    setShowLinkInput(false);
    setTimeout(() => {
      const el = ref.current;
      el?.focus();
      if (el) el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      wrapSelection('**', '**');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const el = ref.current;
      if (el) savedSelRef.current = { start: el.selectionStart, end: el.selectionEnd };
      setShowLinkInput(v => !v);
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
  };

  return (
    <div>
      <div className="flex gap-1 mb-1 flex-wrap">
        <button type="button" title="Bold — Ctrl+B" onClick={() => wrapSelection('**', '**')}
          className="px-2 py-0.5 text-xs font-bold border border-gray-300 rounded hover:bg-gray-100 text-gray-700 leading-none">
          B
        </button>
        <button type="button" title="Bullet list" onClick={() => insertLinePrefix('- ')}
          className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600 leading-none">
          • قائمة
        </button>
        <button type="button" title="Numbered list" onClick={() => insertLinePrefix('1. ')}
          className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600 leading-none">
          1. مرقمة
        </button>
        <button
          type="button"
          title="Insert image"
          onMouseDown={() => {
            const el = ref.current;
            if (el) savedSelRef.current = { start: el.selectionStart, end: el.selectionEnd };
          }}
          onClick={() => {
            setImgUploadError('');
            setShowImgInput(v => !v);
            setTimeout(() => imgInputRef.current?.focus(), 50);
          }}
          className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600 leading-none"
        >
          🖼 صورة
        </button>
        <button
          type="button"
          title="Insert link — Ctrl+K"
          onMouseDown={() => { const el = ref.current; if (el) savedSelRef.current = { start: el.selectionStart, end: el.selectionEnd }; }}
          onClick={() => { setShowLinkInput(v => !v); setTimeout(() => linkInputRef.current?.focus(), 50); }}
          className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600 leading-none"
        >
          🔗 رابط
        </button>
      </div>
      {showLinkInput && (
        <div className="flex gap-1 mb-1" dir="ltr">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); insertLink(); }
              if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
            }}
          />
          <button type="button" onClick={insertLink}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            إدراج
          </button>
          <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600">
            إلغاء
          </button>
        </div>
      )}
      {showImgInput && (
        <div className="flex gap-1 mb-1" dir="ltr">
          <input
            ref={imgInputRef}
            type="url"
            value={imgUrl}
            onChange={e => setImgUrl(e.target.value)}
            placeholder="https://example.com/image.jpg or /uploads/projects/image.webp"
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); insertImage(); }
              if (e.key === 'Escape') { setShowImgInput(false); setImgUrl(''); setImgUploadError(''); }
            }}
          />
          <button type="button" onClick={insertImage}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            إدراج
          </button>
          <button type="button" onClick={() => { setShowImgInput(false); setImgUrl(''); setImgUploadError(''); }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600">
            إلغاء
          </button>
        </div>
      )}
      {showImgInput && (
        <div className="flex items-center gap-2 mb-1">
          <input
            ref={imgUploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => imgUploadInputRef.current?.click()}
            disabled={!onUploadImage || imgUploading}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-50"
          >
            {imgUploading ? 'Uploading...' : 'Upload image'}
          </button>
          <span className="text-[11px] text-gray-400">JPG, PNG, WebP</span>
          {imgUploadError && <span className="text-[11px] text-red-500">{imgUploadError}</span>}
        </div>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={className}
        dir={dir}
        title={title}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface KbAdminTopic {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

interface KbAdminQuestion {
  questionId: number;
  topicCode: string;
  topicName: string;
  intentKey: string;
  priority: number;
  isActive: boolean;
  isRevised: boolean;
  questionText: string;
  answerText: string;
}

interface KbAdminTag {
  id: number;
  languageCode: string;
  name: string;
}

interface QuestionEditData {
  id: number;
  intentKey: string;
  priority: number;
  isActive: boolean;
  isRevised: boolean;
  topicCode: string;
  translations: Array<{ languageCode: string; questionText: string; answerText: string; keywords: string[] }>;
}

interface TopicEditData {
  id: number;
  code: string;
  isActive: boolean;
  translations: Array<{ languageCode: string; name: string; description: string | null }>;
}

interface AiSuggestion {
  intentKey: string;
  questionAr: string;
  answerAr: string;
  questionEn: string;
  answerEn: string;
  keywordsAr: string; // comma-separated
  keywordsEn: string;
  suggestedTagsAr: string[];
  suggestedTagsEn: string[];
  status: 'idle' | 'saving' | 'saved' | 'error';
  error?: string;
}

interface ResourceCategory {
  id: number;
  code: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface UploadedProjectImageResponse {
  url?: string;
  error?: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const api = {
  getTopics:   (lang: string) =>
    fetch(`/api/topics?language=${lang}`).then(r => r.json()),
  createTopic: (body: object) =>
    fetch('/api/topics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteTopic: (id: number) =>
    fetch(`/api/topics/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getQuestions: (lang: string, topicCode?: string) => {
    const qs = topicCode
      ? `?language=${lang}&topicCode=${encodeURIComponent(topicCode)}`
      : `?language=${lang}`;
    return fetch(`/api/questions${qs}`).then(r => r.json());
  },
  createQuestion: (body: object) =>
    fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteQuestion: (id: number) =>
    fetch(`/api/questions/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getQuestionTags: (id: number) =>
    fetch(`/api/questions/${id}/tags`).then(r => r.json()),
  addTagToQuestion: (questionId: number, tagId: number) =>
    fetch(`/api/questions/${questionId}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tagId }) }).then(r => r.json()),
  removeTagFromQuestion: (questionId: number, tagId: number) =>
    fetch(`/api/questions/${questionId}/tags/${tagId}`, { method: 'DELETE' }).then(r => r.json()),

  getTags: () =>
    fetch('/api/tags').then(r => r.json()),
  createTag: (body: object) =>
    fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteTag: (id: number) =>
    fetch(`/api/tags/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getQuestionForEdit: (id: number) =>
    fetch(`/api/questions/${id}/edit`).then(r => r.json()),
  updateQuestion: (id: number, body: object) =>
    fetch(`/api/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  getTopicById: (id: number) =>
    fetch(`/api/topics/${id}`).then(r => r.json()),
  updateTopic: (id: number, body: object) =>
    fetch(`/api/topics/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  generateKb: (body: object) =>
    fetch('/api/kb/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),

  getResourceCategories: () =>
    fetch('/api/resource-categories').then(r => r.json()),
  createResourceCategory: (body: object) =>
    fetch('/api/resource-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateResourceCategory: (id: number, body: object) =>
    fetch(`/api/resource-categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteResourceCategory: (id: number) =>
    fetch(`/api/resource-categories/${id}`, { method: 'DELETE' }).then(r => r.json()),
  uploadProjectImage: async (file: File): Promise<UploadedProjectImageResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/uploads/projects', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  },

  getSubItems: (categoryCode: string) =>
    fetch(`/api/resource-sub-items?categoryCode=${encodeURIComponent(categoryCode)}`).then(r => r.json()),
  createSubItem: (body: object) =>
    fetch('/api/resource-sub-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateSubItem: (id: number, body: object) =>
    fetch(`/api/resource-sub-items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteSubItem: (id: number) =>
    fetch(`/api/resource-sub-items/${id}`, { method: 'DELETE' }).then(r => r.json()),
};

async function uploadProjectImageFile(file: File): Promise<string> {
  const result = await api.uploadProjectImage(file);
  if (!result.url) {
    throw new Error(result.error ?? 'Image upload failed.');
  }
  return result.url;
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const cls = {
  input:   'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',
  btnPrim: 'bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 transition-colors',
  btnSec:  'px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors',
  btnDel:  'text-red-400 hover:text-red-600 p-1 rounded transition-colors',
  card:    'bg-white border border-gray-100 rounded-xl shadow-sm',
  th:      'px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide',
  td:      'px-4 py-3 text-sm',
};

// ── Flash helper ──────────────────────────────────────────────────────────────

function Flash({ msg, onDismiss }: { msg: { text: string; ok: boolean } | null; onDismiss: () => void }) {
  if (!msg) return null;
  return (
    <div
      className={`flex items-center justify-between mb-4 px-4 py-3 rounded-lg text-sm font-medium
        ${msg.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
    >
      <span>{msg.text}</span>
      <button onClick={onDismiss} title="إغلاق" className="ms-4 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Modal overlay ─────────────────────────────────────────────────────────────

function ModalOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} title="إغلاق" className="text-gray-400 hover:text-gray-700 p-1 rounded"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── EditQuestionModal ─────────────────────────────────────────────────────────

function EditQuestionModal({ questionId, onClose, onSaved, flash }: {
  questionId: number;
  onClose: () => void;
  onSaved: () => void;
  flash: (text: string, ok: boolean) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<QuestionEditData | null>(null);
  const [form, setForm] = useState({
    priority: '5', isActive: true, isRevised: false,
    questionAr: '', answerAr: '', keywordsAr: '',
    questionEn: '', answerEn: '', keywordsEn: '',
  });

  useEffect(() => {
    api.getQuestionForEdit(questionId).then((d: QuestionEditData) => {
      setData(d);
      const ar = d.translations.find((t: { languageCode: string }) => t.languageCode === 'ar');
      const en = d.translations.find((t: { languageCode: string }) => t.languageCode === 'en');
      setForm({
        priority: String(d.priority), isActive: d.isActive, isRevised: d.isRevised,
        questionAr: ar?.questionText ?? '', answerAr: ar?.answerText ?? '',
        keywordsAr: ar?.keywords.join(', ') ?? '',
        questionEn: en?.questionText ?? '', answerEn: en?.answerText ?? '',
        keywordsEn: en?.keywords.join(', ') ?? '',
      });
      setLoading(false);
    }).catch(() => { flash('فشل تحميل بيانات السؤال', false); onClose(); });
  }, [questionId, flash, onClose]);

  const handleSave = async () => {
    setSaving(true);
    const translations = [
      { languageCode: 'ar', questionText: form.questionAr, answerText: form.answerAr, keywords: form.keywordsAr.split(',').map(s => s.trim()).filter(Boolean) },
      ...(form.questionEn || form.answerEn ? [{ languageCode: 'en', questionText: form.questionEn, answerText: form.answerEn, keywords: form.keywordsEn.split(',').map(s => s.trim()).filter(Boolean) }] : []),
    ];
    const res = await api.updateQuestion(questionId, {
      priority: parseInt(form.priority, 10) || 5,
      isActive: form.isActive,
      isRevised: form.isRevised,
      translations,
    });
    setSaving(false);
    if (res.updated) { flash('✓ تم حفظ التعديلات', true); onSaved(); onClose(); }
    else flash(res.error ?? 'فشل الحفظ', false);
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <ModalOverlay title={`تعديل السؤال #${questionId}${data ? ` — ${data.intentKey}` : ''}`} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الأولوية</label>
              <input className={inputCls} type="number" dir="ltr" title="الأولوية" min={1} max={20} value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} />
            </div>
            <div className="flex items-end gap-4 pb-1 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                نشط
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isRevised} onChange={e => setForm(f => ({ ...f, isRevised: e.target.checked }))} />
                Revised
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/40">
            <p className="text-xs font-bold text-gray-500">العربي</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">نص السؤال *</label>
              <input className={inputCls} title="نص السؤال بالعربي" value={form.questionAr} onChange={e => setForm(f => ({ ...f, questionAr: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الجواب *</label>
              <RichTextarea rows={4} title="الجواب بالعربي" className={inputCls} value={form.answerAr} onChange={val => setForm(f => ({ ...f, answerAr: val }))} onUploadImage={uploadProjectImageFile} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">كلمات مفتاحية (مفصولة بفاصلة)</label>
              <input className={inputCls} title="كلمات مفتاحية عربي" value={form.keywordsAr} onChange={e => setForm(f => ({ ...f, keywordsAr: e.target.value }))} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/40">
            <p className="text-xs font-bold text-gray-400">English (optional)</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Question text</label>
              <input className={inputCls} title="Question text in English" dir="ltr" value={form.questionEn} onChange={e => setForm(f => ({ ...f, questionEn: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Answer</label>
              <RichTextarea rows={4} title="Answer in English" className={inputCls} dir="ltr" value={form.answerEn} onChange={val => setForm(f => ({ ...f, answerEn: val }))} onUploadImage={uploadProjectImageFile} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Keywords</label>
              <input className={inputCls} title="Keywords in English" dir="ltr" value={form.keywordsEn} onChange={e => setForm(f => ({ ...f, keywordsEn: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
              onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} حفظ التعديلات
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" onClick={onClose}>إلغاء</button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}

// ── EditTopicModal ─────────────────────────────────────────────────────────────

function EditTopicModal({ topicId, onClose, onSaved, flash }: {
  topicId: number;
  onClose: () => void;
  onSaved: () => void;
  flash: (text: string, ok: boolean) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nameAr: '', descAr: '', nameEn: '', descEn: '' });

  useEffect(() => {
    api.getTopicById(topicId).then((d: TopicEditData) => {
      const ar = d.translations.find((t: { languageCode: string }) => t.languageCode === 'ar');
      const en = d.translations.find((t: { languageCode: string }) => t.languageCode === 'en');
      setForm({ nameAr: ar?.name ?? '', descAr: ar?.description ?? '', nameEn: en?.name ?? '', descEn: en?.description ?? '' });
      setLoading(false);
    }).catch(() => { flash('فشل تحميل بيانات الموضوع', false); onClose(); });
  }, [topicId, flash, onClose]);

  const handleSave = async () => {
    if (!form.nameAr.trim()) { flash('الاسم بالعربي مطلوب', false); return; }
    setSaving(true);
    const translations = [
      { languageCode: 'ar', name: form.nameAr, description: form.descAr || null },
      ...(form.nameEn ? [{ languageCode: 'en', name: form.nameEn, description: form.descEn || null }] : []),
    ];
    const res = await api.updateTopic(topicId, { translations });
    setSaving(false);
    if (res.updated) { flash('✓ تم حفظ التعديلات', true); onSaved(); onClose(); }
    else flash(res.error ?? 'فشل الحفظ', false);
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <ModalOverlay title={`تعديل الموضوع #${topicId}`} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/40">
            <p className="text-xs font-bold text-gray-500">العربي</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم *</label>
              <input className={inputCls} title="اسم الموضوع بالعربي" value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الوصف</label>
              <textarea rows={3} title="وصف الموضوع بالعربي" className={inputCls} value={form.descAr} onChange={e => setForm(f => ({ ...f, descAr: e.target.value }))} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/40">
            <p className="text-xs font-bold text-gray-400">English (optional)</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input className={inputCls} title="Topic name in English" dir="ltr" value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea rows={3} title="Topic description in English" className={inputCls} dir="ltr" value={form.descEn} onChange={e => setForm(f => ({ ...f, descEn: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
              onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} حفظ التعديلات
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg" onClick={onClose}>إلغاء</button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface KnowledgeBaseAdminProps { lang: Language; }

export const KnowledgeBaseAdmin: React.FC<KnowledgeBaseAdminProps> = ({ lang }) => {
  const isRtl = lang === 'ar';

  // ── Global state ────────────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState<'topics' | 'questions' | 'tags' | 'ai' | 'resources'>('topics');
  const [topics,      setTopics]      = useState<KbAdminTopic[]>([]);
  const [questions,   setQuestions]   = useState<KbAdminQuestion[]>([]);
  const [tags,        setTags]        = useState<KbAdminTag[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [searchQ,     setSearchQ]     = useState('');

  // Edit modals
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null);
  const [editTopicId,    setEditTopicId]    = useState<number | null>(null);

  // AI generation tab state
  const [aiTopicCode,    setAiTopicCode]    = useState('');
  const [aiDescription,  setAiDescription]  = useState('');
  const [aiCount,        setAiCount]        = useState(5);
  const [aiSuggestions,  setAiSuggestions]  = useState<AiSuggestion[]>([]);
  const [aiLoading,      setAiLoading]      = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);

  // Resource categories tab state
  const [resCategories,   setResCategories]   = useState<ResourceCategory[]>([]);
  const [resLoading,      setResLoading]      = useState(false);
  const [showResForm,     setShowResForm]     = useState(false);
  const [editResId,       setEditResId]       = useState<number | null>(null);
  const [resForm,         setResForm]         = useState({
    code: '', titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', imageUrl: '', sortOrder: '0',
  });
  const resImageInputRef = useRef<HTMLInputElement>(null);
  const [resImageUploading, setResImageUploading] = useState(false);
  const [resImageError, setResImageError] = useState('');

  // Sub-items management (expand per category)
  const [expandedResCatCode,  setExpandedResCatCode]  = useState<string | null>(null);
  const [subItemsMap,         setSubItemsMap]         = useState<Record<string, Array<{id:number;category_code:string;title_ar:string;title_en:string|null;sort_order:number;is_active:boolean}>>>({});
  const [subItemsLoading,     setSubItemsLoading]     = useState<string | null>(null);
  const [showSubForm,         setShowSubForm]         = useState(false);
  const [editSubId,           setEditSubId]           = useState<number | null>(null);
  const [subForm,             setSubForm]             = useState({ titleAr: '', titleEn: '', sortOrder: '0' });

  // Expand question row state
  const [expandedQ,   setExpandedQ]   = useState<number | null>(null);
  const [qTags,       setQTags]       = useState<KbAdminTag[]>([]);
  const [qTagsLoading, setQTagsLoading] = useState(false);
  const [revisedSavingIds, setRevisedSavingIds] = useState<number[]>([]);

  // Expand topic row state
  const [expandedTopicCode,   setExpandedTopicCode]   = useState<string | null>(null);
  const [topicQuestionsMap,   setTopicQuestionsMap]   = useState<Record<string, KbAdminQuestion[]>>({});
  const [topicQLoading,       setTopicQLoading]       = useState<string | null>(null);

  // ── Forms ───────────────────────────────────────────────────────────────────
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicForm, setTopicForm] = useState({ code: '', nameAr: '', nameEn: '', descAr: '', descEn: '' });

  const [showQForm, setShowQForm] = useState(false);
  const [qForm, setQForm] = useState({
    topicCode: '', intentKey: '', priority: '5',
    isRevised: false,
    questionAr: '', answerAr: '', questionEn: '', answerEn: '',
    keywordsAr: '', keywordsEn: '',
  });

  const [showTagForm, setShowTagForm] = useState(false);
  const [tagForm, setTagForm] = useState({ languageCode: 'ar', name: '' });

  // ── Data loading ────────────────────────────────────────────────────────────
  const flash = useCallback((text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const loadTopics = useCallback(async () => {
    const data = await api.getTopics('ar');
    setTopics(data.topics ?? []);
  }, []);

  const loadQuestions = useCallback(async () => {
    const data = await api.getQuestions('ar', filterTopic || undefined);
    setQuestions(data.questions ?? []);
  }, [filterTopic]);

  const loadTags = useCallback(async () => {
    const data = await api.getTags();
    setTags(data.tags ?? []);
  }, []);

  const loadResCategories = useCallback(async () => {
    const data = await api.getResourceCategories();
    setResCategories(data.categories ?? []);
  }, []);

  useEffect(() => { loadTopics(); loadTags(); loadResCategories(); }, [loadTopics, loadTags, loadResCategories]);
  useEffect(() => { if (activeTab === 'questions') loadQuestions(); }, [activeTab, loadQuestions]);

  // ── Expand topic row ────────────────────────────────────────────────────────
  const toggleTopicExpand = async (topicCode: string) => {
    if (expandedTopicCode === topicCode) { setExpandedTopicCode(null); return; }
    setExpandedTopicCode(topicCode);
    if (!topicQuestionsMap[topicCode]) {
      setTopicQLoading(topicCode);
      try {
        const data = await api.getQuestions('ar', topicCode);
        setTopicQuestionsMap(m => ({ ...m, [topicCode]: data.questions ?? [] }));
      } finally { setTopicQLoading(null); }
    }
  };

  // ── Expand question row ─────────────────────────────────────────────────────
  const toggleExpand = async (qId: number) => {
    if (expandedQ === qId) { setExpandedQ(null); setQTags([]); return; }
    setExpandedQ(qId);
    setQTagsLoading(true);
    try {
      const data = await api.getQuestionTags(qId);
      setQTags(data.tags ?? []);
    } finally { setQTagsLoading(false); }
  };

  // ── Topic handlers ──────────────────────────────────────────────────────────
  const handleCreateTopic = async () => {
    if (!topicForm.code.trim() || !topicForm.nameAr.trim())
      return flash('الكود والاسم بالعربي مطلوبان', false);
    setLoading(true);
    const res = await api.createTopic({
      code: topicForm.code.trim().toUpperCase().replace(/\s+/g, '_'),
      translations: [
        { languageCode: 'ar', name: topicForm.nameAr, description: topicForm.descAr || undefined },
        ...(topicForm.nameEn ? [{ languageCode: 'en', name: topicForm.nameEn, description: topicForm.descEn || undefined }] : []),
      ],
    });
    setLoading(false);
    if (res.topicId) {
      flash(`✓ تم إنشاء الموضوع (id=${res.topicId})`, true);
      setTopicForm({ code: '', nameAr: '', nameEn: '', descAr: '', descEn: '' });
      setShowTopicForm(false);
      loadTopics();
    } else flash(res.error ?? 'فشل الإنشاء', false);
  };

  const handleDeleteTopic = async (id: number, code: string) => {
    if (!window.confirm(`حذف الموضوع "${code}" وجميع أسئلته؟ لا يمكن التراجع.`)) return;
    setLoading(true);
    const res = await api.deleteTopic(id);
    setLoading(false);
    if (res.deleted) { flash('تم حذف الموضوع', true); loadTopics(); loadQuestions(); }
    else flash(res.error ?? 'فشل الحذف', false);
  };

  // ── Question handlers ───────────────────────────────────────────────────────
  const handleCreateQuestion = async () => {
    if (!qForm.topicCode || !qForm.intentKey.trim() || !qForm.questionAr.trim() || !qForm.answerAr.trim())
      return flash('الموضوع، المفتاح، السؤال والجواب بالعربي مطلوبة', false);
    setLoading(true);
    const kwAr = qForm.keywordsAr.split(',').map(s => s.trim()).filter(Boolean).map(k => ({ languageCode: 'ar', keyword: k }));
    const kwEn = qForm.keywordsEn.split(',').map(s => s.trim()).filter(Boolean).map(k => ({ languageCode: 'en', keyword: k }));
    const res = await api.createQuestion({
      topicCode: qForm.topicCode,
      intentKey: qForm.intentKey.trim().replace(/\s+/g, '_').toLowerCase(),
      priority:  parseInt(qForm.priority, 10) || 5,
      isRevised: qForm.isRevised,
      translations: [
        { languageCode: 'ar', questionText: qForm.questionAr, answerText: qForm.answerAr },
        ...(qForm.questionEn && qForm.answerEn
          ? [{ languageCode: 'en', questionText: qForm.questionEn, answerText: qForm.answerEn }]
          : []),
      ],
      keywords: [...kwAr, ...kwEn],
    });
    setLoading(false);
    if (res.questionId) {
      flash(`✓ تم إنشاء السؤال (id=${res.questionId})`, true);
      setQForm({ topicCode: '', intentKey: '', priority: '5', isRevised: false, questionAr: '', answerAr: '', questionEn: '', answerEn: '', keywordsAr: '', keywordsEn: '' });
      setShowQForm(false);
      loadQuestions();
    } else flash(res.error ?? 'فشل الإنشاء', false);
  };

  const handleDeleteQuestion = async (id: number, key: string) => {
    if (!window.confirm(`حذف السؤال "${key}"؟`)) return;
    setLoading(true);
    const res = await api.deleteQuestion(id);
    setLoading(false);
    if (res.deleted) { flash('تم حذف السؤال', true); if (expandedQ === id) { setExpandedQ(null); setQTags([]); } loadQuestions(); }
    else flash(res.error ?? 'فشل الحذف', false);
  };

  // ── Tag handlers ────────────────────────────────────────────────────────────
  const handleToggleRevised = async (questionId: number, isRevised: boolean) => {
    setRevisedSavingIds(ids => ids.includes(questionId) ? ids : [...ids, questionId]);

    setQuestions(items => items.map(item => (
      item.questionId === questionId ? { ...item, isRevised } : item
    )));
    setTopicQuestionsMap(map => Object.fromEntries(
      Object.entries(map).map(([topicCode, items]) => [
        topicCode,
        items.map(item => item.questionId === questionId ? { ...item, isRevised } : item),
      ])
    ));

    const res = await api.updateQuestion(questionId, { isRevised });

    setRevisedSavingIds(ids => ids.filter(id => id !== questionId));

    if (!res.updated) {
      setQuestions(items => items.map(item => (
        item.questionId === questionId ? { ...item, isRevised: !isRevised } : item
      )));
      setTopicQuestionsMap(map => Object.fromEntries(
        Object.entries(map).map(([topicCode, items]) => [
          topicCode,
          items.map(item => item.questionId === questionId ? { ...item, isRevised: !isRevised } : item),
        ])
      ));
      flash(res.error ?? 'ÙØ´Ù„ Ø­ÙØ¸ Ø­Ø§Ù„Ø© Revised', false);
    }
  };

  const handleCreateTag = async () => {
    if (!tagForm.name.trim()) return flash('اسم الوسم مطلوب', false);
    setLoading(true);
    const res = await api.createTag({ languageCode: tagForm.languageCode, name: tagForm.name.trim() });
    setLoading(false);
    if (res.tagId) {
      flash(`✓ تم إنشاء الوسم (id=${res.tagId})`, true);
      setTagForm({ languageCode: 'ar', name: '' });
      setShowTagForm(false);
      loadTags();
    } else flash(res.error ?? 'فشل الإنشاء', false);
  };

  const handleDeleteTag = async (id: number, name: string) => {
    if (!window.confirm(`حذف الوسم "${name}"؟ سيُزال من جميع الأسئلة.`)) return;
    setLoading(true);
    const res = await api.deleteTag(id);
    setLoading(false);
    if (res.deleted) { flash('تم حذف الوسم', true); loadTags(); }
    else flash(res.error ?? 'فشل الحذف', false);
  };

  const handleLinkTag = async (questionId: number, tagId: number) => {
    setQTagsLoading(true);
    await api.addTagToQuestion(questionId, tagId);
    const data = await api.getQuestionTags(questionId);
    setQTags(data.tags ?? []);
    setQTagsLoading(false);
  };

  const handleUnlinkTag = async (questionId: number, tagId: number) => {
    setQTagsLoading(true);
    await api.removeTagFromQuestion(questionId, tagId);
    const data = await api.getQuestionTags(questionId);
    setQTags(data.tags ?? []);
    setQTagsLoading(false);
  };

  // ── Resource category handlers ────────────────────────────────────────────

  const resetResForm = () => {
    setResForm({ code: '', titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', imageUrl: '', sortOrder: '0' });
    setResImageError('');
  };

  const handleUploadResImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setResImageUploading(true);
    setResImageError('');

    try {
      const url = await uploadProjectImageFile(file);
      setResForm(f => ({ ...f, imageUrl: url }));
    } catch (error) {
      setResImageError(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setResImageUploading(false);
    }
  };

  const handleSaveResCategory = async () => {
    if (!resForm.titleAr.trim()) return flash('العنوان بالعربي مطلوب', false);
    if (!editResId && !resForm.code.trim()) return flash('الكود مطلوب', false);
    setResLoading(true);
    const body = {
      titleAr:       resForm.titleAr.trim(),
      titleEn:       resForm.titleEn.trim() || undefined,
      descriptionAr: resForm.descriptionAr.trim() || undefined,
      descriptionEn: resForm.descriptionEn.trim() || undefined,
      imageUrl:      resForm.imageUrl.trim() || undefined,
      sortOrder:     parseInt(resForm.sortOrder, 10) || 0,
    };
    const res = editResId
      ? await api.updateResourceCategory(editResId, body)
      : await api.createResourceCategory({ ...body, code: resForm.code.trim() });
    setResLoading(false);
    if (res.categoryId || res.updated) {
      flash(editResId ? '✓ تم حفظ التعديلات' : '✓ تمت إضافة البطاقة', true);
      resetResForm(); setShowResForm(false); setEditResId(null);
      loadResCategories();
    } else flash(res.error ?? 'فشل الحفظ', false);
  };

  const handleDeleteResCategory = async (id: number, code: string) => {
    if (!window.confirm(`حذف بطاقة "${code}"؟`)) return;
    const res = await api.deleteResourceCategory(id);
    if (res.deleted) { flash('تم الحذف', true); loadResCategories(); }
    else flash(res.error ?? 'فشل الحذف', false);
  };

  const handleToggleResActive = async (id: number, current: boolean) => {
    const res = await api.updateResourceCategory(id, { isActive: !current });
    if (res.updated) loadResCategories();
    else flash(res.error ?? 'فشل التحديث', false);
  };

  // ── Sub-items handlers ────────────────────────────────────────────────────────
  const loadSubItems = async (catCode: string) => {
    setSubItemsLoading(catCode);
    try {
      const data = await api.getSubItems(catCode);
      setSubItemsMap(m => ({ ...m, [catCode]: data.items ?? [] }));
    } finally {
      setSubItemsLoading(null);
    }
  };

  const handleToggleSubExpand = async (catCode: string) => {
    if (expandedResCatCode === catCode) { setExpandedResCatCode(null); return; }
    setExpandedResCatCode(catCode);
    setShowSubForm(false); setEditSubId(null); setSubForm({ titleAr: '', titleEn: '', sortOrder: '0' });
    if (!subItemsMap[catCode]) await loadSubItems(catCode);
  };

  const handleSaveSubItem = async (catCode: string) => {
    if (!subForm.titleAr.trim()) return flash('العنوان بالعربي مطلوب', false);
    const body = {
      categoryCode: catCode,
      titleAr: subForm.titleAr.trim(),
      titleEn: subForm.titleEn.trim() || undefined,
      sortOrder: Number(subForm.sortOrder) || 0,
    };
    const res = editSubId
      ? await api.updateSubItem(editSubId, { titleAr: body.titleAr, titleEn: body.titleEn, sortOrder: body.sortOrder })
      : await api.createSubItem(body);
    if (res.item) {
      flash(editSubId ? 'تم التحديث' : 'تمت الإضافة', true);
      await loadSubItems(catCode);
      setShowSubForm(false); setEditSubId(null); setSubForm({ titleAr: '', titleEn: '', sortOrder: '0' });
    } else flash(res.error ?? 'فشل الحفظ', false);
  };

  const handleDeleteSubItem = async (id: number, catCode: string) => {
    if (!window.confirm('حذف هذا العنصر؟')) return;
    const res = await api.deleteSubItem(id);
    if (res.deleted) {
      flash('تم الحذف', true);
      setSubItemsMap(m => ({ ...m, [catCode]: (m[catCode] ?? []).filter(i => i.id !== id) }));
    } else flash(res.error ?? 'فشل الحذف', false);
  };

  const handleToggleSubActive = async (item: {id:number;is_active:boolean}, catCode: string) => {
    const res = await api.updateSubItem(item.id, { isActive: !item.is_active });
    if (res.item) {
      setSubItemsMap(m => ({ ...m, [catCode]: (m[catCode] ?? []).map(i => i.id === item.id ? { ...i, is_active: !item.is_active } : i) }));
    } else flash(res.error ?? 'فشل التحديث', false);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">لوحة إدارة قاعدة المعرفة</h1>
          <p className="text-gray-400 text-sm mt-1">إدارة المواضيع والأسئلة والوسوم الخاصة بالبوت</p>
        </div>

        <Flash msg={msg} onDismiss={() => setMsg(null)} />

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {(['topics', 'questions', 'tags', 'ai', 'resources'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'topics' ? 'المواضيع' : tab === 'questions' ? 'الأسئلة' : tab === 'tags' ? 'الوسوم' : tab === 'resources' ? 'بطاقات الموارد' : (
                <span className="flex items-center gap-1"><Sparkles size={13} /> توليد AI</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════ TOPICS TAB ══════════ */}
        {activeTab === 'topics' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{topics.length} موضوع</span>
              <div className="flex gap-2">
                <button title="تحديث" className={cls.btnSec} onClick={loadTopics}><RefreshCw size={14} /></button>
                <button className={cls.btnPrim} onClick={() => setShowTopicForm(v => !v)}>
                  <PlusCircle size={15} /> إضافة موضوع
                </button>
              </div>
            </div>

            {/* Add topic form */}
            {showTopicForm && (
              <div className={`${cls.card} p-5 border-blue-100 space-y-4`}>
                <h3 className="font-semibold text-gray-800">موضوع جديد</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الكود (بالإنجليزي، فريد) *</label>
                    <input className={cls.input} dir="ltr" placeholder="CUSTOMS_CLEARANCE"
                      value={topicForm.code} onChange={e => setTopicForm(f => ({ ...f, code: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الاسم بالعربي *</label>
                    <input title="الاسم بالعربي" className={cls.input}
                      value={topicForm.nameAr} onChange={e => setTopicForm(f => ({ ...f, nameAr: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الاسم بالإنجليزي</label>
                    <input title="الاسم بالإنجليزي" className={cls.input} dir="ltr"
                      value={topicForm.nameEn} onChange={e => setTopicForm(f => ({ ...f, nameEn: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الوصف بالعربي</label>
                    <input title="الوصف بالعربي" className={cls.input}
                      value={topicForm.descAr} onChange={e => setTopicForm(f => ({ ...f, descAr: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">الوصف بالإنجليزي</label>
                    <input title="الوصف بالإنجليزي" className={cls.input} dir="ltr"
                      value={topicForm.descEn} onChange={e => setTopicForm(f => ({ ...f, descEn: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={cls.btnPrim} onClick={handleCreateTopic} disabled={loading}>
                    {loading && <Loader2 size={14} className="animate-spin" />} حفظ
                  </button>
                  <button className={cls.btnSec} onClick={() => setShowTopicForm(false)}>إلغاء</button>
                </div>
              </div>
            )}

            {/* Topics table */}
            <div className={`${cls.card} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`${cls.th} w-8`}></th>
                    <th className={cls.th}>الكود</th>
                    <th className={cls.th}>الاسم</th>
                    <th className={cls.th}>الوصف</th>
                    <th className={`${cls.th} text-center`}>تعديل</th>
                    <th className={`${cls.th} text-center`}>حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topics.map(t => (
                    <React.Fragment key={t.id}>
                      <tr className="hover:bg-gray-50/60">
                        <td className={`${cls.td} text-center`}>
                          <button
                            className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                            title="عرض الأسئلة"
                            onClick={() => toggleTopicExpand(t.code)}
                          >
                            {expandedTopicCode === t.code ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                        <td className={`${cls.td} font-mono text-blue-700`}>{t.code}</td>
                        <td className={cls.td}>{t.name}</td>
                        <td className={`${cls.td} text-gray-400 max-w-xs truncate`}>{t.description ?? '—'}</td>
                        <td className={`${cls.td} text-center`}>
                          <button className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="تعديل" onClick={() => setEditTopicId(t.id)}>
                            <Pencil size={14} />
                          </button>
                        </td>
                        <td className={`${cls.td} text-center`}>
                          <button className={cls.btnDel} onClick={() => handleDeleteTopic(t.id, t.code)} title="حذف">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded: questions for this topic */}
                      {expandedTopicCode === t.code && (
                        <tr>
                          <td colSpan={6} className="bg-blue-50/30 px-6 pb-4 pt-2">
                            {topicQLoading === t.code ? (
                              <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                                <Loader2 size={14} className="animate-spin" /> جاري التحميل...
                              </div>
                            ) : (topicQuestionsMap[t.code] ?? []).length === 0 ? (
                              <p className="text-gray-400 text-sm py-3">لا توجد أسئلة لهذا الموضوع</p>
                            ) : (
                              <table className="w-full text-sm mt-1">
                                <thead>
                                  <tr className="text-xs text-gray-400 border-b border-gray-200">
                                    <th className="py-1.5 text-start font-semibold pe-4">#</th>
                                    <th className="py-1.5 text-start font-semibold pe-4">مفتاح النية</th>
                                    <th className="py-1.5 text-start font-semibold">نص السؤال</th>
                                    <th className="py-1.5 text-center font-semibold">تعديل</th>
                                    <th className="py-1.5 text-center font-semibold">حذف</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {(topicQuestionsMap[t.code] ?? []).map(q => (
                                    <tr key={q.questionId} className="hover:bg-white/60">
                                      <td className="py-2 pe-4 text-gray-300 font-mono text-xs">{q.questionId}</td>
                                      <td className="py-2 pe-4 font-mono text-xs text-gray-500 whitespace-nowrap">{q.intentKey}</td>
                                      <td className="py-2 text-gray-800">{q.questionText || <span className="text-gray-300 italic">لا يوجد نص</span>}</td>
                                      <td className="py-2 text-center">
                                        <button
                                          className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                                          title="تعديل"
                                          onClick={() => setEditQuestionId(q.questionId)}
                                        >
                                          <Pencil size={13} />
                                        </button>
                                      </td>
                                      <td className="py-2 text-center">
                                        <button
                                          className={cls.btnDel}
                                          title="حذف السؤال"
                                          onClick={async () => {
                                            await handleDeleteQuestion(q.questionId, q.intentKey);
                                            setTopicQuestionsMap(m => ({
                                              ...m,
                                              [t.code]: (m[t.code] ?? []).filter(x => x.questionId !== q.questionId),
                                            }));
                                          }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {topics.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-300">لا توجد مواضيع</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ QUESTIONS TAB ══════════ */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-400">{questions.length} سؤال</span>
              <select title="تصفية حسب الموضوع" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                value={filterTopic} onChange={e => setFilterTopic(e.target.value)}>
                <option value="">كل المواضيع</option>
                {topics.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
              <input
                type="search" placeholder="بحث..."
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white w-48"
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
              />
                <button title="تحديث" className={cls.btnSec} onClick={loadQuestions}><RefreshCw size={14} /></button>
              </div>
              <button className={cls.btnPrim} onClick={() => setShowQForm(v => !v)}>
                <PlusCircle size={15} /> إضافة سؤال
              </button>
            </div>

            {/* Add question form */}
            {showQForm && (
              <div className={`${cls.card} p-5 border-blue-100 space-y-4`}>
                <h3 className="font-semibold text-gray-800">سؤال جديد</h3>

                {/* Meta row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الموضوع *</label>
                    <select title="الموضوع" className={cls.input} value={qForm.topicCode}
                      onChange={e => setQForm(f => ({ ...f, topicCode: e.target.value }))}>
                      <option value="">اختر...</option>
                      {topics.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">مفتاح النية (intentKey) *</label>
                    <input className={cls.input} dir="ltr" placeholder="what_is_customs_fee"
                      value={qForm.intentKey} onChange={e => setQForm(f => ({ ...f, intentKey: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الأولوية (1–20)</label>
                    <input title="الأولوية" className={cls.input} type="number" dir="ltr" min={1} max={20}
                      value={qForm.priority} onChange={e => setQForm(f => ({ ...f, priority: e.target.value }))} />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qForm.isRevised}
                    onChange={e => setQForm(f => ({ ...f, isRevised: e.target.checked }))}
                  />
                  Revised
                </label>

                {/* Arabic */}
                <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/40">
                  <p className="text-xs font-bold text-gray-500">العربي</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">نص السؤال *</label>
                    <input title="نص السؤال بالعربي" className={cls.input} value={qForm.questionAr}
                      onChange={e => setQForm(f => ({ ...f, questionAr: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الجواب *</label>
                    <RichTextarea title="الجواب بالعربي" rows={3} className={cls.input} value={qForm.answerAr}
                      onChange={val => setQForm(f => ({ ...f, answerAr: val }))} onUploadImage={uploadProjectImageFile} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">كلمات مفتاحية (مفصولة بفاصلة)</label>
                    <input className={cls.input} placeholder="شحن، جمارك، تخليص"
                      value={qForm.keywordsAr} onChange={e => setQForm(f => ({ ...f, keywordsAr: e.target.value }))} />
                  </div>
                </div>

                {/* English */}
                <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/40">
                  <p className="text-xs font-bold text-gray-400">English (optional)</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Question text</label>
                    <input title="نص السؤال بالإنجليزي" className={cls.input} dir="ltr" value={qForm.questionEn}
                      onChange={e => setQForm(f => ({ ...f, questionEn: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Answer</label>
                    <RichTextarea title="الجواب بالإنجليزي" rows={3} className={cls.input} dir="ltr" value={qForm.answerEn}
                      onChange={val => setQForm(f => ({ ...f, answerEn: val }))} onUploadImage={uploadProjectImageFile} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Keywords (comma separated)</label>
                    <input className={cls.input} dir="ltr" placeholder="shipping, customs, clearance"
                      value={qForm.keywordsEn} onChange={e => setQForm(f => ({ ...f, keywordsEn: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className={cls.btnPrim} onClick={handleCreateQuestion} disabled={loading}>
                    {loading && <Loader2 size={14} className="animate-spin" />} حفظ
                  </button>
                  <button className={cls.btnSec} onClick={() => setShowQForm(false)}>إلغاء</button>
                </div>
              </div>
            )}

            {/* Questions table */}
            {(() => {
              const filtered = searchQ.trim()
                ? questions.filter(q =>
                    q.questionText?.toLowerCase().includes(searchQ.toLowerCase()) ||
                    q.intentKey?.toLowerCase().includes(searchQ.toLowerCase()) ||
                    q.topicCode?.toLowerCase().includes(searchQ.toLowerCase())
                  )
                : questions;
              return (
            <div className={`${cls.card} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`${cls.th} w-8`}>ID</th>
                    <th className={`${cls.th} text-center`}>Revised</th>
                    <th className={cls.th}>الموضوع</th>
                    <th className={cls.th}>مفتاح النية</th>
                    <th className={cls.th}>نص السؤال</th>
                    <th className={`${cls.th} text-center`}>تفاصيل</th>
                    <th className={`${cls.th} text-center`}>تعديل</th>
                    <th className={`${cls.th} text-center`}>حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(q => (
                    <React.Fragment key={q.questionId}>
                      <tr className="hover:bg-gray-50/60">
                        <td className={`${cls.td} text-gray-300 font-mono`}>{q.questionId}</td>
                        <td className={`${cls.td} text-center`}>
                          <input
                            type="checkbox"
                            title="Revised"
                            checked={q.isRevised}
                            disabled={revisedSavingIds.includes(q.questionId)}
                            onChange={e => handleToggleRevised(q.questionId, e.target.checked)}
                          />
                        </td>
                        <td className={cls.td}>
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">{q.topicCode}</span>
                        </td>
                        <td className={`${cls.td} font-mono text-xs text-gray-500`}>{q.intentKey}</td>
                        <td className={`${cls.td} max-w-xs`}>
                          <span className="line-clamp-2">{q.questionText || <span className="text-gray-300 italic">لا يوجد نص</span>}</span>
                        </td>
                        <td className={`${cls.td} text-center`}>
                          <button className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
                            onClick={() => toggleExpand(q.questionId)}>
                            {expandedQ === q.questionId ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                        <td className={`${cls.td} text-center`}>
                          <button className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="تعديل" onClick={() => setEditQuestionId(q.questionId)}>
                            <Pencil size={14} />
                          </button>
                        </td>
                        <td className={`${cls.td} text-center`}>
                          <button title="حذف السؤال" className={cls.btnDel} onClick={() => handleDeleteQuestion(q.questionId, q.intentKey)}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expandedQ === q.questionId && (
                        <tr className="bg-blue-50/40">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">السؤال</p>
                                <p className="text-sm text-gray-800">{q.questionText || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">الجواب</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answerText || '—'}</p>
                              </div>
                              <div className="text-xs text-gray-400">الأولوية: {q.priority} · {q.isActive ? 'نشط' : 'غير نشط'} · {q.isRevised ? 'Revised' : 'Not revised'}</div>

                              {/* Tags section */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                  <Tag size={12} /> الوسوم
                                </p>
                                {qTagsLoading
                                  ? <Loader2 size={14} className="animate-spin text-gray-400" />
                                  : (
                                    <div className="flex flex-wrap gap-2">
                                      {qTags.map(t => (
                                        <span key={t.id}
                                          className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                          {t.name}
                                          <button
                                            className="text-red-400 hover:text-red-600 ms-1"
                                            onClick={() => handleUnlinkTag(q.questionId, t.id)}
                                            title="إزالة الوسم"
                                          >×</button>
                                        </span>
                                      ))}

                                      {/* Add tag selector */}
                                      <select
                                        title="إضافة وسم للسؤال"
                                        className="text-xs border border-dashed border-gray-300 rounded-full px-2 py-1 bg-white text-gray-500 cursor-pointer"
                                        defaultValue=""
                                        onChange={e => {
                                          const tagId = parseInt(e.target.value, 10);
                                          if (tagId) handleLinkTag(q.questionId, tagId);
                                          e.target.value = '';
                                        }}
                                      >
                                        <option value="" disabled>+ إضافة وسم</option>
                                        {tags
                                          .filter(t => !qTags.some(qt => qt.id === t.id))
                                          .map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.languageCode})</option>
                                          ))}
                                      </select>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-300">لا توجد أسئلة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
              );
            })()}
          </div>
        )}

        {/* ══════════ TAGS TAB ══════════ */}
        {activeTab === 'tags' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{tags.length} وسم</span>
              <div className="flex gap-2">
                <button title="تحديث" className={cls.btnSec} onClick={loadTags}><RefreshCw size={14} /></button>
                <button className={cls.btnPrim} onClick={() => setShowTagForm(v => !v)}>
                  <PlusCircle size={15} /> إضافة وسم
                </button>
              </div>
            </div>

            {/* Add tag form */}
            {showTagForm && (
              <div className={`${cls.card} p-5 border-blue-100 space-y-3`}>
                <h3 className="font-semibold text-gray-800">وسم جديد</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">اللغة *</label>
                    <select title="لغة الوسم" className={cls.input} value={tagForm.languageCode}
                      onChange={e => setTagForm(f => ({ ...f, languageCode: e.target.value }))}>
                      <option value="ar">عربي</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">اسم الوسم *</label>
                    <input title="اسم الوسم" className={cls.input} value={tagForm.name}
                      dir={tagForm.languageCode === 'ar' ? 'rtl' : 'ltr'}
                      onChange={e => setTagForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={cls.btnPrim} onClick={handleCreateTag} disabled={loading}>
                    {loading && <Loader2 size={14} className="animate-spin" />} حفظ
                  </button>
                  <button className={cls.btnSec} onClick={() => setShowTagForm(false)}>إلغاء</button>
                </div>
              </div>
            )}

            {/* Tags grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {tags.map(t => (
                <div key={t.id} className={`${cls.card} px-4 py-3 flex items-center justify-between gap-2`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.languageCode === 'ar' ? 'عربي' : 'English'}</p>
                  </div>
                  <button title="حذف الوسم" className={cls.btnDel} onClick={() => handleDeleteTag(t.id, t.name)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {tags.length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-300">لا توجد وسوم</div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ AI GENERATION TAB ══════════ */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className={`${cls.card} p-6 space-y-4`}>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Sparkles size={16} className="text-blue-500" /> توليد أسئلة وأجوبة باستخدام AI</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الموضوع *</label>
                  <select
                    title="الموضوع"
                    className={cls.input}
                    value={aiTopicCode}
                    onChange={e => setAiTopicCode(e.target.value)}
                  >
                    <option value="">اختر...</option>
                    {topics.map(t => <option key={t.code} value={t.code}>{t.name} ({t.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">عدد الأسئلة (1-10)</label>
                  <input type="number" min={1} max={10} title="عدد الأسئلة" className={cls.input} dir="ltr"
                    value={aiCount} onChange={e => setAiCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">وصف الموضوع (لتوجيه AI) *</label>
                <textarea rows={3} className={cls.input}
                  placeholder="صف محتوى الموضوع ونوع الأسئلة المطلوبة..."
                  value={aiDescription} onChange={e => setAiDescription(e.target.value)} />
              </div>
              <button
                className={cls.btnPrim}
                disabled={aiLoading || !aiTopicCode || !aiDescription.trim()}
                onClick={async () => {
                  setAiLoading(true);
                  setAiSuggestions([]);
                  try {
                    const selectedTopic = topics.find(t => t.code === aiTopicCode);
                    const existingIntentKeys = questions
                      .filter(q => q.topicCode === aiTopicCode)
                      .map(q => q.intentKey)
                      .filter(Boolean);
                    const res = await api.generateKb({
                      topicCode: aiTopicCode,
                      topicName: selectedTopic?.name ?? aiTopicCode,
                      description: aiDescription,
                      count: aiCount,
                      existingIntentKeys,
                    });
                    if (res.suggestions) {
                      setAiSuggestions(
                        (res.suggestions as AiSuggestion[]).map(s => ({
                          ...s,
                          keywordsAr: Array.isArray(s.keywordsAr) ? (s.keywordsAr as string[]).join(', ') : String(s.keywordsAr ?? ''),
                          keywordsEn: Array.isArray(s.keywordsEn) ? (s.keywordsEn as string[]).join(', ') : String(s.keywordsEn ?? ''),
                          suggestedTagsAr: Array.isArray(s.suggestedTagsAr) ? s.suggestedTagsAr : [],
                          suggestedTagsEn: Array.isArray(s.suggestedTagsEn) ? s.suggestedTagsEn : [],
                          status: 'idle' as const,
                        }))
                      );
                      setTimeout(() => aiRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    } else flash(res.error ?? 'فشل التوليد', false);
                  } catch (err) {
                    flash(err instanceof Error ? err.message : 'خطأ في التوليد', false);
                  } finally { setAiLoading(false); }
                }}
              >
                {aiLoading ? <><Loader2 size={14} className="animate-spin" /> جاري التوليد...</> : <><Sparkles size={14} /> توليد</>}
              </button>
            </div>

            {/* Suggestion cards */}
            {aiSuggestions.length > 0 && (
              <div ref={aiRef} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{aiSuggestions.length} اقتراحات</h3>
                  <button
                    className={cls.btnPrim}
                    disabled={aiSuggestions.some(s => s.status === 'saving')}
                    onClick={async () => {
                      const selectedTopic = topics.find(t => t.code === aiTopicCode);
                      for (let i = 0; i < aiSuggestions.length; i++) {
                        if (aiSuggestions[i].status === 'saved') continue;
                        setAiSuggestions(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'saving' } : s));
                        try {
                          const s = aiSuggestions[i];
                          const res = await api.createQuestion({
                            topicCode: aiTopicCode,
                            topicName: selectedTopic?.name ?? aiTopicCode,
                            intentKey: s.intentKey,
                            priority: 5,
                            translations: [
                              { languageCode: 'ar', questionText: s.questionAr, answerText: s.answerAr },
                              ...(s.questionEn ? [{ languageCode: 'en', questionText: s.questionEn, answerText: s.answerEn }] : []),
                            ],
                            keywords: [
                              ...s.keywordsAr.split(',').map((k: string) => k.trim()).filter(Boolean).map((k: string) => ({ languageCode: 'ar', keyword: k })),
                              ...s.keywordsEn.split(',').map((k: string) => k.trim()).filter(Boolean).map((k: string) => ({ languageCode: 'en', keyword: k })),
                            ],
                          });
                          setAiSuggestions(prev => prev.map((sx, idx) => idx === i
                            ? { ...sx, status: res.questionId ? 'saved' : 'error', error: res.error }
                            : sx));
                        } catch {
                          setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, status: 'error', error: 'خطأ' } : sx));
                        }
                      }
                      flash('✓ تم حفظ جميع الاقتراحات', true);
                      loadQuestions();
                    }}
                  >
                    حفظ الكل
                  </button>
                </div>

                {aiSuggestions.map((s, i) => (
                  <div key={i} className={`${cls.card} p-5 space-y-3 ${
                    s.status === 'saved' ? 'border-green-200 bg-green-50/30' :
                    s.status === 'error' ? 'border-red-200 bg-red-50/30' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">{s.intentKey}</span>
                      {s.status === 'saved' && <CheckCircle size={16} className="text-green-500" />}
                      {s.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                      {(s.status === 'idle' || s.status === 'saving') && (
                        <button
                          className="bg-blue-700 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-800 flex items-center gap-1 disabled:opacity-50"
                          disabled={s.status === 'saving'}
                          onClick={async () => {
                            setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, status: 'saving' } : sx));
                            try {
                              const selectedTopic = topics.find(t => t.code === aiTopicCode);
                              const res = await api.createQuestion({
                                topicCode: aiTopicCode,
                                topicName: selectedTopic?.name ?? aiTopicCode,
                                intentKey: s.intentKey,
                                priority: 5,
                                translations: [
                                  { languageCode: 'ar', questionText: s.questionAr, answerText: s.answerAr },
                                  ...(s.questionEn ? [{ languageCode: 'en', questionText: s.questionEn, answerText: s.answerEn }] : []),
                                ],
                                keywords: [
                                  ...s.keywordsAr.split(',').map((k: string) => k.trim()).filter(Boolean).map((k: string) => ({ languageCode: 'ar', keyword: k })),
                                  ...s.keywordsEn.split(',').map((k: string) => k.trim()).filter(Boolean).map((k: string) => ({ languageCode: 'en', keyword: k })),
                                ],
                              });
                              setAiSuggestions(prev => prev.map((sx, idx) => idx === i
                                ? { ...sx, status: res.questionId ? 'saved' : 'error', error: res.error }
                                : sx));
                              if (res.questionId) loadQuestions();
                            } catch {
                              setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, status: 'error', error: 'خطأ' } : sx));
                            }
                          }}
                        >
                          {s.status === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} حفظ
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500">العربي</p>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">السؤال</label>
                          <input title="سؤال بالعربي" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                            value={s.questionAr}
                            onChange={e => setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, questionAr: e.target.value } : sx))} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">الجواب</label>
                          <textarea rows={3} title="جواب بالعربي" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                            value={s.answerAr}
                            onChange={e => setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, answerAr: e.target.value } : sx))} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">كلمات مفتاحية</label>
                          <input title="كلمات مفتاحية عربية" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                            value={s.keywordsAr}
                            onChange={e => setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, keywordsAr: e.target.value } : sx))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400">English</p>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">Question</label>
                          <input title="Question in English" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" dir="ltr"
                            value={s.questionEn}
                            onChange={e => setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, questionEn: e.target.value } : sx))} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">Answer</label>
                          <textarea rows={3} title="Answer in English" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" dir="ltr"
                            value={s.answerEn}
                            onChange={e => setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, answerEn: e.target.value } : sx))} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-0.5">Keywords</label>
                          <input title="Keywords in English" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" dir="ltr"
                            value={s.keywordsEn}
                            onChange={e => setAiSuggestions(prev => prev.map((sx, idx) => idx === i ? { ...sx, keywordsEn: e.target.value } : sx))} />
                        </div>
                      </div>
                    </div>
                    {s.error && <p className="text-xs text-red-500">{s.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Edit modals ── */}
        {editQuestionId !== null && (
          <EditQuestionModal
            questionId={editQuestionId}
            onClose={() => setEditQuestionId(null)}
            onSaved={loadQuestions}
            flash={flash}
          />
        )}
        {editTopicId !== null && (
          <EditTopicModal
            topicId={editTopicId}
            onClose={() => setEditTopicId(null)}
            onSaved={loadTopics}
            flash={flash}
          />
        )}

        {/* ══════════ RESOURCE CATEGORIES TAB ══════════ */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{resCategories.length} بطاقة</span>
              <div className="flex gap-2">
                <button title="تحديث" className={cls.btnSec} onClick={loadResCategories}><RefreshCw size={14} /></button>
                <button className={cls.btnPrim} onClick={() => { resetResForm(); setEditResId(null); setShowResForm(v => !v); }}>
                  <PlusCircle size={15} /> إضافة بطاقة
                </button>
              </div>
            </div>

            {/* Add / Edit form */}
            {showResForm && (
              <div className={`${cls.card} p-5 border-blue-100 space-y-4`}>
                <h3 className="font-semibold text-gray-800">{editResId ? 'تعديل البطاقة' : 'بطاقة جديدة'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!editResId && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">الكود (فريد، بالإنجليزي) *</label>
                      <input className={cls.input} dir="ltr" placeholder="my-category"
                        value={resForm.code} onChange={e => setResForm(f => ({ ...f, code: e.target.value }))} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الترتيب</label>
                    <input className={cls.input} type="number" dir="ltr" min={0} title="الترتيب"
                      value={resForm.sortOrder} onChange={e => setResForm(f => ({ ...f, sortOrder: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">العنوان بالعربي *</label>
                    <input className={cls.input} title="العنوان بالعربي" value={resForm.titleAr}
                      onChange={e => setResForm(f => ({ ...f, titleAr: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">العنوان بالإنجليزي</label>
                    <input className={cls.input} title="العنوان بالإنجليزي" dir="ltr" value={resForm.titleEn}
                      onChange={e => setResForm(f => ({ ...f, titleEn: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الوصف بالعربي</label>
                    <textarea rows={2} className={cls.input} title="الوصف بالعربي" value={resForm.descriptionAr}
                      onChange={e => setResForm(f => ({ ...f, descriptionAr: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الوصف بالإنجليزي</label>
                    <textarea rows={2} className={cls.input} title="الوصف بالإنجليزي" dir="ltr" value={resForm.descriptionEn}
                      onChange={e => setResForm(f => ({ ...f, descriptionEn: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">رابط الصورة (URL)</label>
                    <input className={cls.input} dir="ltr" placeholder="https://... or /assets/projects/my-image.png or /uploads/projects/my-image.webp"
                      value={resForm.imageUrl} onChange={e => setResForm(f => ({ ...f, imageUrl: e.target.value }))} />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        ref={resImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleUploadResImage}
                      />
                      <button
                        type="button"
                        onClick={() => resImageInputRef.current?.click()}
                        disabled={resImageUploading}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50"
                      >
                        {resImageUploading ? 'Uploading...' : 'Upload image'}
                      </button>
                      <span className="text-xs text-gray-400">Fixed assets: /assets/projects | Uploads: /uploads/projects</span>
                    </div>
                    {resImageError && <p className="mt-2 text-xs text-red-500">{resImageError}</p>}
                    {resForm.imageUrl.trim() && (
                      <img src={resForm.imageUrl.trim()} alt="preview" className="mt-2 h-24 rounded-lg object-cover border border-gray-200" />
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={cls.btnPrim} onClick={handleSaveResCategory} disabled={resLoading}>
                    {resLoading && <Loader2 size={14} className="animate-spin" />}
                    <Save size={14} /> حفظ
                  </button>
                  <button className={cls.btnSec} onClick={() => { setShowResForm(false); setEditResId(null); resetResForm(); }}>إلغاء</button>
                </div>
              </div>
            )}

            {/* Categories table */}
            <div className={`${cls.card} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={cls.th}>الصورة</th>
                    <th className={cls.th}>الكود</th>
                    <th className={cls.th}>العنوان</th>
                    <th className={cls.th}>الوصف</th>
                    <th className={`${cls.th} text-center`}>مرئي</th>
                    <th className={`${cls.th} text-center`}>تعديل</th>
                    <th className={`${cls.th} text-center`}>حذف</th>
                    <th className={`${cls.th} text-center`}>العناصر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resCategories.map(cat => (
                    <React.Fragment key={cat.id}>
                    <tr className={`hover:bg-gray-50/60 ${!cat.is_active ? 'opacity-50' : ''}`}>
                      <td className={cls.td}>
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.title_ar} className="w-14 h-10 object-cover rounded-lg border border-gray-100" />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">لا صورة</div>
                        )}
                      </td>
                      <td className={`${cls.td} font-mono text-blue-700`}>{cat.code}</td>
                      <td className={cls.td}>{cat.title_ar}</td>
                      <td className={`${cls.td} text-gray-400 max-w-xs truncate`}>{cat.description_ar ?? '—'}</td>
                      <td className={`${cls.td} text-center`}>
                        <button
                          title={cat.is_active ? 'إخفاء' : 'إظهار'}
                          onClick={() => handleToggleResActive(cat.id, cat.is_active)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${cat.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cat.is_active ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className={`${cls.td} text-center`}>
                        <button
                          className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="تعديل"
                          onClick={() => {
                            setEditResId(cat.id);
                            setResForm({
                              code: cat.code,
                              titleAr: cat.title_ar,
                              titleEn: cat.title_en ?? '',
                              descriptionAr: cat.description_ar ?? '',
                              descriptionEn: cat.description_en ?? '',
                              imageUrl: cat.image_url ?? '',
                              sortOrder: String(cat.sort_order),
                            });
                            setResImageError('');
                            setShowResForm(true);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                      <td className={`${cls.td} text-center`}>
                        <button className={cls.btnDel} title="حذف" onClick={() => handleDeleteResCategory(cat.id, cat.code)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                      <td className={`${cls.td} text-center`}>
                        <button
                          title="إدارة العناصر الفرعية"
                          onClick={() => handleToggleSubExpand(cat.code)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                        >
                          {expandedResCatCode === cat.code ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </td>
                    </tr>
                    {expandedResCatCode === cat.code && (
                      <tr key={`sub-${cat.code}`}>
                        <td colSpan={8} className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">العناصر الفرعية — {cat.title_ar}</span>
                            <button
                              className={cls.btnPrim}
                              onClick={() => { setShowSubForm(v => !v); setEditSubId(null); setSubForm({ titleAr: '', titleEn: '', sortOrder: '0' }); }}
                            >
                              <PlusCircle size={14} /> إضافة عنصر
                            </button>
                          </div>

                          {showSubForm && expandedResCatCode === cat.code && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">العنوان بالعربي *</label>
                                <input className={cls.input} title="العنوان بالعربي" value={subForm.titleAr}
                                  onChange={e => setSubForm(f => ({ ...f, titleAr: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">العنوان بالإنجليزي</label>
                                <input className={cls.input} title="العنوان بالإنجليزي" dir="ltr" value={subForm.titleEn}
                                  onChange={e => setSubForm(f => ({ ...f, titleEn: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">الترتيب</label>
                                <input className={cls.input} type="number" title="الترتيب" dir="ltr" min={0} value={subForm.sortOrder}
                                  onChange={e => setSubForm(f => ({ ...f, sortOrder: e.target.value }))} />
                              </div>
                              <div className="sm:col-span-3 flex gap-2">
                                <button className={cls.btnPrim} onClick={() => handleSaveSubItem(cat.code)}>
                                  <Save size={13} /> {editSubId ? 'تحديث' : 'حفظ'}
                                </button>
                                <button className={cls.btnSec} onClick={() => { setShowSubForm(false); setEditSubId(null); }}>إلغاء</button>
                              </div>
                            </div>
                          )}

                          {subItemsLoading === cat.code && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><Loader2 size={14} className="animate-spin" />جارٍ التحميل…</div>
                          )}

                          {!subItemsLoading && (subItemsMap[cat.code] ?? []).length > 0 && (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className={cls.th}>#</th>
                                  <th className={cls.th}>العنوان بالعربي</th>
                                  <th className={cls.th}>العنوان بالإنجليزي</th>
                                  <th className={cls.th}>الترتيب</th>
                                  <th className={cls.th}>مرئي</th>
                                  <th className={cls.th}>تعديل</th>
                                  <th className={cls.th}>حذف</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(subItemsMap[cat.code] ?? []).map(item => (
                                  <tr key={item.id} className="border-b border-gray-100 hover:bg-white transition-colors">
                                    <td className={cls.td}>{item.id}</td>
                                    <td className={cls.td}>{item.title_ar}</td>
                                    <td className={`${cls.td} text-gray-400 dir-ltr`}>{item.title_en ?? '—'}</td>
                                    <td className={cls.td}>{item.sort_order}</td>
                                    <td className={`${cls.td} text-center`}>
                                      <button
                                        title={item.is_active ? 'إخفاء' : 'إظهار'}
                                        onClick={() => handleToggleSubActive(item, cat.code)}
                                        className={`w-9 h-5 rounded-full transition-colors relative ${item.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                                      >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.is_active ? 'right-0.5' : 'left-0.5'}`} />
                                      </button>
                                    </td>
                                    <td className={`${cls.td} text-center`}>
                                      <button
                                        className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="تعديل"
                                        onClick={() => {
                                          setEditSubId(item.id);
                                          setSubForm({ titleAr: item.title_ar, titleEn: item.title_en ?? '', sortOrder: String(item.sort_order) });
                                          setShowSubForm(true);
                                        }}
                                      >
                                        <Pencil size={13} />
                                      </button>
                                    </td>
                                    <td className={`${cls.td} text-center`}>
                                      <button className={cls.btnDel} title="حذف" onClick={() => handleDeleteSubItem(item.id, cat.code)}>
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {!subItemsLoading && (subItemsMap[cat.code] ?? []).length === 0 && (
                            <p className="text-xs text-gray-400 py-2">لا توجد عناصر فرعية. أضف أول عنصر أعلاه.</p>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                  {resCategories.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-300">لا توجد بطاقات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
