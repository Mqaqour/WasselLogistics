import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { PreChatFormData, ServiceType } from './types/chat.types';

interface PreChatFormProps {
  lang: 'ar' | 'en';
  onSubmit: (data: PreChatFormData) => Promise<void>;
}

const SERVICE_OPTIONS: { value: ServiceType; labelEn: string; labelAr: string }[] = [
  { value: 'Domestic Shipping',     labelEn: 'Domestic Shipping',     labelAr: 'شحن محلي' },
  { value: 'International Express', labelEn: 'International Express', labelAr: 'شحن دولي سريع' },
  { value: 'Cargo / Heavy Freight', labelEn: 'Cargo / Heavy Freight', labelAr: 'شحن بضائع / حمولات ثقيلة' },
  { value: 'Customs Clearance',     labelEn: 'Customs Clearance',     labelAr: 'تخليص جمركي' },
  { value: 'Jordanian Passports',   labelEn: 'Jordanian Passports',   labelAr: 'جوازات أردنية' },
  { value: 'Passport Delivery',     labelEn: 'Passport Delivery',     labelAr: 'توصيل جوازات سفر' },
  { value: 'Shop & Ship',           labelEn: 'Shop & Ship',           labelAr: 'تسوق وشحن' },
  { value: 'Complaints',            labelEn: 'Complaints',            labelAr: 'شكاوى' },
  { value: 'Other',                 labelEn: 'Other',                 labelAr: 'أخرى' },
];

export const PreChatForm: React.FC<PreChatFormProps> = ({ lang, onSubmit }) => {
  const isAr = lang === 'ar';
  const [form, setForm] = useState<PreChatFormData>({
    firstName:    '',
    phone:        '',
    email:        '',
    serviceType:  'Domestic Shipping',
    trackingNumber: '',
    firstMessage: '',
    language:     lang,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title:          isAr ? 'تواصل مع واصل' : 'Chat with Wassel',
    subtitle:       isAr ? 'أدخل بياناتك للبدء' : 'Enter your details to start',
    name:           isAr ? 'الاسم' : 'Name',
    phone:          isAr ? 'رقم الجوال' : 'Mobile Number',
    email:          isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)',
    serviceType:    isAr ? 'نوع الخدمة' : 'Service Type',
    trackingNumber: isAr ? 'رقم التتبع (اختياري)' : 'Tracking Number (optional)',
    message:        isAr ? 'الرسالة' : 'Message',
    send:           isAr ? 'إرسال' : 'Send',
    sending:        isAr ? 'جاري الإرسال...' : 'Sending...',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim()) { setError(isAr ? 'الاسم مطلوب' : 'Name is required'); return; }
    if (!form.phone.trim())     { setError(isAr ? 'رقم الجوال مطلوب' : 'Phone is required'); return; }
    if (!form.firstMessage.trim()) { setError(isAr ? 'الرسالة مطلوبة' : 'Message is required'); return; }

    setSubmitting(true);
    try {
      await onSubmit({ ...form, language: lang });
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (id: keyof PreChatFormData, label: string, type = 'text', required = true) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] outline-none"
        value={(form[id] as string) ?? ''}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h3 className="text-base font-bold text-[#002B49]">{t.title}</h3>
        <p className="text-xs text-gray-500">{t.subtitle}</p>
      </div>

      {field('firstName', t.name)}
      {field('phone',     t.phone, 'tel')}
      {field('email',     t.email, 'email', false)}

      <div>
        <label htmlFor="serviceType" className="block text-xs font-semibold text-gray-600 mb-1">
          {t.serviceType} <span className="text-red-500">*</span>
        </label>
        <select
          id="serviceType"
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] outline-none bg-white"
          value={form.serviceType}
          onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}
        >
          {SERVICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {isAr ? o.labelAr : o.labelEn}
            </option>
          ))}
        </select>
      </div>

      {field('trackingNumber', t.trackingNumber, 'text', false)}

      <div>
        <label htmlFor="firstMessage" className="block text-xs font-semibold text-gray-600 mb-1">
          {t.message} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="firstMessage"
          required
          rows={3}
          maxLength={7000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] outline-none resize-none"
          value={form.firstMessage}
          onChange={(e) => setForm({ ...form, firstMessage: e.target.value })}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#002B49] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#003a61] transition-colors disabled:opacity-60"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" />{t.sending}</>
        ) : (
          <><Send className="w-4 h-4" />{t.send}</>
        )}
      </button>
    </form>
  );
};
