import React from 'react';
import { ArrowRight, FileText, CreditCard, Truck, FileSignature, Banknote, Package, Ship, Plane, Globe, Zap, ShoppingCart, Warehouse, ClipboardList, Boxes, Snowflake, Mail, Bus, Plug, Calculator, Landmark, Wand2, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { AnimatedServiceIcon, AnimatedIconType } from '../icons/AnimatedServiceIcon';

interface StickyServicesProps {
  lang: Language;
  onNavigate: (view: string) => void;
}

interface SubService {
  icon: React.ElementType;
  label: { en: string; ar: string };
  action?: string;
}

interface MajorService {
  key: string;
  title: string;
  tagline: string;
  desc: string;
  image: string;
  accent: string;
  accentBg: string;
  accentHover: string;
  cta: string;
  action: string;
  anim: AnimatedIconType;
  subServices?: SubService[];
}

export const StickyServices: React.FC<StickyServicesProps> = ({ lang, onNavigate }) => {
  const t = {
    eyebrow: lang === 'en' ? 'Our Services' : 'خدماتنا',
    title: lang === 'en' ? 'Comprehensive logistics solutions designed for you.' : 'حلول لوجستية شاملة مصممة خصيصاً لك.',
  };

  const placeholderEn = 'Placeholder description. Replace this text with the final copy provided by the client.';
  const placeholderAr = 'نص مؤقت. سيتم استبداله بالنص النهائي الذي يزودنا به العميل.';

  const services: MajorService[] = [
    {
      key: 'domestic',
      title: lang === 'en' ? 'Domestic Services' : 'الخدمات المحلية',
      tagline: lang === 'en' ? 'Door-to-door, next-day across Palestine.' : 'من الباب إلى الباب، في اليوم التالي عبر فلسطين.',
      desc: lang === 'en' ? placeholderEn : placeholderAr,
      image: `${import.meta.env.BASE_URL}assets/DomSer.png`,
      accent: 'text-wassel-blue',
      accentBg: 'bg-wassel-blue',
      accentHover: 'hover:bg-wassel-darkBlue',
      cta: lang === 'en' ? 'Explore Domestic' : 'استكشف المحلي',
      action: 'rates-domestic',
      anim: 'truck',
      subServices: [
        { icon: FileText,      label: { en: 'Jordanian Passport',   ar: 'خدمة الجوازات الأردنية' }, action: 'service-jordanian' },
        { icon: CreditCard,    label: { en: 'Intl. Driving Permit', ar: 'الرخصة الدولية' },           action: 'idp-flow' },
        { icon: Truck,         label: { en: 'Domestic Delivery',    ar: 'التوصيل المحلي' },          action: 'pickup' },
        { icon: FileSignature, label: { en: 'Document Signing',     ar: 'توقيع المستندات' },        action: 'service-corp-signing' },
        { icon: Banknote,      label: { en: 'Cash Collection',      ar: 'التحصيل النقدي' },           action: 'service-corp-distribution' },
        { icon: Package,       label: { en: 'Packing & Wrapping',   ar: 'التغليف والتعبئة' },         action: 'service-corp-packing' },
        { icon: Landmark,      label: { en: 'Embassy Delivery',     ar: 'النقل إلى السفارات' },       action: 'contact' },
      ],
    },
    {
      key: 'international',
      title: lang === 'en' ? 'International Services' : 'الخدمات الدولية',
      tagline: lang === 'en' ? 'Global reach via FedEx & DHL partnerships.' : 'وصول عالمي عبر شراكاتنا مع FedEx و DHL.',
      desc: lang === 'en' ? placeholderEn : placeholderAr,
      image: `${import.meta.env.BASE_URL}assets/airplane.png`,
      accent: 'text-yellow-500',
      accentBg: 'bg-yellow-500',
      accentHover: 'hover:bg-yellow-600',
      cta: lang === 'en' ? 'Explore International' : 'استكشف الدولي',
      action: 'rates-international',
      anim: 'plane',
      subServices: [
        { icon: Ship,         label: { en: 'Sea Freight',      ar: 'الشحن البحري' },     action: 'service-corp-freight' },
        { icon: Plane,        label: { en: 'Air Freight',      ar: 'الشحن الجوي' },      action: 'service-express' },
        { icon: Truck,        label: { en: 'Land Freight',     ar: 'الشحن البري' },      action: 'service-corp-freight' },
        { icon: Zap,          label: { en: 'Express Shipping', ar: 'الشحن السريع' },     action: 'rates-international' },
        { icon: Globe,        label: { en: 'Customs Clearance',ar: 'التخليص الجمركي' }, action: 'service-clearance' },
        { icon: ShoppingCart, label: { en: 'Online Shopping',  ar: 'التسوق الإلكتروني' },action: 'service-shop' },
        { icon: Sparkles,     label: { en: 'Novika',           ar: 'نوفيكا' },               action: 'service-shop' },
      ],
    },
    {
      key: 'logistics',
      title: lang === 'en' ? 'Logistics Service' : 'الخدمات اللوجستية',
      tagline: lang === 'en' ? 'Warehousing, freight, and supply chain.' : 'التخزين والشحن وإدارة سلسلة التوريد.',
      desc: lang === 'en' ? placeholderEn : placeholderAr,
      image: `${import.meta.env.BASE_URL}assets/warehouse.png`,
      accent: 'text-orange-600',
      accentBg: 'bg-orange-600',
      accentHover: 'hover:bg-orange-700',
      cta: lang === 'en' ? 'Explore Logistics' : 'استكشف اللوجستيات',
      action: 'service-corp-freight',
      anim: 'container',
      subServices: [
        { icon: Warehouse,     label: { en: 'Warehousing',           ar: 'التخزين' },           action: 'service-corp-storage' },
        { icon: ClipboardList, label: { en: 'Inventory Management',  ar: 'إدارة المخزون' },     action: 'service-corp-warehouse' },
        { icon: Boxes,         label: { en: 'Bulk Distribution',     ar: 'التوزيع بالجملة' },    action: 'service-corp-distribution' },
        { icon: Snowflake,     label: { en: 'Cold Storage',          ar: 'التخزين المبرد' },     action: 'service-corp-storage' },
        { icon: Mail,          label: { en: 'Daily Mail',            ar: 'البريد اليومي' },        action: 'service-corp-mail' },
      ],
    },
    {
      key: 'technology',
      title: lang === 'en' ? 'Wassel Technology' : 'واصل للتكنولوجيا',
      tagline: lang === 'en' ? 'Smart platforms powering modern logistics.' : 'منصات ذكية تدعم اللوجستيات الحديثة.',
      desc: lang === 'en' ? placeholderEn : placeholderAr,
      image: `${import.meta.env.BASE_URL}assets/corporate-bg.jpg`,
      accent: 'text-emerald-600',
      accentBg: 'bg-emerald-600',
      accentHover: 'hover:bg-emerald-700',
      cta: lang === 'en' ? 'Discover Technology' : 'اكتشف التكنولوجيا',
      action: 'services',
      anim: 'globe',
      subServices: [
        { icon: Bus,        label: { en: 'Corporate Transport System', ar: 'نظام النقل الداخلي للشركات' }, action: 'services' },
        { icon: Plug,       label: { en: 'E-commerce Integration',     ar: 'واجهة الربط مع المتاجر الإلكترونية' }, action: 'services' },
        { icon: Calculator, label: { en: 'Rate Calculator',            ar: 'حاسبة الأسعار' }, action: 'rates-international' },
        { icon: Wand2,      label: { en: 'Request Your Own System',    ar: 'اطلب نظامك الخاص' }, action: 'contact' },
      ],
    },
  ];

  return (
    <div className="bg-gray-50 py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-wassel-blue skew-y-3 origin-top-left transform -translate-y-24 z-0"></div>

      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">

        <div className="max-w-5xl mx-auto text-center mb-20 px-4">
          <h2 className="text-lg font-bold text-wassel-yellow uppercase tracking-wider mb-2 animate-slide-up">
            {t.eyebrow}
          </h2>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white animate-slide-up delay-100">
            {t.title}
          </p>
        </div>

        <div className="w-full flex flex-col gap-12">
          {services.map((service, index) => {
            const reverse = index % 2 === 1;
            return (
              <div
                key={service.key}
                className={`group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border-y border-gray-100 flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} overflow-hidden animate-slide-up w-full`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative lg:w-1/2 h-80 lg:h-[480px] overflow-hidden shrink-0 bg-gray-100">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      if (e.currentTarget.dataset.fallbackApplied === 'true') {
                        e.currentTarget.style.display = 'none';
                        return;
                      }
                      e.currentTarget.dataset.fallbackApplied = 'true';
                      e.currentTarget.src = `${import.meta.env.BASE_URL}assets/corporate-bg.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  <div className="absolute top-8 left-8 rtl:left-auto rtl:right-8 bg-white/90 backdrop-blur px-4 py-2 text-sm font-bold tracking-widest text-gray-700">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                <div className="lg:w-1/2 p-10 sm:p-14 lg:p-16 flex flex-col justify-center">
                  <div className={`mb-8 inline-flex w-20 h-20 items-center justify-center bg-gray-50 ring-1 ring-gray-100 ${service.accent}`}>
                    <AnimatedServiceIcon type={service.anim} className="w-12 h-12" />
                  </div>

                  <h3 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                    {service.title}
                  </h3>
                  <p className={`text-base font-bold uppercase tracking-wider mb-6 ${service.accent}`}>
                    {service.tagline}
                  </p>
                  <p className="text-lg lg:text-xl text-gray-600 leading-relaxed mb-10">
                    {service.desc}
                  </p>

                  {service.subServices && service.subServices.length > 0 && (
                    <div className="mb-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {service.subServices.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.label.en}
                            onClick={() => sub.action && onNavigate(sub.action)}
                            className={`flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-left rtl:text-right transition-colors ${service.accent}`}
                          >
                            <SubIcon className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700 truncate">
                              {lang === 'en' ? sub.label.en : sub.label.ar}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <button
                      onClick={() => onNavigate(service.action)}
                      className={`inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-white shadow-md transition-colors ${service.accentBg} ${service.accentHover}`}
                    >
                      {service.cta}
                      <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
