import { Language, PageView } from '../types';
import type { SeoProps } from '../components/Seo';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://wassel.ps').replace(/\/+$/, '');

// ── Organization facts for structured data ──────────────────────────────────
// Fill these with the real values so Google can attach them to the brand /
// knowledge panel. Empty entries are simply left out of the JSON-LD.
const ORG_SAME_AS: string[] = [
  'https://www.facebook.com/WasselLogistics',
  'https://www.instagram.com/wassel.logistics',
  'https://www.linkedin.com/company/wassel-logistics',
];
const ORG_ADDRESS = {
  streetAddress: 'Al Masyoun, Edward Said St., opposite the Legislative Council roundabout, Al-Qalaa Building',
  addressLocality: 'Ramallah',
  addressRegion: 'West Bank',
  addressCountry: 'PS',
};
const ORG_PHONE = '1700974444';

// The four service pillars we want Wassel to surface for. Bilingual so the
// Arabic catalogue matches Arabic queries ("شحن", "تخزين", "تخليص جمركي",
// "خدمات الجوازات الأردنية").
const SERVICE_PILLARS: Array<{ en: string; ar: string; path: string }> = [
  { en: 'Domestic & International Shipping', ar: 'الشحن المحلي والدولي', path: '/rates' },
  { en: 'Warehousing & 3PL Services', ar: 'التخزين والخدمات اللوجستية (3PL)', path: '/resources' },
  { en: 'Customs Clearance', ar: 'التخليص الجمركي', path: '/resources' },
  { en: 'Jordanian Passport Delivery', ar: 'خدمة توصيل الجوازات الأردنية', path: '/resources' },
];

type Meta = { title: string; description: string; path: string; noindex?: boolean };

const PAGES: Record<Language, Partial<Record<PageView, Meta>>> = {
  en: {
    home: {
      path: '/',
      title: 'Wassel Logistics — Shipping, Warehousing & Customs Clearance in Palestine',
      description:
        'Wassel Logistics in Palestine: domestic & international shipping, warehousing & 3PL, customs clearance, and Jordanian passport delivery. Track shipments and get instant rates.',
    },
    tracking: {
      path: '/tracking',
      title: 'Track Your Shipment',
      description:
        'Enter your Wassel, DHL, FedEx or Jordanian passport tracking number to see your shipment status and location in real time.',
    },
    rates: {
      path: '/rates',
      title: 'Shipping Rate Calculator',
      description:
        'Compare domestic and international shipping rates from Wassel, DHL and FedEx. Get an instant quote for your parcel or document.',
    },
    pickup: {
      path: '/pickup',
      title: 'Schedule a Pickup',
      description: 'Book a courier pickup from your home or business anywhere in Palestine with Wassel.',
    },
    contact: {
      path: '/contact',
      title: 'Contact Us',
      description:
        'Get in touch with Wassel customer service. Find our branch addresses, working hours, phone and WhatsApp, or send us a message.',
    },
    resources: {
      path: '/resources',
      title: 'Help Center & Resources',
      description:
        'Answers, guides and downloadable forms for shipping, tracking, billing, claims and Jordanian passport services with Wassel.',
    },
    about: {
      path: '/about',
      title: 'About Us',
      description:
        'Since 2005, Wassel has connected Palestine with the world — domestic and international shipping, customs clearance, warehousing and government services, delivered by specialized teams and a modern fleet.',
    },
    login: { path: '/login', title: 'Portal Login', description: 'Wassel staff portal login.', noindex: true },
  },
  ar: {
    home: {
      path: '/',
      title: 'شركة واصل لوجستيك — الشحن والتخزين والتخليص الجمركي في فلسطين',
      description:
        'شركة واصل لوجستيك في فلسطين: الشحن المحلي والدولي، التخزين والخدمات اللوجستية (3PL)، التخليص الجمركي، وخدمة توصيل الجوازات الأردنية. تتبّع شحنتك واحصل على سعر فوري.',
    },
    tracking: {
      path: '/tracking',
      title: 'تتبّع شحنتك',
      description:
        'أدخل رقم تتبع واصل أو DHL أو FedEx أو جواز السفر الأردني لمعرفة حالة شحنتك وموقعها لحظياً.',
    },
    rates: {
      path: '/rates',
      title: 'حاسبة أسعار الشحن',
      description:
        'قارن أسعار الشحن المحلي والدولي من واصل و DHL و FedEx واحصل على عرض سعر فوري لطردك أو مستنداتك.',
    },
    pickup: {
      path: '/pickup',
      title: 'جدولة استلام',
      description: 'اطلب استلام شحنتك من منزلك أو عملك في أي مكان في فلسطين مع واصل.',
    },
    contact: {
      path: '/contact',
      title: 'تواصل معنا',
      description:
        'تواصل مع خدمة عملاء واصل. عناوين الفروع وساعات العمل والهاتف والواتساب، أو أرسل لنا رسالة.',
    },
    resources: {
      path: '/resources',
      title: 'مركز المساعدة والموارد',
      description:
        'إجابات وأدلة ونماذج قابلة للتحميل حول الشحن والتتبع والفواتير والمطالبات وخدمات الجوازات الأردنية مع واصل.',
    },
    about: {
      path: '/about',
      title: 'من نحن',
      description:
        'منذ العام 2005 وواصل تصل فلسطين بالعالم عبر الشحن المحلي والدولي، التخليص الجمركي، التخزين والخدمات الحكومية، بفرق عمل متخصصة وأسطول حديث.',
    },
    login: { path: '/login', title: 'تسجيل الدخول', description: 'تسجيل دخول بوابة موظفي واصل.', noindex: true },
  },
};

// Anything not listed (admin, dashboard, booking, business-accounts) stays out of the index.
const NOINDEX_FALLBACK: Meta = { path: '/', title: 'Wassel', description: '', noindex: true };

function organizationJsonLd(lang: Language): Record<string, unknown> {
  const isAr = lang === 'ar';
  const address = Object.values(ORG_ADDRESS).some((v) => v && v !== 'PS')
    ? { '@type': 'PostalAddress', ...Object.fromEntries(Object.entries(ORG_ADDRESS).filter(([, v]) => v)) }
    : undefined;

  return {
    '@context': 'https://schema.org',
    // LogisticsBusiness is a LocalBusiness subtype — the right fit for a
    // shipping/warehousing/customs company and good for local + brand search.
    '@type': ['Organization', 'LogisticsBusiness'],
    name: isAr ? 'شركة واصل لوجستيك' : 'Wassel Logistics',
    alternateName: isAr ? ['واصل', 'واصل لوجستكس', 'Wassel'] : ['Wassel', 'واصل لوجستيك'],
    url: `${SITE_URL}/${lang}`,
    logo: `${SITE_URL}/assets/Wassel logo-01.png`,
    image: `${SITE_URL}/assets/Wassel logo-01.png`,
    description: isAr
      ? 'شركة واصل لوجستيك في فلسطين: الشحن المحلي والدولي، التخزين والخدمات اللوجستية (3PL)، التخليص الجمركي، وخدمة توصيل الجوازات الأردنية.'
      : 'Wassel Logistics in Palestine: domestic and international shipping, warehousing and 3PL, customs clearance, and Jordanian passport delivery.',
    email: 'info@wassel.ps',
    telephone: ORG_PHONE,
    areaServed: { '@type': 'Country', name: isAr ? 'فلسطين' : 'Palestine', identifier: 'PS' },
    knowsLanguage: ['ar', 'en'],
    ...(address ? { address } : {}),
    ...(ORG_SAME_AS.length ? { sameAs: ORG_SAME_AS } : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: ORG_PHONE,
      contactType: 'customer service',
      areaServed: 'PS',
      availableLanguage: ['Arabic', 'English'],
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: isAr ? 'خدمات واصل' : 'Wassel Services',
      itemListElement: SERVICE_PILLARS.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: isAr ? s.ar : s.en,
          areaServed: 'PS',
          provider: { '@type': 'Organization', name: isAr ? 'شركة واصل لوجستيك' : 'Wassel Logistics' },
          url: `${SITE_URL}/${lang}${s.path}`,
        },
      })),
    },
  };
}

function websiteJsonLd(lang: Language): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: lang === 'ar' ? 'واصل لوجستكس' : 'Wassel Logistics',
    url: `${SITE_URL}/${lang}`,
    inLanguage: lang === 'ar' ? 'ar' : 'en',
  };
}

/** Builds the <Seo> props for a given view + language. */
export function getPageSeo(view: PageView, lang: Language): SeoProps {
  const meta = PAGES[lang][view] ?? NOINDEX_FALLBACK;
  const jsonLd = view === 'home' && !meta.noindex
    ? [organizationJsonLd(lang), websiteJsonLd(lang)]
    : undefined;
  return {
    lang,
    title: meta.title,
    description: meta.description,
    path: meta.path,
    noindex: meta.noindex,
    jsonLd,
  };
}
