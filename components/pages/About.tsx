import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import {
  Truck, Globe, Landmark, Package, ChevronDown, MapPin, Phone,
  CalendarClock, Wallet, PenLine, FileCheck, Ship, Plane, Route, ClipboardCheck,
  ArrowRight, Building2, Boxes, Stethoscope, IdCard, Mail,
} from 'lucide-react';

interface AboutProps {
  lang: Language;
  onAction?: (action: string) => void;
}

/** Counts from 0 → `to` once the element scrolls into view. */
const useCountUp = (to: number, durationMs = 1600) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || done.current) return;
      done.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, durationMs]);

  return { value, ref };
};

const Stat: React.FC<{ to: number; suffix: string; label: string }> = ({ to, suffix, label }) => {
  const { value, ref } = useCountUp(to);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-extrabold text-wassel-blue tabular-nums">
        {value}
        <span>{suffix}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">{label}</p>
    </div>
  );
};

export const About: React.FC<AboutProps> = ({ lang, onAction }) => {
  const isAr = lang === 'ar';
  const [activeCat, setActiveCat] = useState<'domestic' | 'international' | 'government' | 'other'>('domestic');
  const [openOffice, setOpenOffice] = useState<number | null>(0);

  const t = {
    heroKicker: isAr ? 'نصل فلسطين' : 'Connecting',
    heroTitle: isAr ? 'مع العالم' : 'Palestine with the World',
    heroTagline: isAr
      ? 'منذ انطلاقنا في العام 2005، نقدم لزبائننا حلولاً ذكية لخدمات التوصيل السريع.'
      : 'Delivering a smarter courier experience since 2005.',

    aboutTitle: isAr ? 'من نحن' : 'About Us',
    aboutP1: isAr
      ? 'نقدم باقة شاملة من الخدمات اللوجستية التي تشمل النقل والشحن المحلي والدولي، خدمات البريد العادي والسريع، التخليص الجمركي، وحلول التخزين الذكية.'
      : 'We provide a comprehensive suite of logistics services, including local and international transport and shipping, regular and express mail services, customs clearance, and smart warehousing solutions.',
    aboutP2: isAr
      ? 'تتمثل مهمة واصل في أن تكون شركة التوصيل الأسرع نمواً والأكثر تميزاً في الخدمات اللوجستية على مستوى فلسطين، عبر تقديمها خدمات موثوقة وفعالة وحلولاً أكثر مرونة — بفضل تنوع خبراتنا والتزامنا الدائم بتقديم أفضل الخدمات لزبائننا يوماً بعد يوم.'
      : "At WASSEL, we're on a mission to be the courier company that goes beyond distance and destination to offer business transformation, reliable global services, and flexible, agile solutions — thanks to industry-leading expertise and an unwavering commitment to a greater customer experience, day after day.",
    aboutP3: isAr
      ? 'نؤمن أن موظفينا هم قلب نجاحنا. ففرق عملنا المتخصصة، مدعومة بالتقنيات الذكية وأسطول شحن متنوع ومجهّز، تعمل بتعاون وثيق لتقديم خدمات مبتكرة وفعالة تلبي احتياجات زبائننا على المستويات الدولية والمحلية والحكومية.'
      : 'We believe our employees are the heart of our success. Our specialized teams, supported by advanced smart technologies and a well-equipped, diverse fleet, work closely together to deliver innovative and efficient services across international, local, and governmental levels.',

    visionTitle: isAr ? 'رؤيتنا' : 'Our Vision',
    vision: isAr
      ? 'لن نكتفي بما أنجزناه، فآفاقنا أوسع، وطموحنا يدفعنا لنواصل العمل بإصرار نحو مستقبل ذكي ومترابط.'
      : "We won't settle for what we've achieved; our horizons are broader, and our ambition drives us to persistently work toward a smart, connected future.",

    servicesTitle: isAr ? 'خدماتنا' : 'Our Services',
    servicesHint: isAr ? 'اختر فئة لعرض تفاصيلها' : 'Pick a category to see what it covers',

    officesTitle: isAr ? 'مكاتبنا' : 'Our Offices',

    ctaTitle: isAr ? 'جاهز للبدء؟' : 'Ready to get started?',
    ctaTrack: isAr ? 'تتبّع شحنة' : 'Track a shipment',
    ctaRates: isAr ? 'احصل على سعر' : 'Get a rate',
    ctaContact: isAr ? 'تواصل معنا' : 'Contact us',
  };

  const stats = [
    { to: 20, suffix: '', label: isAr ? 'عاماً في مجال التوصيل السريع' : 'Years in business' },
    { to: 40, suffix: 'M+', label: isAr ? 'شحنة تم توصيلها منذ 2005' : 'Shipments delivered since 2005' },
    { to: 200, suffix: '+', label: isAr ? 'دولة حول العالم' : 'Countries covered' },
    { to: 500, suffix: '+', label: isAr ? 'وجهة عالمية' : 'Worldwide destinations' },
  ];

  const categories = [
    { id: 'domestic' as const, icon: Truck, label: isAr ? 'الخدمات المحلية' : 'Domestic' },
    { id: 'international' as const, icon: Globe, label: isAr ? 'الخدمات الدولية' : 'International' },
    { id: 'government' as const, icon: Landmark, label: isAr ? 'الخدمات الحكومية' : 'Government' },
    { id: 'other' as const, icon: Package, label: isAr ? 'خدمات أخرى' : 'Other' },
  ];

  const serviceContent: Record<typeof activeCat, { blurb: string; items: { icon: React.ElementType; label: string }[] }> = {
    domestic: {
      blurb: isAr
        ? 'خدمة سلسة من الحجز والاستلام حتى التسليم النهائي، مع تتبّع كامل لجميع الشحنات، وخبرة في خدمة قطاعات الاتصالات والشركات الكبيرة والصغيرة والمؤسسات الحكومية والمصرفية.'
        : 'A seamless service from booking and pickup to final delivery, with full tracking of all shipments — serving telecom, enterprise, SMEs, government, banking and private sectors.',
      items: [
        { icon: CalendarClock, label: isAr ? 'التوصيل في اليوم التالي' : 'Standard next-day delivery' },
        { icon: Wallet, label: isAr ? 'الدفع عند الاستلام' : 'Cash on delivery' },
        { icon: PenLine, label: isAr ? 'توقيع الوثائق والمستندات وإرجاعها' : 'Signature & document return' },
        { icon: FileCheck, label: isAr ? 'استلام وتسليم الشيكات' : 'Cheque collection & delivery' },
      ],
    },
    international: {
      blurb: isAr
        ? 'عمليات استيراد وتصدير تغطي أكثر من 200 وجهة حول العالم، مع توصيل الطرود والوثائق المستعجلة خلال 72 ساعة كحد أقصى من لحظة الاستلام.'
        : 'Import and export operations covering 200+ destinations worldwide, delivering urgent documents and packages within 72 hours of pickup.',
      items: [
        { icon: Package, label: isAr ? 'خدمة الاستيراد' : 'Imports' },
        { icon: ArrowRight, label: isAr ? 'خدمة التصدير' : 'Exports' },
        { icon: Ship, label: isAr ? 'الشحن البحري' : 'Sea freight' },
        { icon: Route, label: isAr ? 'الشحن البري' : 'Land freight' },
        { icon: Plane, label: isAr ? 'الشحن الجوي' : 'Air freight' },
        { icon: ClipboardCheck, label: isAr ? 'التخليص الجمركي' : 'Customs clearance' },
      ],
    },
    government: {
      blurb: isAr
        ? 'خدمات توصيل سريع لمختلف القطاعات الحكومية، مع معالجة متخصصة للمستندات والوثائق السرّية والشهادات محلياً ودولياً.'
        : 'Courier services for government sectors, with specialized handling of sensitive and confidential documents, licenses and certificates — domestically and internationally.',
      items: [
        { icon: Mail, label: isAr ? 'الوثائق والطرود الدولية للبريد الفلسطيني' : 'International documents & parcels for Palestinian Post' },
        { icon: FileCheck, label: isAr ? 'طلبات عدم الممانعة للأردن — غزة والمغتربون' : 'No-objection requests via the Jordanian Embassy — Gaza & expatriates' },
        { icon: FileCheck, label: isAr ? 'استلام وإعادة تسليم وثائق القنصلية الأمريكية' : 'Collection & return delivery — U.S. Consulate documents' },
        { icon: FileCheck, label: isAr ? 'استلام وإعادة تسليم الوثائق الأردنية — القدس' : 'Collection & return delivery — Jordanian documents, Jerusalem' },
      ],
    },
    other: {
      blurb: isAr
        ? 'حلول إضافية تكمّل خدماتنا اللوجستية الأساسية للشركات والأفراد.'
        : 'Additional solutions that complement our core logistics services for businesses and individuals.',
      items: [
        { icon: Building2, label: isAr ? 'توزيع فواتير الشركات والدعوات والإخطارات' : 'Distribution of corporate invoices, invitations & notifications' },
        { icon: Boxes, label: isAr ? 'التخزين الداخلي والخارجي' : 'On-site & off-site warehousing' },
        { icon: Package, label: isAr ? 'تجهيز وتغليف وتوزيع الهدايا الموسمية' : 'Seasonal gifts fulfillment & distribution' },
        { icon: Stethoscope, label: isAr ? 'العينات الطبية' : 'Medical samples' },
        { icon: IdCard, label: isAr ? 'إصدار الرخصة الدولية' : 'International driving licence issuance' },
      ],
    },
  };

  const offices = [
    {
      name: isAr ? 'رام الله — الإدارة العامة' : 'Ramallah — Headquarters',
      address: isAr
        ? 'شارع إدوارد سعيد، عمارة القلعة – الطابق الأول، مقابل دوار المجلس التشريعي'
        : 'Edward Said Street, Castle Building — First Floor, across from the Legislative Council Roundabout',
      phones: ['1700-974-444', '02-241-5161', '+972 59-477-5000'],
    },
    {
      name: isAr ? 'الخليل' : 'Hebron',
      address: isAr
        ? 'دوار ابن رشد – بجانب الغرفة التجارية الجديدة، مقابل طلعة المقاطعة، عمارة الجذور'
        : 'Ibn Rushd Roundabout — next to the new Chamber of Commerce, opposite the Mukataa, Al-Juthour Building',
      phones: [],
    },
    {
      name: isAr ? 'القدس' : 'Jerusalem',
      address: isAr ? 'شعفاط، شارع شعفاط 45، أبراج القدس 1' : "Shu'fat, Shu'fat Street 45, Jerusalem Towers 1",
      phones: ['02-627-1792'],
    },
    {
      name: isAr ? 'نابلس' : 'Nablus',
      address: isAr ? 'رفيديا، مقابل منتزه العائلات، عمارة عماشة' : "Rafidia, across Ala'elat Park, Amasha Building",
      phones: [],
    },
  ];

  const active = serviceContent[activeCat];

  return (
    <div className="bg-white min-h-screen">
      {/* HERO */}
      <div className="relative bg-wassel-blue text-white overflow-hidden pt-36 md:pt-52 pb-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -right-16 rtl:-left-16 rtl:right-auto top-1/2 -translate-y-1/2 h-[420px] w-[420px] bg-wassel-yellow/10 blur-3xl rounded-full" />
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <p className="text-lg md:text-xl text-blue-200 animate-slide-up">{t.heroKicker}</p>
          <h1 className="mt-2 text-4xl md:text-6xl font-extrabold tracking-tight animate-slide-up delay-100">
            <span className="text-wassel-yellow">{t.heroTitle}</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-blue-100 max-w-2xl mx-auto animate-slide-up delay-200">
            {t.heroTagline}
          </p>
        </div>
      </div>

      {/* ABOUT */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-extrabold text-wassel-blue mb-2">{t.aboutTitle}</h2>
        <div className="h-1 w-16 bg-wassel-yellow rounded mb-8" />
        <div className="space-y-5 text-gray-600 leading-relaxed text-base md:text-lg">
          <p>{t.aboutP1}</p>
          <p>{t.aboutP2}</p>
          <p>{t.aboutP3}</p>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#F6F8FB] border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <Stat key={s.label} to={s.to} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* VISION */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-wassel-yellow">{t.visionTitle}</h2>
        <p className="mt-4 text-2xl md:text-3xl font-bold text-wassel-blue leading-snug">{t.vision}</p>
      </section>

      {/* SERVICES — interactive tabs */}
      <section className="bg-wassel-blue text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold">{t.servicesTitle}</h2>
            <p className="text-blue-200 text-sm mt-2">{t.servicesHint}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((c) => {
              const on = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    on ? 'bg-wassel-yellow text-wassel-blue' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <c.icon className="w-4 h-4" />
                  {c.label}
                </button>
              );
            })}
          </div>

          <div key={activeCat} className="animate-enter max-w-3xl mx-auto">
            <p className="text-blue-100 text-center mb-8">{active.blurb}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {active.items.map((it) => (
                <div key={it.label} className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-wassel-yellow/15 text-wassel-yellow">
                    <it.icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium leading-snug">{it.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OFFICES — accordion */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-extrabold text-wassel-blue mb-2">{t.officesTitle}</h2>
        <div className="h-1 w-16 bg-wassel-yellow rounded mb-8" />
        <div className="rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {offices.map((o, i) => {
            const open = openOffice === i;
            return (
              <div key={o.name}>
                <button
                  onClick={() => setOpenOffice(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-start hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3 font-bold text-wassel-blue">
                    <MapPin className="w-4 h-4 text-wassel-yellow shrink-0" />
                    {o.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 pt-0 text-sm text-gray-600 space-y-2">
                      <p>{o.address}</p>
                      {o.phones.map((p) => (
                        <a key={p} href={`tel:${p.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-wassel-blue hover:underline w-fit" dir="ltr">
                          <Phone className="w-3.5 h-3.5" />
                          {p}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F6F8FB] border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-extrabold text-wassel-blue">{t.ctaTitle}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onAction?.('tracking')}
              className="inline-flex items-center gap-2 rounded-lg bg-wassel-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-wassel-darkBlue transition-colors"
            >
              <Package className="w-4 h-4" />{t.ctaTrack}
            </button>
            <button
              onClick={() => onAction?.('rates')}
              className="inline-flex items-center gap-2 rounded-lg border border-wassel-blue px-5 py-2.5 text-sm font-bold text-wassel-blue hover:bg-wassel-blue/5 transition-colors"
            >
              <Globe className="w-4 h-4" />{t.ctaRates}
            </button>
            <a
              href={`/${lang}/contact`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-4 h-4" />{t.ctaContact}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
