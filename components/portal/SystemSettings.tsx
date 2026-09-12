import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, LayoutDashboard, Loader2, Mail, Save, X } from 'lucide-react';
import { Language } from '../../types';
import { adminFetch } from '../../services/adminApi';
import { TwoFactorCard } from './TwoFactorCard';

interface SystemSettingsProps {
  lang: Language;
}

interface NotificationSettings {
  pickupNotifyEmail: string;
  contactNotifyEmail: string;
  loginAlertEmails: string;
  businessAccountEmail: string;
  novicaApplyEmail: string;
  contactTopicEmails: Record<string, string>;
}

// Kept in sync with the Contact form topics and CONTACT_TOPIC_IDS on the backend.
const CONTACT_TOPICS: { id: string; en: string; ar: string }[] = [
  { id: 'general',   en: 'General Inquiry',        ar: 'استفسار عام' },
  { id: 'shipment',  en: 'Shipment Inquiry',       ar: 'استفسار عن شحنة' },
  { id: 'passport',  en: 'Jordan Passport Services', ar: 'خدمات الجوازات الأردنية' },
  { id: 'complaint', en: 'Complaint',              ar: 'شكوى' },
  { id: 'claiming',  en: 'Claiming',               ar: 'مطالبة' },
];

const cls = {
  input: 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',
  btnPrim: 'bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 transition-colors',
  btnSec: 'flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors',
  card: 'bg-white border border-gray-100 rounded-xl shadow-sm',
};

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

export const SystemSettings: React.FC<SystemSettingsProps> = ({ lang }) => {
  const navigate = useNavigate();
  const isRtl = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<NotificationSettings>({
    pickupNotifyEmail: '',
    contactNotifyEmail: '',
    loginAlertEmails: '',
    businessAccountEmail: '',
    novicaApplyEmail: '',
    contactTopicEmails: {},
  });

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    adminFetch('/api/admin/settings/notifications')
      .then((r) => r.json())
      .then((data: { success: boolean; settings: NotificationSettings }) => {
        if (data.success) setForm({ ...data.settings, businessAccountEmail: data.settings.businessAccountEmail ?? "", novicaApplyEmail: data.settings.novicaApplyEmail ?? "", contactTopicEmails: data.settings.contactTopicEmails ?? {} });
      })
      .catch(() => flash(isRtl ? 'فشل تحميل الإعدادات' : 'Failed to load settings', false))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        flash(data?.error?.message ?? (isRtl ? 'فشل حفظ الإعدادات' : 'Failed to save settings'), false);
        return;
      }
      setForm({ ...data.settings, businessAccountEmail: data.settings.businessAccountEmail ?? "", novicaApplyEmail: data.settings.novicaApplyEmail ?? "", contactTopicEmails: data.settings.contactTopicEmails ?? {} });
      flash(isRtl ? '✓ تم حفظ الإعدادات' : '✓ Settings saved', true);
    } catch {
      flash(isRtl ? 'فشل حفظ الإعدادات' : 'Failed to save settings', false);
    } finally {
      setSaving(false);
    }
  };

  const t = {
    title: isRtl ? 'إعدادات النظام' : 'System Settings',
    subtitle: isRtl ? 'التحكم بإعدادات النظام القابلة للتعديل دون الحاجة لتعديل الكود' : 'Control the system\'s admin-editable settings without a code change',
    notificationsTitle: isRtl ? 'إشعارات البريد الإلكتروني' : 'Email Notifications',
    notificationsSubtitle: isRtl
      ? 'البريد الإلكتروني الذي يستلم إشعارات النظام المختلفة'
      : 'Which inboxes receive the different system notifications',
    pickup: isRtl ? 'بريد إشعارات طلبات الاستلام' : 'Pickup request notifications',
    contact: isRtl ? 'بريد إشعارات نموذج التواصل (الافتراضي)' : 'Contact form notifications (default)',
    contactPerTopic: isRtl
      ? 'بريد مخصص لكل نوع استفسار — اتركه فارغاً لاستخدام البريد الافتراضي أعلاه'
      : 'Dedicated inbox per inquiry type — leave blank to use the default above',
    businessAccount: isRtl
      ? 'البريد الإلكتروني للقسم التجاري — يستقبل طلبات فتح الحسابات (اتركه فارغاً لاستخدام بريد التواصل، وافصل بين العناوين بفاصلة)'
      : 'Commercial department emails — receives business account requests (blank = use the contact inbox; comma-separate multiple)',
    novicaApply: isRtl
      ? 'بريد طلبات نوفيكا — يستقبل طلبات الانضمام من صفحة /novica (اتركه فارغاً لاستخدام بريد التواصل، وافصل بين العناوين بفاصلة)'
      : 'Novica applications — receives artisan applications from /novica (blank = use the contact inbox; comma-separate multiple)',
    loginAlerts: isRtl ? 'بريد تنبيهات حظر تسجيل الدخول (يفصل بينها بفاصلة)' : 'Login-block security alerts (comma-separated)',
    save: isRtl ? 'حفظ التغييرات' : 'Save Changes',
    dashboard: isRtl ? 'لوحة التحكم' : 'Dashboard',
    kbAdmin: isRtl ? 'قاعدة المعرفة' : 'KB Admin',
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/${lang}/dashboard`)} className={cls.btnSec}>
              <LayoutDashboard size={14} />
              {t.dashboard}
            </button>
            <button onClick={() => navigate(`/${lang}/admin/kb`)} className={cls.btnSec}>
              <Database size={14} />
              {t.kbAdmin}
            </button>
          </div>
        </div>

        <Flash msg={msg} onDismiss={() => setMsg(null)} />

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : (
          <div className={`${cls.card} p-5 space-y-4`}>
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Mail size={16} className="text-blue-500" />
              <div>
                <h2 className="font-semibold text-gray-800">{t.notificationsTitle}</h2>
                <p className="text-xs text-gray-400">{t.notificationsSubtitle}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.pickup}</label>
              <input
                type="text"
                dir="ltr"
                className={cls.input}
                value={form.pickupNotifyEmail}
                onChange={(e) => setForm((f) => ({ ...f, pickupNotifyEmail: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.contact}</label>
              <input
                type="text"
                dir="ltr"
                className={cls.input}
                value={form.contactNotifyEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactNotifyEmail: e.target.value }))}
              />
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 space-y-3">
              <p className="text-xs text-gray-500">{t.contactPerTopic}</p>
              {CONTACT_TOPICS.map((topic) => (
                <div key={topic.id}>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? topic.ar : topic.en}</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder={form.contactNotifyEmail || (isRtl ? 'البريد الافتراضي' : 'default inbox')}
                    className={cls.input}
                    value={form.contactTopicEmails?.[topic.id] ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        contactTopicEmails: { ...f.contactTopicEmails, [topic.id]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.businessAccount}</label>
              <input
                type="text"
                dir="ltr"
                placeholder={form.contactNotifyEmail || (isRtl ? 'البريد الافتراضي' : 'default inbox')}
                className={cls.input}
                value={form.businessAccountEmail}
                onChange={(e) => setForm((f) => ({ ...f, businessAccountEmail: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.novicaApply}</label>
              <input
                type="text"
                dir="ltr"
                placeholder={form.contactNotifyEmail || (isRtl ? 'البريد الافتراضي' : 'default inbox')}
                className={cls.input}
                value={form.novicaApplyEmail}
                onChange={(e) => setForm((f) => ({ ...f, novicaApplyEmail: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.loginAlerts}</label>
              <input
                type="text"
                dir="ltr"
                className={cls.input}
                value={form.loginAlertEmails}
                onChange={(e) => setForm((f) => ({ ...f, loginAlertEmails: e.target.value }))}
              />
            </div>

            <div className="pt-2">
              <button className={cls.btnPrim} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t.save}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <TwoFactorCard lang={lang} />
        </div>
      </div>
    </div>
  );
};
