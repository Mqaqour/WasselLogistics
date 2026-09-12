import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import {
  Globe2, Users, ShoppingBag, Sparkles, Truck,
  CheckCircle2, Loader2, AlertCircle, Check, ArrowLeft, ArrowRight, Quote,
} from 'lucide-react';
import { CopilotToggle } from '../shared/CopilotToggle';

const SUBMIT_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/novica/apply`;
const NOVICA_LOGO = `${import.meta.env.BASE_URL}assets/Novica.png`;
const NOVICA_BG = `${import.meta.env.BASE_URL}assets/NovicaBG.png`;
const NOVICA_HERO_BG = `${import.meta.env.BASE_URL}assets/NovicaBg2.png`;
const WASSEL_LOGO = `${import.meta.env.BASE_URL}assets/Wassel logo-01.png`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CRAFT_TYPES: Array<{ value: string; en: string; ar: string }> = [
  { value: 'embroidery',     en: 'Embroidery',        ar: 'تطريز' },
  { value: 'pottery',        en: 'Pottery',            ar: 'فخار' },
  { value: 'glass-ceramic',  en: 'Glass / Ceramic',    ar: 'زجاج / سيراميك' },
  { value: 'wood-carving',   en: 'Wood carving',       ar: 'نحت خشبي' },
  { value: 'jewelry',        en: 'Jewelry',            ar: 'مجوهرات' },
  { value: 'painting',       en: 'Painting',           ar: 'رسم / لوحات' },
  { value: 'other',          en: 'Other',              ar: 'أخرى' },
];

/** True the first time the returned ref's element scrolls into view (stays true after). */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, visible] as const;
}

const revealCls = (visible: boolean) => `transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`;

/** Counts from 0 to `to` once the returned ref's element scrolls into view. */
function useCountUp(to: number, durationMs = 1400) {
  const [ref, visible] = useRevealed<HTMLDivElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, to, durationMs]);

  return [ref, value] as const;
}

const StatItem: React.FC<{ to: number; suffix?: string; label: string; className?: string }> = ({ to, suffix = '', label, className = '' }) => {
  const [ref, value] = useCountUp(to);
  return (
    <div ref={ref} className={`text-center ${className}`}>
      <div className="text-4xl md:text-5xl font-extrabold text-wassel-blue tabular-nums">
        {value}{suffix}
      </div>
      <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
};

/** Fades/slides a section in the first time it scrolls into view. */
const Reveal: React.FC<{ children: React.ReactNode; delayMs?: number; className?: string }> = ({
  children, delayMs = 0, className = '',
}) => {
  const [ref, visible] = useRevealed<HTMLDivElement>();
  return (
    <div ref={ref} className={`${revealCls(visible)} ${className}`} style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}>
      {children}
    </div>
  );
};

/** Same reveal animation, but as a real <li> so it stays valid inside an <ol>/<ul>. */
const RevealListItem: React.FC<{ children: React.ReactNode; delayMs?: number; className?: string; onClick?: () => void }> = ({
  children, delayMs = 0, className = '', onClick,
}) => {
  const [ref, visible] = useRevealed<HTMLLIElement>();
  return (
    <li ref={ref} onClick={onClick} className={`${revealCls(visible)} ${className}`} style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}>
      {children}
    </li>
  );
};

interface NovicaProps {
  lang: Language;
  onAction?: (action: string) => void;
}

interface FormState {
  fullName: string;
  projectName: string;
  city: string;
  mobile: string;
  email: string;
  craftType: string;
  craftTypeOther: string;
  hasSamples: '' | 'yes' | 'no';
  sellsOnline: '' | 'yes' | 'no';
  sellsOnlineWhere: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  fullName: '', projectName: '', city: '', mobile: '', email: '',
  craftType: '', craftTypeOther: '', hasSamples: '', sellsOnline: '', sellsOnlineWhere: '', notes: '',
};

export const Novica: React.FC<NovicaProps> = ({ lang, onAction }) => {
  const isAr = lang === 'ar';
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const t = {
    title: isAr ? 'نوفيكا فلسطين' : 'Novica Palestine',
    tagline: isAr
      ? 'منصة عالمية تحتضن الحرفيين الفلسطينيين وتفتح لهم أبواب الأسواق الدولية.'
      : 'A global platform that welcomes Palestinian artisans and opens the door to international markets.',
    intro: isAr
      ? 'ندعم الإبداع المحلي، ونربط المواهب الفلسطينية بملايين المشترين حول العالم.'
      : "We support local creativity and connect Palestinian talent with millions of buyers around the world.",

    aboutP: isAr
      ? 'نوفيكا هي سوق عالمي متخصص بالحرف اليدوية الأصيلة، يصل إلى ملايين المشترين في أكثر من 165 دولة. من خلال شراكة نوفيكا فلسطين مع واصل، يحصل الحرفيون الفلسطينيون على قناة تصدير موثوقة — من استلام المنتج وتغليفه وحتى شحنه والتخليص عليه دولياً — لتصل أعمالهم اليدوية إلى بيوت حول العالم.'
      : "Novica is a global marketplace dedicated to authentic, handmade craftsmanship, reaching millions of buyers in more than 165 countries. Through Novica Palestine's partnership with Wassel, Palestinian artisans get a reliable export channel — from pickup and packaging to international shipping and customs clearance — so their handmade work reaches homes around the world.",

    statCountries: isAr ? 'دولة حول العالم' : 'Countries reached',
    statSteps: isAr ? 'خطوات بسيطة للانضمام' : 'Simple steps to join',
    statFree: isAr ? 'مجاني بالكامل للتقديم' : 'Free to apply',

    spotlightQuote: isAr ? 'حرفتك تستحق أن يراها العالم' : 'Your craft deserves to be seen by the world',
    spotlightBody: isAr
      ? 'كل قطعة مطرزة أو مصنوعة بيد حرفي فلسطيني تحمل قصة أصالة وصبر. نوفيكا وواصل يفتحان لهذه القصص طريقاً إلى بيوت ومحال حول العالم.'
      : 'Every piece handmade by a Palestinian artisan carries a story of authenticity and patience. Novica and Wassel help that story reach homes and shelves around the world.',

    benefitsTitle: isAr ? 'ماذا يقدّم لك البرنامج' : 'What the program offers you',
    benefits: [
      {
        icon: Globe2,
        title: isAr ? 'وصول عالمي' : 'Global reach',
        desc: isAr
          ? 'اعرض أعمالك اليدوية على novica.com أمام ملايين المشترين حول العالم.'
          : 'Showcase your handmade work on novica.com to millions of buyers worldwide.',
      },
      {
        icon: Truck,
        title: isAr ? 'شحن وتخليص متكامل' : 'End-to-end shipping',
        desc: isAr
          ? 'واصل تتولى الاستلام والتغليف والشحن الدولي والتخليص الجمركي نيابةً عنك.'
          : 'Wassel handles pickup, packaging, international shipping, and customs clearance for you.',
      },
      {
        icon: Users,
        title: isAr ? 'دعم مخصص' : 'Dedicated support',
        desc: isAr
          ? 'فريق نوفيكا وواصل يرافقانك من التقديم وحتى وصول أول طلب لك.'
          : 'The Novica and Wassel teams support you from application through your first order.',
      },
      {
        icon: ShoppingBag,
        title: isAr ? 'بلا تكلفة للتقديم' : 'Free to apply',
        desc: isAr
          ? 'التقديم للانضمام إلى المنصة مجاني بالكامل للحرفيين الفلسطينيين.'
          : 'Applying to join the platform is completely free for Palestinian artisans.',
      },
    ],

    stepsTitle: isAr ? 'كيف تنضم؟' : 'How to join',
    steps: [
      isAr ? 'عبّئ نموذج التقديم أدناه ببيانات حرفتك وأعمالك.' : 'Fill out the application below with details about your craft and work.',
      isAr ? 'يراجع فريق نوفيكا وواصل طلبك ويتواصلان معك.' : 'The Novica and Wassel team reviews your application and reaches out to you.',
      isAr ? 'بعد القبول، تبدأ بعرض منتجاتك أمام مشترين حول العالم.' : 'Once accepted, start showcasing your products to buyers around the world.',
    ],

    applyNow: isAr ? 'قدّم طلبك الآن' : 'Apply now',

    // Form
    formTitle: isAr ? 'نموذج التقديم' : 'Application form',
    formSubtitle: isAr ? 'هل أنت فنان أو حرفي فلسطيني؟ عبّئ البيانات التالية وسنتواصل معك.' : 'Are you a Palestinian artist or craftsperson? Fill in the details below and we\'ll reach out to you.',
    wizardSteps: [
      isAr ? 'المعلومات الشخصية' : 'Personal info',
      isAr ? 'بيانات الحرفة' : 'Craft details',
      isAr ? 'ملاحظات وإرسال' : 'Notes & submit',
    ],
    back: isAr ? 'رجوع' : 'Back',
    next: isAr ? 'التالي' : 'Next',
    labelFullName: isAr ? 'الاسم الكامل' : 'Full name',
    labelProjectName: isAr ? 'اسم المشروع / الورشة' : 'Project / workshop name',
    labelCity: isAr ? 'المحافظة / المدينة' : 'Governorate / City',
    labelMobile: isAr ? 'رقم الجوال / واتساب' : 'Mobile / WhatsApp number',
    labelEmail: isAr ? 'البريد الإلكتروني' : 'Email address',
    labelCraftType: isAr ? 'نوع الحرفة / المنتج' : 'Craft / product type',
    labelCraftTypeOther: isAr ? 'حدد نوع الحرفة' : 'Please specify',
    labelHasSamples: isAr ? 'هل تملك عينات جاهزة من منتجاتك؟' : 'Do you have ready samples of your products?',
    labelSellsOnline: isAr ? 'هل تبيع منتجاتك أونلاين؟' : 'Do you already sell your products online?',
    labelSellsOnlineWhere: isAr ? 'إذا كانت الإجابة نعم، أين؟' : 'If yes, where?',
    labelNotes: isAr ? 'ملاحظات إضافية' : 'Additional notes',
    optional: isAr ? '(اختياري)' : '(optional)',
    yes: isAr ? 'نعم' : 'Yes',
    no: isAr ? 'لا' : 'No',
    submit: isAr ? 'إرسال' : 'Submit',
    submitting: isAr ? 'جاري الإرسال...' : 'Submitting...',
    errRequired: isAr ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please fill in all required fields.',
    errEmail: isAr ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.',
    errGeneric: isAr ? 'تعذر إرسال طلبك. يرجى المحاولة مرة أخرى.' : 'Could not send your application. Please try again.',
    successTitle: isAr ? 'تم استلام طلبك بنجاح!' : 'Application received!',
    successBody: isAr
      ? 'شكراً لتقديمك للانضمام إلى نوفيكا فلسطين. سيتواصل معك فريقنا قريباً بخصوص الخطوات التالية.'
      : "Thank you for applying to Novica Palestine. Our team will be in touch soon about next steps.",
    needHelp: isAr ? 'تحتاج إلى مساعدة؟ تواصل معنا' : 'Need help? Chat with us',
  };

  const validateStep = (step: 1 | 2 | 3): string => {
    if (step === 1) {
      if (!form.fullName.trim() || !form.city.trim() || !form.mobile.trim() || !form.email.trim()) return t.errRequired;
      if (!EMAIL_RE.test(form.email.trim())) return t.errEmail;
    }
    if (step === 2) {
      if (!form.craftType || (form.craftType === 'other' && !form.craftTypeOther.trim())
        || !form.hasSamples || !form.sellsOnline) {
        return t.errRequired;
      }
    }
    return '';
  };

  const goNext = () => {
    const stepError = validateStep(wizardStep);
    if (stepError) { setError(stepError); return; }
    setError('');
    setWizardStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const goBack = () => {
    setError('');
    setWizardStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const validationError = validateStep(1) || validateStep(2);
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          projectName: form.projectName.trim() || undefined,
          city: form.city.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim(),
          craftType: form.craftType,
          craftTypeOther: form.craftType === 'other' ? form.craftTypeOther.trim() || undefined : undefined,
          hasSamples: form.hasSamples,
          sellsOnline: form.sellsOnline,
          sellsOnlineWhere: form.sellsOnline === 'yes' ? (form.sellsOnlineWhere.trim() || undefined) : undefined,
          notes: form.notes.trim() || undefined,
          language: lang,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSubmittedId(typeof data.id === 'number' ? data.id : 0);
    } catch {
      setError(t.errGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-wassel-yellow focus:border-wassel-yellow';
  const labelCls = 'block text-sm font-medium text-gray-700';

  const yesNoField = (key: 'hasSamples' | 'sellsOnline', label: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="mt-2 flex gap-3">
        {(['yes', 'no'] as const).map((v) => (
          <label
            key={v}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold cursor-pointer transition-colors ${
              form[key] === v ? 'border-wassel-blue bg-wassel-blue/5 text-wassel-blue' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name={key}
              value={v}
              checked={form[key] === v}
              onChange={() => set(key, v)}
              className="accent-wassel-blue"
            />
            {v === 'yes' ? t.yes : t.no}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* HERO */}
      <div
        className="relative bg-wassel-blue text-white overflow-hidden pt-36 md:pt-52 pb-24 bg-cover bg-center"
        style={{ backgroundImage: `url(${NOVICA_HERO_BG})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-wassel-blue/90 via-wassel-blue/70 to-wassel-blue/90" />
        <div className="absolute -right-16 rtl:-left-16 rtl:right-auto top-1/2 -translate-y-1/2 h-[420px] w-[420px] bg-wassel-yellow/10 blur-3xl rounded-full" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-4 rounded-2xl bg-white px-5 py-3 shadow-xl animate-slide-up">
            <img src={NOVICA_LOGO} alt="Novica" className="h-7 sm:h-8 w-auto" />
            <span className="h-7 sm:h-8 w-px bg-gray-200" />
            <img src={WASSEL_LOGO} alt="Wassel" className="h-6 sm:h-7 w-auto" />
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight animate-slide-up delay-100">
            <span className="text-wassel-yellow">{t.title}</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto animate-slide-up delay-200">
            {t.tagline}
          </p>
          <p className="mt-4 text-base text-blue-200 max-w-2xl mx-auto animate-slide-up delay-200">
            {t.intro}
          </p>
          <div className="mt-8 animate-slide-up delay-300">
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-lg bg-wassel-yellow px-6 py-3 text-base font-extrabold text-wassel-blue hover:bg-wassel-lightYellow transition-colors shadow-lg"
            >
              {t.applyNow}
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <section className="bg-[#FBF7F0]">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14 grid grid-cols-3">
          <StatItem to={165} suffix="+" label={t.statCountries} className="border-e border-gray-200" />
          <StatItem to={3} label={t.statSteps} className="border-e border-gray-200" />
          <StatItem to={100} suffix="%" label={t.statFree} />
        </div>
      </section>

      {/* ABOUT THE PARTNERSHIP */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <Reveal>
          <p className="text-gray-600 leading-relaxed text-base md:text-lg">{t.aboutP}</p>
        </Reveal>
      </section>

      {/* BENEFITS */}
      <section className="bg-wassel-blue text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl font-extrabold">{t.benefitsTitle}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.benefits.map((b, i) => (
              <Reveal key={b.title} delayMs={i * 80}>
                <div className="group h-full rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10 hover:border-wassel-yellow/40 hover:shadow-xl">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-wassel-yellow/15 text-wassel-yellow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <b.icon className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-lg">{b.title}</h3>
                  <p className="text-sm text-blue-100 leading-snug">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ARTISAN SPOTLIGHT */}
      <section className="bg-[#FBF7F0]">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <Reveal className="order-2 md:order-1">
            <Quote className="w-10 h-10 text-wassel-yellow mb-4" fill="currentColor" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-wassel-blue leading-snug">{t.spotlightQuote}</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">{t.spotlightBody}</p>
          </Reveal>
          <Reveal delayMs={100} className="order-1 md:order-2">
            <img
              src={NOVICA_BG}
              alt={isAr ? 'حرفية فلسطينية تعمل على قطعة تطريز' : 'A Palestinian artisan working on an embroidery piece'}
              className="w-full aspect-square object-cover object-top rounded-3xl shadow-xl"
            />
          </Reveal>
        </div>
      </section>

      {/* HOW TO JOIN */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <Reveal>
          <h2 className="text-3xl font-extrabold text-wassel-blue mb-2">{t.stepsTitle}</h2>
          <div className="h-1 w-16 bg-wassel-yellow rounded mb-8" />
        </Reveal>
        <ol className="space-y-4">
          {t.steps.map((s, i) => (
            <RevealListItem
              key={s}
              delayMs={i * 100}
              onClick={scrollToForm}
              className="group flex items-start gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-wassel-yellow hover:shadow-md hover:bg-wassel-yellow/5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-wassel-blue text-wassel-yellow font-extrabold text-sm transition-transform duration-300 group-hover:scale-110">
                {i + 1}
              </span>
              <p className="text-gray-700 leading-relaxed pt-0.5">{s}</p>
            </RevealListItem>
          ))}
        </ol>
      </section>

      {/* APPLICATION FORM */}
      <section ref={formRef} className="bg-[#F6F8FB] border-t border-gray-100 scroll-mt-24">
        <div className="relative max-w-2xl mx-auto px-4 py-16 md:py-20">
          <div className="absolute -top-6 -right-10 rtl:-left-10 rtl:right-auto h-64 w-64 bg-wassel-yellow/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 rtl:-right-10 rtl:left-auto h-64 w-64 bg-wassel-blue/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 rounded-3xl border border-wassel-yellow/30 bg-white shadow-2xl shadow-wassel-blue/10 overflow-hidden">
            <div className="bg-gradient-to-r from-wassel-blue to-wassel-darkBlue px-6 py-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-wassel-yellow shrink-0" />
              <h2 className="text-3xl font-extrabold text-white">{t.formTitle}</h2>
            </div>
            <div className="h-1.5 bg-wassel-yellow" />

            <div className="p-6 sm:p-8">
              {submittedId !== null ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-extrabold text-wassel-blue mb-2">{t.successTitle}</h3>
                  <p className="text-gray-600 max-w-md mx-auto">{t.successBody}</p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && wizardStep < 3 && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault();
                  }}
                  className="space-y-5"
                  noValidate
                >
                  <p className="text-sm text-gray-500 -mt-1 mb-2">{t.formSubtitle}</p>

                  {/* STEPPER */}
                  <div>
                    <div className="flex items-center">
                      {t.wizardSteps.map((_, i) => {
                        const num = (i + 1) as 1 | 2 | 3;
                        const isLast = i === t.wizardSteps.length - 1;
                        const isDone = wizardStep > num;
                        const isActive = wizardStep === num;
                        return (
                          <React.Fragment key={num}>
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-bold text-sm transition-all ${
                                isDone
                                  ? 'bg-wassel-blue border-wassel-blue text-white'
                                  : isActive
                                  ? 'border-wassel-yellow bg-wassel-yellow text-wassel-blue shadow-md shadow-wassel-yellow/40 ring-4 ring-wassel-yellow/20 scale-110'
                                  : 'border-gray-300 text-gray-400'
                              }`}
                            >
                              {isDone ? <Check className="w-4 h-4" /> : num}
                            </span>
                            {!isLast && (
                              <div className={`flex-1 h-0.5 mx-1.5 rounded transition-colors ${wizardStep > num ? 'bg-wassel-blue' : 'bg-gray-200'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-wassel-blue">
                      {isAr ? `الخطوة ${wizardStep} من 3: ` : `Step ${wizardStep} of 3: `}
                      {t.wizardSteps[wizardStep - 1]}
                    </p>
                  </div>

                  {wizardStep === 1 && (
                    <>
                      <div>
                        <label className={labelCls}>{t.labelFullName}</label>
                        <input type="text" required className={inputCls} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelCls}>{t.labelProjectName} <span className="text-gray-400 font-normal">{t.optional}</span></label>
                        <input type="text" className={inputCls} value={form.projectName} onChange={(e) => set('projectName', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelCls}>{t.labelCity}</label>
                        <input type="text" required className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelCls}>{t.labelMobile}</label>
                        <input type="tel" dir="ltr" required className={inputCls} value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
                      </div>

                      <div>
                        <label className={labelCls}>{t.labelEmail}</label>
                        <input type="email" dir="ltr" required className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
                      </div>
                    </>
                  )}

                  {wizardStep === 2 && (
                    <>
                      <div>
                        <label className={labelCls}>{t.labelCraftType}</label>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {CRAFT_TYPES.map((c) => (
                            <label
                              key={c.value}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                                form.craftType === c.value ? 'border-wassel-blue bg-wassel-blue/5 text-wassel-blue font-semibold' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="craftType"
                                value={c.value}
                                checked={form.craftType === c.value}
                                onChange={() => set('craftType', c.value)}
                                className="accent-wassel-blue"
                              />
                              {isAr ? c.ar : c.en}
                            </label>
                          ))}
                        </div>
                        {form.craftType === 'other' && (
                          <input
                            type="text"
                            className={`${inputCls} mt-2`}
                            placeholder={t.labelCraftTypeOther}
                            value={form.craftTypeOther}
                            onChange={(e) => set('craftTypeOther', e.target.value)}
                          />
                        )}
                      </div>

                      {yesNoField('hasSamples', t.labelHasSamples)}
                      {yesNoField('sellsOnline', t.labelSellsOnline)}

                      {form.sellsOnline === 'yes' && (
                        <div>
                          <label className={labelCls}>{t.labelSellsOnlineWhere}</label>
                          <input type="text" className={inputCls} value={form.sellsOnlineWhere} onChange={(e) => set('sellsOnlineWhere', e.target.value)} />
                        </div>
                      )}
                    </>
                  )}

                  {wizardStep === 3 && (
                    <div>
                      <label className={labelCls}>{t.labelNotes} <span className="text-gray-400 font-normal">{t.optional}</span></label>
                      <textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    {wizardStep > 1 && (
                      <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        {t.back}
                      </button>
                    )}
                    {wizardStep < 3 ? (
                      <button
                        key="next-btn"
                        type="button"
                        onClick={goNext}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-wassel-yellow px-6 py-3 text-base font-extrabold text-wassel-blue hover:bg-wassel-lightYellow transition-colors shadow-lg shadow-wassel-yellow/30"
                      >
                        {t.next}
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </button>
                    ) : (
                      <button
                        key="submit-btn"
                        type="submit"
                        disabled={submitting}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-wassel-yellow px-6 py-3 text-base font-extrabold text-wassel-blue hover:bg-wassel-lightYellow transition-colors shadow-lg shadow-wassel-yellow/30 disabled:opacity-60"
                      >
                        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        {submitting ? t.submitting : t.submit}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <CopilotToggle size={38} label={isAr ? 'محادثة' : 'Chat'} onClick={() => onAction?.('chat')} />
            <button
              type="button"
              onClick={() => onAction?.('chat')}
              className="mt-2 block mx-auto text-sm font-semibold text-gray-600 hover:text-wassel-blue transition-colors"
            >
              {t.needHelp}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
