import { Language, PageView } from '../types';
import type { SeoProps } from '../components/Seo';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://wassel.ps').replace(/\/+$/, '');

type Meta = { title: string; description: string; path: string; noindex?: boolean };

const PAGES: Record<Language, Partial<Record<PageView, Meta>>> = {
  en: {
    home: {
      path: '/',
      title: 'Wassel Logistics — Shipping, Tracking & Logistics in Palestine',
      description:
        'Wassel connects Palestine to the world with domestic and international shipping, customs clearance, warehousing and courier services. Track shipments, get rates and schedule a pickup.',
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
      title: 'واصل لوجستكس — الشحن والتتبع والخدمات اللوجستية في فلسطين',
      description:
        'واصل نصل فلسطين بالعالم عبر الشحن المحلي والدولي، التخليص الجمركي، التخزين وخدمات التوصيل السريع. تتبّع شحنتك، احصل على الأسعار واطلب استلاماً.',
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: lang === 'ar' ? 'واصل لوجستكس' : 'Wassel Logistics',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/Wassel logo-01.png`,
    email: 'info@wassel.ps',
    telephone: '1700974444',
    areaServed: 'PS',
    sameAs: [] as string[],
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
