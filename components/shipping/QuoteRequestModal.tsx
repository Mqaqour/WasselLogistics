import React, { useState } from 'react';
import { X, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Language } from '../../types';

interface QuoteRequestModalProps {
  lang: Language;
  onClose: () => void;
}

const SUBMIT_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/contact/submit`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({ lang, onClose }) => {
  const isAr = lang === 'ar';
  const [f, setF] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    shipmentType: 'parcel',
    origin: '',
    destination: '',
    weight: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof f, v: string) => { setF((p) => ({ ...p, [k]: v })); setError(''); };

  const t = {
    title: isAr ? 'طلب عرض سعر' : 'Request a Quote',
    subtitle: isAr
      ? 'للشحنات الخاصة أو الكميات — أخبرنا عن شحنتك وسيتواصل معك فريق المبيعات بعرض مخصّص.'
      : 'For special shipments or volume — tell us about your cargo and our sales team will come back with a custom quote.',
    name: isAr ? 'الاسم' : 'Full name',
    company: isAr ? 'الشركة (اختياري)' : 'Company (optional)',
    phone: isAr ? 'رقم الجوال' : 'Mobile number',
    email: isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)',
    shipmentType: isAr ? 'نوع الشحنة' : 'Shipment type',
    typeDocument: isAr ? 'مستندات' : 'Documents',
    typeParcel: isAr ? 'طرد' : 'Parcel',
    typeCargo: isAr ? 'بضائع / حمولة ثقيلة' : 'Cargo / heavy freight',
    origin: isAr ? 'من (مدينة / دولة)' : 'From (city / country)',
    destination: isAr ? 'إلى (مدينة / دولة)' : 'To (city / country)',
    weight: isAr ? 'الوزن التقريبي (اختياري)' : 'Approx. weight (optional)',
    details: isAr ? 'تفاصيل الشحنة' : 'Shipment details',
    detailsPh: isAr ? 'المحتوى، الأبعاد، عدد الطرود، أي متطلبات خاصة...' : 'Contents, dimensions, number of pieces, any special requirements...',
    submit: isAr ? 'إرسال الطلب' : 'Send Request',
    submitting: isAr ? 'جاري الإرسال...' : 'Sending...',
    close: isAr ? 'إغلاق' : 'Close',
    errRequired: isAr ? 'يرجى تعبئة الاسم ورقم الجوال وتفاصيل الشحنة' : 'Name, mobile and shipment details are required',
    errEmail: isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email',
    errGeneric: isAr ? 'تعذّر إرسال الطلب. حاول مرة أخرى.' : 'Could not send your request. Please try again.',
    okTitle: isAr ? 'تم استلام طلبك!' : 'Request received!',
    okBody: isAr ? 'سيتواصل معك فريق المبيعات بعرض السعر خلال يومي عمل.' : 'Our sales team will get back to you with a quote within 2 business days.',
  };

  const inputCls =
    'mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-wassel-yellow focus:border-wassel-yellow';

  const typeLabel = () =>
    f.shipmentType === 'document' ? t.typeDocument : f.shipmentType === 'cargo' ? t.typeCargo : t.typeParcel;

  const submit = async () => {
    if (!f.name.trim() || !f.phone.trim() || !f.details.trim()) { setError(t.errRequired); return; }
    if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) { setError(t.errEmail); return; }
    setError('');
    setSubmitting(true);

    const message = [
      isAr ? '— طلب عرض سعر —' : '— Quote request —',
      `${t.shipmentType}: ${typeLabel()}`,
      f.company.trim() ? `${t.company}: ${f.company.trim()}` : '',
      f.origin.trim() ? `${t.origin}: ${f.origin.trim()}` : '',
      f.destination.trim() ? `${t.destination}: ${f.destination.trim()}` : '',
      f.weight.trim() ? `${t.weight}: ${f.weight.trim()}` : '',
      '',
      f.details.trim(),
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'shipment',
          name: f.name.trim(),
          mobile: f.phone.trim(),
          email: f.email.trim() || undefined,
          message,
          language: lang,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data && data.ok === false)) throw new Error();
      setDone(true);
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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-white px-5 pt-6 pb-4 shrink-0 border-b border-gray-100">
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
              <FileText className="w-6 h-6" />
              {done ? t.okTitle : t.title}
            </h2>
            {!done && <p className="mt-2 text-gray-500 text-sm sm:text-base animate-slide-up delay-100">{t.subtitle}</p>}
          </div>
        </div>

        <div className="p-5 overflow-y-auto animate-pop delay-200">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700">{t.okBody}</p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-wassel-blue text-white font-bold hover:bg-wassel-darkBlue transition-colors"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.name}</label>
                  <input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.company}</label>
                  <input className={inputCls} value={f.company} onChange={(e) => set('company', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.phone}</label>
                  <input dir="ltr" type="tel" className={inputCls} value={f.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.email}</label>
                  <input dir="ltr" type="email" className={inputCls} value={f.email} onChange={(e) => set('email', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.shipmentType}</label>
                <div className="flex flex-wrap gap-2">
                  {(['document', 'parcel', 'cargo'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('shipmentType', v)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        f.shipmentType === v
                          ? 'border-wassel-blue bg-wassel-blue/5 text-wassel-blue font-semibold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {v === 'document' ? t.typeDocument : v === 'cargo' ? t.typeCargo : t.typeParcel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.origin}</label>
                  <input className={inputCls} value={f.origin} onChange={(e) => set('origin', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.destination}</label>
                  <input className={inputCls} value={f.destination} onChange={(e) => set('destination', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.weight}</label>
                <input className={inputCls} value={f.weight} onChange={(e) => set('weight', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.details}</label>
                <textarea rows={3} placeholder={t.detailsPh} className={`${inputCls} resize-none`} value={f.details} onChange={(e) => set('details', e.target.value)} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-wassel-blue text-white font-bold hover:bg-wassel-darkBlue transition-colors disabled:opacity-70"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t.submitting}</> : <><FileText className="w-4 h-4" />{t.submit}</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
