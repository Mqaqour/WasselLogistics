import React, { useState } from 'react';
import { X, Bell, Loader2, CheckCircle2 } from 'lucide-react';
import { Language } from '../../types';

interface NotifyMeModalProps {
  lang: Language;
  onClose: () => void;
  /** Optional tracking number to prefill (e.g. from a failed lookup). */
  initialTrackingNumber?: string;
}

const REGISTER_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/waiting-shipments/register`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NotifyMeModal: React.FC<NotifyMeModalProps> = ({ lang, onClose, initialTrackingNumber }) => {
  const isAr = lang === 'ar';
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<'ok' | 'already' | null>(null);
  const [error, setError] = useState('');

  const t = {
    title: isAr ? 'أبلغني عند وصول الشحنة' : 'Notify me when it arrives',
    subtitle: isAr
      ? 'سجّل رقم التتبع وبياناتك، وسنراسلك فور توفّر معلومات عن الشحنة.'
      : "Register your tracking number and we'll email you as soon as the shipment shows up.",
    tracking: isAr ? 'رقم التتبع' : 'Tracking number',
    name: isAr ? 'الاسم' : 'Full name',
    email: isAr ? 'البريد الإلكتروني' : 'Email',
    phone: isAr ? 'رقم الجوال' : 'Mobile number',
    submit: isAr ? 'سجّلني' : 'Register',
    submitting: isAr ? 'جاري التسجيل...' : 'Registering...',
    close: isAr ? 'إغلاق' : 'Close',
    errRequired: isAr ? 'يرجى تعبئة جميع الحقول' : 'Please fill in every field',
    errEmail: isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email',
    errGeneric: isAr ? 'تعذّر التسجيل حالياً. حاول مرة أخرى.' : 'Could not register right now. Please try again.',
    okTitle: isAr ? 'تم التسجيل!' : "You're registered!",
    okBody: isAr
      ? 'سنرسل لك بريداً إلكترونياً فور توفّر معلومات عن شحنتك.'
      : "We'll email you the moment your shipment appears.",
    alreadyBody: isAr
      ? 'رقم التتبع هذا مسجّل مسبقاً لتلقّي الإشعارات.'
      : 'This tracking number is already registered for notifications.',
  };

  const inputCls =
    'mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-wassel-yellow focus:border-wassel-yellow';

  const submit = async () => {
    if (!trackingNumber.trim() || !name.trim() || !email.trim() || !phone.trim()) {
      setError(t.errRequired);
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t.errEmail);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          language: lang,
        }),
      });
      if (res.status === 409) {
        setDone('already');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone('ok');
    } catch {
      setError(t.errGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/50"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-white px-5 pt-6 pb-4 border-b border-gray-100">
          <button
            onClick={onClose}
            aria-label={t.close}
            title={t.close}
            className="absolute top-2 right-2 rtl:left-2 rtl:right-auto z-10 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="font-extrabold text-wassel-blue text-2xl animate-slide-up flex items-center justify-center gap-2">
              <Bell className="w-6 h-6" />
              {done ? t.okTitle : t.title}
            </h2>
            {!done && <p className="mt-2 text-gray-500 text-sm sm:text-base animate-slide-up delay-100">{t.subtitle}</p>}
          </div>
        </div>

        <div className="p-5 animate-pop delay-200">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700">{done === 'already' ? t.alreadyBody : t.okBody}</p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-wassel-blue text-white font-bold hover:bg-wassel-darkBlue transition-colors"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.tracking}</label>
                <input dir="ltr" className={inputCls} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.name}</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.email}</label>
                  <input dir="ltr" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.phone}</label>
                  <input dir="ltr" type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-wassel-blue text-white font-bold hover:bg-wassel-darkBlue transition-colors disabled:opacity-70"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t.submitting}</> : <><Bell className="w-4 h-4" />{t.submit}</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
