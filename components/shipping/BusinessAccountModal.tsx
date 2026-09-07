import React, { useState } from 'react';
import {
  X, Check, ChevronRight, ChevronLeft, Loader2, CheckCircle2,
  Receipt, Headphones, Truck, ShieldCheck, BarChart3,
} from 'lucide-react';
import { Language } from '../../types';

interface BusinessAccountModalProps {
  lang: Language;
  onClose: () => void;
}

const SUBMIT_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/business-account/submit`;
const BENEFITS_SEEN_KEY = 'wassel_business_account_benefits_seen';

const hasSeenBenefits = (): boolean => {
  try {
    return localStorage.getItem(BENEFITS_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markBenefitsSeen = (): void => {
  try {
    localStorage.setItem(BENEFITS_SEEN_KEY, '1');
  } catch {
    /* private mode / storage disabled — the intro just shows again next time */
  }
};

const TOTAL_STEPS = 4;

interface FormState {
  services: string[];
  companyName: string;
  companyRegNo: string;
  industry: string;
  website: string;
  monthlyVolumeBand: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  consent: boolean;
}

const EMPTY_FORM: FormState = {
  services: [],
  companyName: '',
  companyRegNo: '',
  industry: '',
  website: '',
  monthlyVolumeBand: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  consent: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BusinessAccountModal: React.FC<BusinessAccountModalProps> = ({ lang, onClose }) => {
  const isAr = lang === 'ar';
  const [showBenefits, setShowBenefits] = useState(() => !hasSeenBenefits());
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneRef, setDoneRef] = useState<number | null>(null);

  const dismissBenefits = () => {
    markBenefitsSeen();
    setShowBenefits(false);
  };

  // Closing from the intro still counts as "seen" — it only ever shows once.
  const handleClose = () => {
    if (showBenefits) markBenefitsSeen();
    onClose();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const t = {
    title: isAr ? 'فتح حساب تجاري' : 'Open a Business Account',
    subtitle: isAr
      ? 'أنشئ حساباً لشركتك واحصل على أسعار وخدمة مخصصة للأعمال.'
      : 'Set up an account for your company and get business-grade pricing and service.',
    stepOf: isAr ? `الخطوة ${step} من ${TOTAL_STEPS}` : `Step ${step} of ${TOTAL_STEPS}`,
    close: isAr ? 'إغلاق' : 'Close',
    back: isAr ? 'السابق' : 'Back',
    next: isAr ? 'التالي' : 'Next',
    submit: isAr ? 'إرسال الطلب' : 'Submit Request',
    submitting: isAr ? 'جاري الإرسال...' : 'Submitting...',

    benefitsTitle: isAr ? 'لماذا تفتح حساباً تجارياً مع واصل؟' : 'Why open a business account with Wassel?',
    benefitsIntro: isAr
      ? 'حساب واحد يمنح شركتك أسعاراً وخدمة ومتابعة مصمّمة للأعمال.'
      : 'One account gives your company business-grade pricing, service, and visibility.',
    benefitsCta: isAr ? 'ابدأ الطلب' : 'Get Started',
    benefitsSkip: isAr ? 'تخطٍّ' : 'Skip',

    s1Title: isAr ? 'ما الخدمات التي تحتاجها؟' : 'Which services do you need?',
    s1Hint: isAr ? 'اختر واحدة أو أكثر' : 'Select one or more',

    s2Title: isAr ? 'بيانات الشركة' : 'Company details',
    companyName: isAr ? 'اسم الشركة' : 'Company name',
    companyRegNo: isAr ? 'السجل التجاري / الرقم الضريبي' : 'Commercial registration / tax no.',
    industry: isAr ? 'القطاع' : 'Industry',
    website: isAr ? 'الموقع الإلكتروني' : 'Website',
    monthlyVolume: isAr ? 'عدد الشحنات الشهري المتوقع' : 'Estimated monthly shipments',

    s3Title: isAr ? 'الشخص المسؤول' : 'Primary contact',
    contactName: isAr ? 'الاسم' : 'Full name',
    contactEmail: isAr ? 'البريد الإلكتروني للعمل' : 'Work email',
    contactPhone: isAr ? 'رقم الجوال' : 'Mobile number',

    s4Title: isAr ? 'مراجعة وإرسال' : 'Review & submit',
    consent: isAr
      ? 'أوافق على أن يتواصل معي فريق واصل بخصوص هذا الطلب.'
      : 'I agree to be contacted by the Wassel team about this request.',
    optional: isAr ? '(اختياري)' : '(optional)',

    errServices: isAr ? 'يرجى اختيار خدمة واحدة على الأقل' : 'Please select at least one service',
    errCompany: isAr ? 'اسم الشركة مطلوب' : 'Company name is required',
    errContact: isAr ? 'يرجى تعبئة الاسم والبريد الإلكتروني ورقم الجوال' : 'Name, email and mobile are required',
    errEmail: isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email',
    errConsent: isAr ? 'يرجى الموافقة للمتابعة' : 'Please tick the box to continue',
    errGeneric: isAr ? 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'Could not submit your request. Please try again.',

    successTitle: isAr ? 'تم استلام طلبك!' : 'Request received!',
    successBody: isAr
      ? 'سيتواصل معك فريق الحسابات التجارية في واصل خلال يومي عمل.'
      : 'Our corporate accounts team will contact you within 2 business days.',
  };

  const SERVICES: { id: string; label: string }[] = [
    { id: 'domestic', label: isAr ? 'شحن محلي' : 'Domestic Shipping' },
    { id: 'express', label: isAr ? 'شحن دولي سريع' : 'International Express' },
    { id: 'cargo', label: isAr ? 'شحن بضائع / جوي وبحري' : 'Cargo & Freight' },
    { id: 'customs', label: isAr ? 'تخليص جمركي' : 'Customs Clearance' },
    { id: '3pl', label: isAr ? 'تخزين وخدمات لوجستية (3PL)' : '3PL & Warehousing' },
    { id: 'cod', label: isAr ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery' },
  ];

  const INDUSTRIES = isAr
    ? ['التجارة الإلكترونية', 'تجزئة', 'تصنيع', 'أدوية ورعاية صحية', 'أغذية ومشروبات', 'تقنية', 'حكومي / منظمات', 'أخرى']
    : ['E-commerce', 'Retail', 'Manufacturing', 'Pharma & Healthcare', 'Food & Beverage', 'Technology', 'Government / NGO', 'Other'];

  const VOLUME_BANDS = ['<50', '50–200', '200–1000', '1000+'];

  const BENEFITS: { icon: React.ElementType; title: string; desc: string }[] = [
    {
      icon: Receipt,
      title: isAr ? 'فوترة شهرية وأسعار تعاقدية' : 'Monthly invoicing & contract rates',
      desc: isAr ? 'اشحن الآن وادفع لاحقاً بأسعار مخصّصة حسب حجمك.' : 'Ship now, pay later, at pricing tailored to your volume.',
    },
    {
      icon: Headphones,
      title: isAr ? 'مدير حساب مخصّص' : 'Dedicated account manager',
      desc: isAr ? 'نقطة تواصل واحدة لكل شحناتك واستفساراتك.' : 'One point of contact for every shipment and question.',
    },
    {
      icon: Truck,
      title: isAr ? 'استلام مجدول ومنتظم' : 'Scheduled, recurring pickups',
      desc: isAr ? 'نمرّ على مقرّك في المواعيد التي تناسب عملياتك.' : 'We collect from your premises on a schedule that fits you.',
    },
    {
      icon: ShieldCheck,
      title: isAr ? 'دعم تخليص جمركي بالأولوية' : 'Priority customs support',
      desc: isAr ? 'فريق متخصص يسرّع تخليص شحناتك الدولية.' : 'A specialist team fast-tracks your international clearances.',
    },
    {
      icon: BarChart3,
      title: isAr ? 'لوحة تتبّع وتقارير موحّدة' : 'Consolidated tracking & reports',
      desc: isAr ? 'كل الخدمات — محلي، دولي، شحن، تخزين — تحت حساب واحد.' : 'Domestic, international, freight and warehousing under one account.',
    },
  ];

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(id) ? f.services.filter((s) => s !== id) : [...f.services, id],
    }));
    setError('');
  };

  const validateStep = (): boolean => {
    if (step === 1 && form.services.length === 0) { setError(t.errServices); return false; }
    if (step === 2 && !form.companyName.trim()) { setError(t.errCompany); return false; }
    if (step === 3) {
      if (!form.contactName.trim() || !form.contactEmail.trim() || !form.contactPhone.trim()) { setError(t.errContact); return false; }
      if (!EMAIL_RE.test(form.contactEmail.trim())) { setError(t.errEmail); return false; }
    }
    if (step === 4 && !form.consent) { setError(t.errConsent); return false; }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const back = () => { setError(''); setStep((s) => Math.max(1, s - 1)); };

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: form.services,
          companyName: form.companyName.trim(),
          companyRegNo: form.companyRegNo.trim() || undefined,
          industry: form.industry || undefined,
          website: form.website.trim() || undefined,
          monthlyVolumeBand: form.monthlyVolumeBand || undefined,
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          language: lang,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setDoneRef(typeof data.id === 'number' ? data.id : 0);
    } catch {
      setError(t.errGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-wassel-yellow focus:border-wassel-yellow';
  const labelCls = 'block text-sm font-medium text-gray-700';

  const field = (key: keyof FormState, label: string, opts?: { type?: string; optional?: boolean; placeholder?: string }) => (
    <div>
      <label className={labelCls}>
        {label} {opts?.optional && <span className="text-gray-400 font-normal">{t.optional}</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        dir={opts?.type === 'email' || opts?.type === 'tel' || opts?.type === 'url' ? 'ltr' : undefined}
        placeholder={opts?.placeholder}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as FormState[typeof key])}
        className={inputCls}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/50"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-white px-5 pt-6 pb-4 shrink-0 border-b border-gray-100">
          <button
            onClick={handleClose}
            aria-label={t.close}
            title={t.close}
            className="absolute top-2 right-2 rtl:left-2 rtl:right-auto z-10 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-1">
            <h2 className="font-extrabold text-wassel-blue text-2xl animate-slide-up">
              {doneRef !== null ? t.successTitle : t.title}
            </h2>
            {doneRef === null && (
              <p className="mt-2 text-gray-500 text-sm sm:text-base animate-slide-up delay-100">{t.subtitle}</p>
            )}
          </div>

          {doneRef === null && !showBenefits && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 text-center mb-1.5">{t.stepOf}</p>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-wassel-blue transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto animate-pop delay-200">
          {showBenefits ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{t.benefitsTitle}</h4>
                <p className="text-sm text-gray-500 mt-1">{t.benefitsIntro}</p>
              </div>
              <ul className="space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-wassel-blue/5 text-wassel-blue">
                      <b.icon className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{b.title}</p>
                      <p className="text-xs text-gray-500">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={dismissBenefits}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-wassel-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-wassel-darkBlue transition-colors"
                >
                  {t.benefitsCta}
                  {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={dismissBenefits}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  {t.benefitsSkip}
                </button>
              </div>
            </div>
          ) : doneRef !== null ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700">{t.successBody}</p>
              <button
                onClick={onClose}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-wassel-blue text-white font-bold hover:bg-wassel-darkBlue transition-colors"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <h4 className="font-bold text-gray-800">{t.s1Title}</h4>
                    <p className="text-xs text-gray-500">{t.s1Hint}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SERVICES.map((s) => {
                      const active = form.services.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-start transition-colors ${
                            active ? 'border-wassel-blue bg-wassel-blue/5 text-wassel-blue font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className={`flex size-5 shrink-0 items-center justify-center rounded border ${active ? 'border-wassel-blue bg-wassel-blue text-white' : 'border-gray-300'}`}>
                            {active && <Check className="w-3.5 h-3.5" />}
                          </span>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h4 className="font-bold text-gray-800">{t.s2Title}</h4>
                  {field('companyName', t.companyName)}
                  {field('companyRegNo', t.companyRegNo, { optional: true })}
                  <div>
                    <label className={labelCls}>{t.industry} <span className="text-gray-400 font-normal">{t.optional}</span></label>
                    <select value={form.industry} onChange={(e) => set('industry', e.target.value)} className={inputCls}>
                      <option value="">—</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  {field('website', t.website, { type: 'url', optional: true, placeholder: 'https://' })}
                  <div>
                    <label className={labelCls}>{t.monthlyVolume} <span className="text-gray-400 font-normal">{t.optional}</span></label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {VOLUME_BANDS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => set('monthlyVolumeBand', form.monthlyVolumeBand === b ? '' : b)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            form.monthlyVolumeBand === b ? 'border-wassel-blue bg-wassel-blue/5 text-wassel-blue font-semibold' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h4 className="font-bold text-gray-800">{t.s3Title}</h4>
                  {field('contactName', t.contactName)}
                  {field('contactEmail', t.contactEmail, { type: 'email' })}
                  {field('contactPhone', t.contactPhone, { type: 'tel' })}
                </>
              )}

              {step === 4 && (
                <>
                  <h4 className="font-bold text-gray-800">{t.s4Title}</h4>
                  <dl className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                    {[
                      [t.s1Title.replace('?', '').replace('؟', ''), form.services.map((id) => SERVICES.find((s) => s.id === id)?.label).filter(Boolean).join(isAr ? '، ' : ', ')],
                      [t.companyName, form.companyName],
                      [t.companyRegNo, form.companyRegNo],
                      [t.industry, form.industry],
                      [t.website, form.website],
                      [t.monthlyVolume, form.monthlyVolumeBand],
                      [t.contactName, form.contactName],
                      [t.contactEmail, form.contactEmail],
                      [t.contactPhone, form.contactPhone],
                    ]
                      .filter(([, v]) => v && String(v).trim().length > 0)
                      .map(([k, v]) => (
                        <div key={k as string} className="flex gap-3 px-3 py-2">
                          <dt className="w-40 shrink-0 text-gray-500">{k}</dt>
                          <dd className="font-medium text-gray-800 whitespace-pre-line break-words">{v}</dd>
                        </div>
                      ))}
                  </dl>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5" />
                    {t.consent}
                  </label>
                </>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {doneRef === null && !showBenefits && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-4 shrink-0">
            <button
              type="button"
              onClick={back}
              disabled={step === 1 || submitting}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {t.back}
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 rounded-lg bg-wassel-blue px-5 py-2 text-sm font-bold text-white hover:bg-wassel-darkBlue transition-colors"
              >
                {t.next}
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-wassel-blue px-5 py-2 text-sm font-bold text-white hover:bg-wassel-darkBlue transition-colors disabled:opacity-70"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t.submitting}</> : t.submit}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
