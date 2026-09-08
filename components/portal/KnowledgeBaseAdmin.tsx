import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Language } from '../../types';
import { adminFetch } from '../../services/adminApi';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Loader2, Tag, RefreshCw, X, Pencil, Save, Sparkles, CheckCircle, AlertCircle, LayoutDashboard, Settings } from 'lucide-react';

// ── RichTextarea — supports Ctrl+B (bold), toolbar buttons for lists ──────────
interface RichTextareaProps {
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  className?: string;
  dir?: string;
  title?: string;
  placeholder?: string;
}

const RichTextarea: React.FC<RichTextareaProps> = ({ value, onChange, rows = 4, className = '', dir, title, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedSelRef  = useRef({ start: 0, end: 0 });
  const [showImgInput,  setShowImgInput]  = useState(false);
  const [imgUrl,        setImgUrl]        = useState('');
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

  const insertImage = () => {
    const url = imgUrl.trim();
    if (!url) return;
    const el = ref.current;
    const pos = el ? el.selectionStart : value.length;
    const snippet = `![](${url})`;
    onChange(value.slice(0, pos) + snippet + value.slice(pos));
    setImgUrl('');
    setShowImgInput(false);
    setTimeout(() => { el?.focus(); }, 0);
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
          onClick={() => { setShowImgInput(v => !v); setTimeout(() => imgInputRef.current?.focus(), 50); }}
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
            placeholder="https://example.com/image.jpg"
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); insertImage(); }
              if (e.key === 'Escape') { setShowImgInput(false); setImgUrl(''); }
            }}
          />
          <button type="button" onClick={insertImage}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
            إدراج
          </button>
          <button type="button" onClick={() => { setShowImgInput(false); setImgUrl(''); }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 text-gray-600">
            إلغاء
          </button>
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
  questionCount: number;
}

interface KbAdminQuestion {
  questionId: number;
  topicCode: string;
  topicName: string;
  intentKey: string;
  priority: number;
  isActive: boolean;
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

interface ResourceSubItem {
  id: number;
  category_code: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  question_id: number | null;
  section_ar: string | null;
  section_en: string | null;
  sort_order: number;
  is_active: boolean;
}

interface ResourceSection {
  id: number;
  category_code: string;
  title_ar: string;
  title_en: string | null;
  sort_order: number;
  is_active: boolean;
}

interface GroupedResourceSection {
  key: string;
  id: number | null;
  titleAr: string | null;
  titleEn: string | null;
  sortOrder: number;
  isActive: boolean;
  items: ResourceSubItem[];
}

// ── API helpers ───────────────────────────────────────────────────────────────

const api = {
  getTopics:   (lang: string) =>
    adminFetch(`/api/topics?language=${lang}`).then(r => r.json()),
  createTopic: (body: object) =>
    adminFetch('/api/topics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteTopic: (id: number) =>
    adminFetch(`/api/topics/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getQuestions: (lang: string, topicCode?: string) => {
    const qs = topicCode
      ? `?language=${lang}&topicCode=${encodeURIComponent(topicCode)}`
      : `?language=${lang}`;
    return adminFetch(`/api/questions${qs}`).then(r => r.json());
  },
  createQuestion: (body: object) =>
    adminFetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteQuestion: (id: number) =>
    adminFetch(`/api/questions/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getQuestionTags: (id: number) =>
    adminFetch(`/api/questions/${id}/tags`).then(r => r.json()),
  addTagToQuestion: (questionId: number, tagId: number) =>
    adminFetch(`/api/questions/${questionId}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tagId }) }).then(r => r.json()),
  removeTagFromQuestion: (questionId: number, tagId: number) =>
    adminFetch(`/api/questions/${questionId}/tags/${tagId}`, { method: 'DELETE' }).then(r => r.json()),

  getTags: () =>
    adminFetch('/api/tags').then(r => r.json()),
  createTag: (body: object) =>
    adminFetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteTag: (id: number) =>
    adminFetch(`/api/tags/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getQuestionForEdit: (id: number) =>
    adminFetch(`/api/questions/${id}/edit`).then(r => r.json()),
  updateQuestion: (id: number, body: object) =>
    adminFetch(`/api/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  getTopicById: (id: number) =>
    adminFetch(`/api/topics/${id}`).then(r => r.json()),
  updateTopic: (id: number, body: object) =>
    adminFetch(`/api/topics/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  generateKb: (body: object) =>
    adminFetch('/api/kb/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),

  getResourceCategories: () =>
    adminFetch('/api/resource-categories').then(r => r.json()),
  createResourceCategory: (body: object) =>
    adminFetch('/api/resource-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateResourceCategory: (id: number, body: object) =>
    adminFetch(`/api/resource-categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteResourceCategory: (id: number) =>
    adminFetch(`/api/resource-categories/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getSubItems: (categoryCode: string) =>
    adminFetch(`/api/resource-sub-items?categoryCode=${encodeURIComponent(categoryCode)}`).then(r => r.json()),
  createSubItem: (body: object) =>
    adminFetch('/api/resource-sub-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateSubItem: (id: number, body: object) =>
    adminFetch(`/api/resource-sub-items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteSubItem: (id: number) =>
    adminFetch(`/api/resource-sub-items/${id}`, { method: 'DELETE' }).then(r => r.json()),

  getResourceSections: (categoryCode: string) =>
    adminFetch(`/api/resource-sections?categoryCode=${encodeURIComponent(categoryCode)}`).then(r => r.json()),
  createResourceSection: (body: object) =>
    adminFetch('/api/resource-sections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  updateResourceSection: (id: number, body: object) =>
    adminFetch(`/api/resource-sections/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
};

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
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} title="إغلاق" className="text-gray-400 hover:text-gray-700 p-1 rounded"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ViewportPopup({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return <>{children}</>;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}
    >
      {children}
    </div>,
    document.body,
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
    priority: '5', isActive: true,
    questionAr: '', answerAr: '', keywordsAr: '',
    questionEn: '', answerEn: '', keywordsEn: '',
  });

  useEffect(() => {
    api.getQuestionForEdit(questionId).then((d: QuestionEditData) => {
      setData(d);
      const ar = d.translations.find((t: { languageCode: string }) => t.languageCode === 'ar');
      const en = d.translations.find((t: { languageCode: string }) => t.languageCode === 'en');
      setForm({
        priority: String(d.priority), isActive: d.isActive,
        questionAr: ar?.questionText ?? '', answerAr: ar?.answerText ?? '',
        keywordsAr: ar?.keywords.join(', ') ?? '',
        questionEn: en?.questionText ?? '', answerEn: en?.answerText ?? '',
        keywordsEn: en?.keywords.join(', ') ?? '',
      });
      setLoading(false);
    }).catch(() => { flash('فشل تحميل بيانات السؤال', false); onClose(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const handleSave = async () => {
    setSaving(true);
    const translations = [
      { languageCode: 'ar', questionText: form.questionAr, answerText: form.answerAr, keywords: form.keywordsAr.split(',').map(s => s.trim()).filter(Boolean) },
      ...(form.questionEn || form.answerEn ? [{ languageCode: 'en', questionText: form.questionEn, answerText: form.answerEn, keywords: form.keywordsEn.split(',').map(s => s.trim()).filter(Boolean) }] : []),
    ];
    const res = await api.updateQuestion(questionId, { priority: parseInt(form.priority, 10) || 5, isActive: form.isActive, translations });
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
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                نشط
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
              <RichTextarea rows={4} title="الجواب بالعربي" className={inputCls} value={form.answerAr} onChange={val => setForm(f => ({ ...f, answerAr: val }))} />
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
              <RichTextarea rows={4} title="Answer in English" className={inputCls} dir="ltr" value={form.answerEn} onChange={val => setForm(f => ({ ...f, answerEn: val }))} />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

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
  const navigate = useNavigate();

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

  // Sub-items management (expand per category)
  const [expandedResCatCode,  setExpandedResCatCode]  = useState<string | null>(null);
  const [subItemsMap,         setSubItemsMap]         = useState<Record<string, ResourceSubItem[]>>({});
  const [subItemsLoading,     setSubItemsLoading]     = useState<string | null>(null);
  const [sectionsMap,         setSectionsMap]         = useState<Record<string, ResourceSection[]>>({});
  const [sectionsLoading,     setSectionsLoading]     = useState<string | null>(null);
  const [showSectionForm,     setShowSectionForm]     = useState(false);
  const [sectionForm,         setSectionForm]         = useState({ titleAr: '', titleEn: '', sortOrder: '0' });
  const [collapsedSections,   setCollapsedSections]   = useState<Record<string, boolean>>({});
  const [showSubForm,         setShowSubForm]         = useState(false);
  const [editSubId,           setEditSubId]           = useState<number | null>(null);
  const [subForm,             setSubForm]             = useState({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', questionId: null as number | null, sectionAr: '', sectionEn: '', sortOrder: '0' });
  const [linkedQuestionLabel, setLinkedQuestionLabel] = useState('');
  const [questionSearchOpen,  setQuestionSearchOpen]  = useState(false);
  const [questionSearchText,  setQuestionSearchText]  = useState('');
  const [linkableQuestions,   setLinkableQuestions]   = useState<KbAdminQuestion[]>([]);
  const [linkableQuestionsLoading, setLinkableQuestionsLoading] = useState(false);

  // Expand question row state
  const [expandedQ,   setExpandedQ]   = useState<number | null>(null);
  const [qTags,       setQTags]       = useState<KbAdminTag[]>([]);
  const [qTagsLoading, setQTagsLoading] = useState(false);

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

  const groupSubItemsBySection = useCallback((items: ResourceSubItem[], sections: ResourceSection[]): GroupedResourceSection[] => {
    const grouped = new Map<string, GroupedResourceSection>();

    for (const section of sections) {
      const titleAr = section.title_ar.trim();
      grouped.set(titleAr, {
        key: titleAr,
        id: section.id,
        titleAr,
        titleEn: section.title_en?.trim() || null,
        sortOrder: section.sort_order,
        isActive: section.is_active,
        items: [],
      });
    }

    for (const item of items) {
      const titleAr = item.section_ar?.trim() || null;
      const titleEn = item.section_en?.trim() || null;
      const key = titleAr || titleEn || '__uncategorized__';
      const existing = grouped.get(key);

      if (existing) {
        existing.items.push(item);
        continue;
      }

      grouped.set(key, {
        key,
        id: null,
        titleAr,
        titleEn,
        sortOrder: item.sort_order,
        isActive: true,
        items: [item],
      });
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.sortOrder - b.sortOrder || (a.titleAr ?? '').localeCompare(b.titleAr ?? '', 'ar')
    );
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

  const loadLinkableQuestions = useCallback(async () => {
    setLinkableQuestionsLoading(true);
    try {
      const data = await api.getQuestions('ar');
      setLinkableQuestions(data.questions ?? []);
    } finally { setLinkableQuestionsLoading(false); }
  }, []);

  useEffect(() => { loadTopics(); loadTags(); loadResCategories(); }, [loadTopics, loadTags, loadResCategories]);
  useEffect(() => { if (activeTab === 'questions') loadQuestions(); }, [activeTab, loadQuestions]);
  useEffect(() => { if (activeTab === 'resources') loadLinkableQuestions(); }, [activeTab, loadLinkableQuestions]);

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
      setQForm({ topicCode: '', intentKey: '', priority: '5', questionAr: '', answerAr: '', questionEn: '', answerEn: '', keywordsAr: '', keywordsEn: '' });
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

  const resetResForm = () => setResForm({ code: '', titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', imageUrl: '', sortOrder: '0' });

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

  const loadResourceSections = async (catCode: string) => {
    setSectionsLoading(catCode);
    try {
      const data = await api.getResourceSections(catCode);
      setSectionsMap(m => ({ ...m, [catCode]: data.sections ?? [] }));
    } finally {
      setSectionsLoading(null);
    }
  };

  const emptySubForm = { titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', questionId: null as number | null, sectionAr: '', sectionEn: '', sortOrder: '0' };
  const emptySectionForm = { titleAr: '', titleEn: '', sortOrder: '0' };

  const openSubItemForm = (section?: Pick<GroupedResourceSection, 'titleAr' | 'titleEn'>) => {
    setShowSectionForm(false);
    setEditSubId(null);
    setSubForm({
      ...emptySubForm,
      sectionAr: section?.titleAr ?? '',
      sectionEn: section?.titleEn ?? '',
    });
    setLinkedQuestionLabel('');
    setQuestionSearchOpen(false);
    setQuestionSearchText('');
    setShowSubForm(true);
  };

  const handleToggleSubExpand = async (catCode: string) => {
    if (expandedResCatCode === catCode) { setExpandedResCatCode(null); return; }
    setExpandedResCatCode(catCode);
    setShowSubForm(false); setShowSectionForm(false); setSectionForm(emptySectionForm); setEditSubId(null); setSubForm(emptySubForm); setLinkedQuestionLabel(''); setQuestionSearchOpen(false); setQuestionSearchText('');
    await Promise.all([
      subItemsMap[catCode] ? Promise.resolve() : loadSubItems(catCode),
      sectionsMap[catCode] ? Promise.resolve() : loadResourceSections(catCode),
    ]);
  };

  const handleSaveResourceSection = async (catCode: string) => {
    if (!sectionForm.titleAr.trim()) return flash('اسم القسم بالعربي مطلوب', false);
    const res = await api.createResourceSection({
      categoryCode: catCode,
      titleAr: sectionForm.titleAr.trim(),
      titleEn: sectionForm.titleEn.trim() || undefined,
      sortOrder: Number(sectionForm.sortOrder) || 0,
    });
    if (res.section) {
      flash('تمت إضافة القسم', true);
      await loadResourceSections(catCode);
      setShowSectionForm(false);
      setSectionForm(emptySectionForm);
    } else {
      flash(res.error ?? 'فشل حفظ القسم', false);
    }
  };

  const handlePickQuestion = async (q: KbAdminQuestion) => {
    setSubForm(f => ({ ...f, questionId: q.questionId, titleAr: f.titleAr || q.questionText }));
    setLinkedQuestionLabel(q.questionText);
    setQuestionSearchOpen(false);
    setQuestionSearchText('');
    try {
      const full = await api.getQuestionForEdit(q.questionId);
      const en = full?.translations?.find((t: { languageCode: string; questionText: string }) => t.languageCode === 'en');
      if (en?.questionText) setSubForm(f => ({ ...f, titleEn: f.titleEn || en.questionText }));
    } catch { /* best-effort only */ }
  };

  const handleUnlinkQuestion = () => {
    setSubForm(f => ({ ...f, questionId: null }));
    setLinkedQuestionLabel('');
  };

  const handleSaveSubItem = async (catCode: string) => {
    if (!subForm.titleAr.trim()) return flash('العنوان بالعربي مطلوب', false);
    const body = {
      categoryCode: catCode,
      titleAr: subForm.titleAr.trim(),
      titleEn: subForm.titleEn.trim() || undefined,
      descriptionAr: subForm.descriptionAr.trim() || undefined,
      descriptionEn: subForm.descriptionEn.trim() || undefined,
      questionId: subForm.questionId,
      sectionAr: subForm.sectionAr.trim() || undefined,
      sectionEn: subForm.sectionEn.trim() || undefined,
      sortOrder: Number(subForm.sortOrder) || 0,
    };
    const res = editSubId
      ? await api.updateSubItem(editSubId, { titleAr: body.titleAr, titleEn: body.titleEn, descriptionAr: body.descriptionAr, descriptionEn: body.descriptionEn, questionId: body.questionId, sectionAr: body.sectionAr, sectionEn: body.sectionEn, sortOrder: body.sortOrder })
      : await api.createSubItem(body);
    if (res.item) {
      flash(editSubId ? 'تم التحديث' : 'تمت الإضافة', true);
      await loadSubItems(catCode);
      setShowSubForm(false); setEditSubId(null); setSubForm(emptySubForm); setLinkedQuestionLabel(''); setQuestionSearchOpen(false); setQuestionSearchText('');
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

  const handleToggleSectionActive = async (section: { id: number | null; isActive: boolean }, catCode: string) => {
    if (section.id == null) return;
    const res = await api.updateResourceSection(section.id, { isActive: !section.isActive });
    if (res.section) {
      setSectionsMap(m => ({ ...m, [catCode]: (m[catCode] ?? []).map(s => s.id === section.id ? { ...s, is_active: !section.isActive } : s) }));
    } else flash(res.error ?? 'فشل التحديث', false);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة إدارة قاعدة المعرفة</h1>
            <p className="text-gray-400 text-sm mt-1">إدارة المواضيع والأسئلة والوسوم الخاصة بالبوت</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/${lang}/dashboard`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <LayoutDashboard size={14} />
              لوحة التحكم
            </button>
            <button
              onClick={() => navigate(`/${lang}/admin/settings`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-gray-700 text-white hover:bg-gray-800 transition-colors"
            >
              <Settings size={14} />
              الإعدادات
            </button>
          </div>
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
                {topics.map(t => <option key={t.code} value={t.code}>{t.name} ({t.questionCount})</option>)}
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
                      onChange={val => setQForm(f => ({ ...f, answerAr: val }))} />
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
                      onChange={val => setQForm(f => ({ ...f, answerEn: val }))} />
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
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">السؤال</p>
                                <p className="text-sm text-gray-800">{q.questionText || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">الجواب</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answerText || '—'}</p>
                              </div>
                              <div className="text-xs text-gray-400">الأولوية: {q.priority} · {q.isActive ? 'نشط' : 'غير نشط'}</div>

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
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-300">لا توجد أسئلة</td></tr>
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
              <ViewportPopup
                isOpen={Boolean(editResId)}
                onClose={() => { setShowResForm(false); setEditResId(null); resetResForm(); }}
              >
              <div className={`${cls.card} p-5 border-blue-100 space-y-4 ${editResId ? 'w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl' : ''}`}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-semibold text-gray-800">{editResId ? 'تعديل البطاقة' : 'بطاقة جديدة'}</h3>
                  {editResId && (
                    <button
                      type="button"
                      title="إغلاق"
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      onClick={() => { setShowResForm(false); setEditResId(null); resetResForm(); }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
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
                    <input className={cls.input} dir="ltr" placeholder="https://... or /assets/my-image.png"
                      value={resForm.imageUrl} onChange={e => setResForm(f => ({ ...f, imageUrl: e.target.value }))} />
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
              </ViewportPopup>
            )}

            {/* Categories table */}
            <div className={`${cls.card} overflow-hidden`}>
              <div className="overflow-x-auto">
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
                            <span className="text-sm font-semibold text-gray-700">الأقسام والعناوين — {cat.title_ar}</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                className={cls.btnSec}
                                onClick={() => { setShowSubForm(false); setShowSectionForm(v => !v); setSectionForm(emptySectionForm); }}
                              >
                                <PlusCircle size={14} /> إضافة قسم
                              </button>
                              <button className={cls.btnPrim} onClick={() => openSubItemForm()}>
                                <PlusCircle size={14} /> إضافة عنوان
                              </button>
                            </div>
                          </div>

                          {showSectionForm && expandedResCatCode === cat.code && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">اسم القسم بالعربي *</label>
                                <input className={cls.input} title="اسم القسم بالعربي" placeholder="مثال: أنواع الخدمة" value={sectionForm.titleAr}
                                  onChange={e => setSectionForm(f => ({ ...f, titleAr: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">اسم القسم بالإنجليزي</label>
                                <input className={cls.input} title="اسم القسم بالإنجليزي" dir="ltr" placeholder="e.g. Service Types" value={sectionForm.titleEn}
                                  onChange={e => setSectionForm(f => ({ ...f, titleEn: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">الترتيب</label>
                                <input className={cls.input} type="number" title="ترتيب القسم" dir="ltr" min={0} value={sectionForm.sortOrder}
                                  onChange={e => setSectionForm(f => ({ ...f, sortOrder: e.target.value }))} />
                              </div>
                              <div className="sm:col-span-3 flex gap-2">
                                <button className={cls.btnPrim} onClick={() => handleSaveResourceSection(cat.code)}>
                                  <Save size={13} /> حفظ القسم
                                </button>
                                <button className={cls.btnSec} onClick={() => { setShowSectionForm(false); setSectionForm(emptySectionForm); }}>إلغاء</button>
                              </div>
                            </div>
                          )}

                          {showSubForm && expandedResCatCode === cat.code && (
                            <ViewportPopup
                              isOpen={Boolean(editSubId)}
                              onClose={() => { setShowSubForm(false); setEditSubId(null); }}
                            >
                            <div className={`bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 ${editSubId ? 'w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl' : ''}`}>
                              {editSubId && (
                                <div className="sm:col-span-3 flex items-center justify-between border-b border-gray-100 pb-3">
                                  <h3 className="text-base font-bold text-gray-900">تعديل العنوان</h3>
                                  <button
                                    type="button"
                                    title="إغلاق"
                                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                    onClick={() => { setShowSubForm(false); setEditSubId(null); }}
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                              )}
                              <div className="sm:col-span-3">
                                <label className="block text-xs text-gray-500 mb-1">
                                  ربط بسؤال من قاعدة المعرفة <span className="text-blue-500">(موصى به — يفتح إجابة السؤال مباشرة بدلاً من البحث)</span>
                                </label>
                                {subForm.questionId ? (
                                  <div className="flex items-center justify-between gap-2 border border-green-200 bg-green-50 rounded-lg px-3 py-2">
                                    <span className="text-sm text-green-800 truncate">{linkedQuestionLabel || `سؤال #${subForm.questionId}`}</span>
                                    <button type="button" className="text-green-700 hover:text-red-600 shrink-0 p-1" title="إلغاء الربط" onClick={handleUnlinkQuestion}>
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <input
                                      className={cls.input}
                                      title="ابحث عن سؤال"
                                      placeholder="ابحث عن سؤال بالعنوان أو الموضوع..."
                                      value={questionSearchText}
                                      onChange={e => { setQuestionSearchText(e.target.value); setQuestionSearchOpen(true); }}
                                      onFocus={() => setQuestionSearchOpen(true)}
                                      onBlur={() => setTimeout(() => setQuestionSearchOpen(false), 150)}
                                    />
                                    {questionSearchOpen && questionSearchText.trim().length > 0 && (
                                      <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                                        {linkableQuestionsLoading ? (
                                          <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> جارٍ التحميل…</div>
                                        ) : (() => {
                                          const q = questionSearchText.trim().toLowerCase();
                                          const matches = linkableQuestions.filter(item =>
                                            item.questionText.toLowerCase().includes(q) ||
                                            item.intentKey.toLowerCase().includes(q) ||
                                            item.topicName.toLowerCase().includes(q)
                                          ).slice(0, 8);
                                          if (matches.length === 0) return <div className="px-3 py-2 text-xs text-gray-400">لا توجد نتائج مطابقة</div>;
                                          return matches.map(item => (
                                            <button
                                              key={item.questionId}
                                              type="button"
                                              onClick={() => handlePickQuestion(item)}
                                              className="w-full text-start px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                            >
                                              <div className="font-medium text-gray-800 truncate">{item.questionText}</div>
                                              <div className="text-[10px] text-gray-400">{item.topicName} · {item.intentKey}</div>
                                            </button>
                                          ));
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
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
                              <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">الوصف بالعربي</label>
                                <input className={cls.input} title="الوصف بالعربي" value={subForm.descriptionAr}
                                  onChange={e => setSubForm(f => ({ ...f, descriptionAr: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">الوصف بالإنجليزي</label>
                                <input className={cls.input} title="الوصف بالإنجليزي" dir="ltr" value={subForm.descriptionEn}
                                  onChange={e => setSubForm(f => ({ ...f, descriptionEn: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">القسم داخل الفئة (بالعربي)</label>
                                <input
                                  className={cls.input} title="القسم بالعربي" list={`sections-${cat.code}`}
                                  placeholder="مثال: أنواع الخدمة"
                                  value={subForm.sectionAr}
                                  onChange={e => setSubForm(f => ({ ...f, sectionAr: e.target.value }))}
                                />
                                <datalist id={`sections-${cat.code}`}>
                                  {Array.from(new Set([
                                    ...(sectionsMap[cat.code] ?? []).map(section => section.title_ar),
                                    ...(subItemsMap[cat.code] ?? []).map(item => item.section_ar).filter((section): section is string => !!section),
                                  ])).map(s => (
                                    <option key={s} value={s} />
                                  ))}
                                </datalist>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">القسم داخل الفئة (بالإنجليزي)</label>
                                <input className={cls.input} title="القسم بالإنجليزي" dir="ltr" placeholder="e.g. Service Types" value={subForm.sectionEn}
                                  onChange={e => setSubForm(f => ({ ...f, sectionEn: e.target.value }))} />
                              </div>
                              <div className="sm:col-span-3 flex gap-2">
                                <button className={cls.btnPrim} onClick={() => handleSaveSubItem(cat.code)}>
                                  <Save size={13} /> {editSubId ? 'تحديث' : 'حفظ'}
                                </button>
                                <button className={cls.btnSec} onClick={() => { setShowSubForm(false); setEditSubId(null); }}>إلغاء</button>
                              </div>
                            </div>
                            </ViewportPopup>
                          )}

                          {(subItemsLoading === cat.code || sectionsLoading === cat.code) && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><Loader2 size={14} className="animate-spin" />جارٍ التحميل…</div>
                          )}

                          {subItemsLoading !== cat.code && sectionsLoading !== cat.code && ((subItemsMap[cat.code] ?? []).length > 0 || (sectionsMap[cat.code] ?? []).length > 0) && (
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 border border-gray-200">
                                  {groupSubItemsBySection(subItemsMap[cat.code] ?? [], sectionsMap[cat.code] ?? []).length} أقسام
                                </span>
                                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 border border-gray-200">
                                  {(subItemsMap[cat.code] ?? []).length} عناوين
                                </span>
                              </div>

                              {groupSubItemsBySection(subItemsMap[cat.code] ?? [], sectionsMap[cat.code] ?? []).map(section => {
                                const sectionCollapseKey = `${cat.code}:${section.key}`;
                                const isSectionCollapsed = collapsedSections[sectionCollapseKey] ?? true;

                                return (
                                <div key={section.key} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                  <div className={`flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3 ${isSectionCollapsed ? '' : 'border-b border-gray-100'} ${section.id != null && !section.isActive ? 'opacity-60' : ''}`}>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-gray-800">{section.titleAr ?? 'بدون قسم'}</h4>
                                        {section.id != null && !section.isActive && (
                                          <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">مخفي</span>
                                        )}
                                      </div>
                                      {section.titleEn && (
                                        <p className="mt-0.5 text-xs text-gray-400" dir="ltr">{section.titleEn}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-gray-500">{section.items.length} عنوان</span>
                                      {section.titleAr && (
                                        <button className="text-xs font-medium text-blue-700 hover:text-blue-800" onClick={() => openSubItemForm(section)}>
                                          <PlusCircle size={13} className="inline-block align-text-bottom" /> إضافة عنوان
                                        </button>
                                      )}
                                      {section.id != null && (
                                        <button
                                          type="button"
                                          title={section.isActive ? 'إخفاء القسم من صفحة المصادر' : 'إظهار القسم في صفحة المصادر'}
                                          aria-label={section.isActive ? 'إخفاء القسم' : 'إظهار القسم'}
                                          onClick={() => handleToggleSectionActive(section, cat.code)}
                                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${section.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                                        >
                                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${section.isActive ? 'right-0.5' : 'left-0.5'}`} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-blue-700"
                                        title={isSectionCollapsed ? 'إظهار العناوين' : 'إخفاء العناوين'}
                                        aria-label={isSectionCollapsed ? 'إظهار العناوين' : 'إخفاء العناوين'}
                                        aria-expanded={!isSectionCollapsed}
                                        onClick={() => setCollapsedSections(current => ({
                                          ...current,
                                          [sectionCollapseKey]: !isSectionCollapsed,
                                        }))}
                                      >
                                        {isSectionCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                      </button>
                                    </div>
                                  </div>

                                  {!isSectionCollapsed && <div className="divide-y divide-gray-100">
                                    {section.items.map(item => (
                                      <div
                                        key={item.id}
                                        className={`flex flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:justify-between ${!item.is_active ? 'opacity-60' : ''}`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h5 className="text-sm font-semibold text-gray-900">{item.title_ar}</h5>
                                            <span className="text-[11px] text-gray-400">#{item.id}</span>
                                            <span className="text-[11px] text-gray-400">الترتيب: {item.sort_order}</span>
                                          </div>
                                          {item.title_en && (
                                            <p className="mt-0.5 truncate text-xs text-gray-500" dir="ltr">{item.title_en}</p>
                                          )}
                                          {(item.description_ar || item.description_en) && (
                                            <p className="mt-1 truncate text-xs leading-5 text-gray-500">{item.description_ar ?? item.description_en}</p>
                                          )}
                                          <div className="mt-1 flex flex-wrap items-center gap-2">
                                            {item.question_id ? (
                                              <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs text-green-700" title={linkableQuestions.find(q => q.questionId === item.question_id)?.questionText ?? ''}>
                                                <CheckCircle size={11} /> مرتبط بسؤال
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700" title="لا يعتمد على إجابة محددة ويستخدم البحث النصي">
                                                <AlertCircle size={11} /> غير مرتبط
                                              </span>
                                            )}
                                            {!item.is_active && (
                                              <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                                مخفي
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 md:shrink-0">
                                          <button
                                            title={item.is_active ? 'إخفاء' : 'إظهار'}
                                            onClick={() => handleToggleSubActive(item, cat.code)}
                                            className={`w-9 h-5 rounded-full transition-colors relative ${item.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                                          >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.is_active ? 'right-0.5' : 'left-0.5'}`} />
                                          </button>
                                          <button
                                            className="rounded p-1 text-gray-400 transition-colors hover:text-blue-600"
                                            title="تعديل"
                                            onClick={() => {
                                              setEditSubId(item.id);
                                              setSubForm({ titleAr: item.title_ar, titleEn: item.title_en ?? '', descriptionAr: item.description_ar ?? '', descriptionEn: item.description_en ?? '', questionId: item.question_id, sectionAr: item.section_ar ?? '', sectionEn: item.section_en ?? '', sortOrder: String(item.sort_order) });
                                              setLinkedQuestionLabel(item.question_id ? (linkableQuestions.find(q => q.questionId === item.question_id)?.questionText ?? `سؤال #${item.question_id}`) : '');
                                              setQuestionSearchOpen(false);
                                              setQuestionSearchText('');
                                              setShowSubForm(true);
                                            }}
                                          >
                                            <Pencil size={13} />
                                          </button>
                                          <button className={cls.btnDel} title="حذف" onClick={() => handleDeleteSubItem(item.id, cat.code)}>
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {section.items.length === 0 && (
                                      <p className="px-4 py-3 text-xs text-gray-400">لا توجد عناوين في هذا القسم بعد.</p>
                                    )}
                                  </div>
                                  }
                                </div>
                                );
                              })}
                            </div>
                          )}

                          {subItemsLoading !== cat.code && sectionsLoading !== cat.code && (subItemsMap[cat.code] ?? []).length === 0 && (sectionsMap[cat.code] ?? []).length === 0 && (
                            <p className="text-xs text-gray-400 py-2">لا توجد أقسام أو عناوين. أضف أول قسم أعلاه ثم أضف عناوينه.</p>
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
          </div>
        )}

      </div>
    </div>
  );
};
