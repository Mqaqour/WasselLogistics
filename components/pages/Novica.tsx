import React from 'react';
import { Language } from '../../types';
import { Palette, Globe2, Users, ShoppingBag, ExternalLink, Sparkles, Truck, Mail } from 'lucide-react';

const NOVICA_APPLY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd2-m1j7e1KaJDPcqljDTJeZrA-UMI58Ry80FjooBVfG56LJg/viewform';

interface NovicaProps {
  lang: Language;
}

export const Novica: React.FC<NovicaProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const t = {
    kicker: isAr ? 'واصل × Novica' : 'Wassel × Novica',
    title: isAr ? 'نوفيكا فلسطين' : 'Novica Palestine',
    tagline: isAr
      ? 'منصة عالمية تحتضن الحرفيين الفلسطينيين وتفتح لهم أبواب الأسواق الدولية.'
      : 'A global platform that welcomes Palestinian artisans and opens the door to international markets.',
    intro: isAr
      ? 'ندعم الإبداع المحلي، ونربط المواهب الفلسطينية بملايين المشترين حول العالم، من خلال شراكتنا مع واصل.'
      : "We support local creativity and connect Palestinian talent with millions of buyers around the world, through our partnership with Wassel.",

    aboutTitle: isAr ? 'عن الشراكة' : 'About the partnership',
    aboutP: isAr
      ? 'نوفيكا هي سوق عالمي متخصص بالحرف اليدوية الأصيلة، يصل إلى ملايين المشترين في أكثر من 165 دولة. من خلال شراكة نوفيكا فلسطين مع واصل، يحصل الحرفيون الفلسطينيون على قناة تصدير موثوقة — من استلام المنتج وتغليفه وحتى شحنه والتخليص عليه دولياً — لتصل أعمالهم اليدوية إلى بيوت حول العالم.'
      : "Novica is a global marketplace dedicated to authentic, handmade craftsmanship, reaching millions of buyers in more than 165 countries. Through Novica Palestine's partnership with Wassel, Palestinian artisans get a reliable export channel — from pickup and packaging to international shipping and customs clearance — so their handmade work reaches homes around the world.",

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
      isAr ? 'عبّئ نموذج التقديم أونلاين ببيانات حرفتك وأعمالك.' : 'Fill out the online application with details about your craft and work.',
      isAr ? 'يراجع فريق نوفيكا وواصل طلبك ويتواصلان معك.' : 'The Novica and Wassel team reviews your application and reaches out to you.',
      isAr ? 'بعد القبول، تبدأ بعرض منتجاتك أمام مشترين حول العالم.' : 'Once accepted, start showcasing your products to buyers around the world.',
    ],

    applyNow: isAr ? 'قدّم طلبك الآن' : 'Apply now',
    applyHint: isAr ? 'يفتح نموذج Google في نافذة جديدة' : 'Opens the Google Form in a new tab',
    contactUs: isAr ? 'لديك سؤال؟ تواصل معنا' : 'Have a question? Contact us',
  };

  return (
    <div className="bg-white min-h-screen">
      {/* HERO */}
      <div className="relative bg-wassel-blue text-white overflow-hidden pt-36 md:pt-52 pb-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -right-16 rtl:-left-16 rtl:right-auto top-1/2 -translate-y-1/2 h-[420px] w-[420px] bg-wassel-yellow/10 blur-3xl rounded-full" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-sm font-bold text-blue-100 animate-slide-up">
            <Palette className="w-4 h-4 text-wassel-yellow" />
            {t.kicker}
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight animate-slide-up delay-100">
            <span className="text-wassel-yellow">{t.title}</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto animate-slide-up delay-200">
            {t.tagline}
          </p>
          <p className="mt-4 text-base text-blue-200 max-w-2xl mx-auto animate-slide-up delay-200">
            {t.intro}
          </p>
          <div className="mt-8 animate-slide-up delay-300">
            <a
              href={NOVICA_APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-wassel-yellow px-6 py-3 text-base font-extrabold text-wassel-blue hover:bg-wassel-lightYellow transition-colors shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              {t.applyNow}
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="mt-2 text-xs text-blue-300">{t.applyHint}</p>
          </div>
        </div>
      </div>

      {/* ABOUT THE PARTNERSHIP */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-extrabold text-wassel-blue mb-2">{t.aboutTitle}</h2>
        <div className="h-1 w-16 bg-wassel-yellow rounded mb-8" />
        <p className="text-gray-600 leading-relaxed text-base md:text-lg">{t.aboutP}</p>
      </section>

      {/* BENEFITS */}
      <section className="bg-wassel-blue text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold">{t.benefitsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.benefits.map((b) => (
              <div key={b.title} className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-wassel-yellow/15 text-wassel-yellow">
                  <b.icon className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-lg">{b.title}</h3>
                <p className="text-sm text-blue-100 leading-snug">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO JOIN */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-extrabold text-wassel-blue mb-2">{t.stepsTitle}</h2>
        <div className="h-1 w-16 bg-wassel-yellow rounded mb-8" />
        <ol className="space-y-4">
          {t.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-4 rounded-xl border border-gray-200 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-wassel-blue text-wassel-yellow font-extrabold text-sm">
                {i + 1}
              </span>
              <p className="text-gray-700 leading-relaxed pt-0.5">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="bg-[#F6F8FB] border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-extrabold text-wassel-blue">{t.applyNow}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={NOVICA_APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-wassel-blue px-6 py-3 text-sm font-bold text-white hover:bg-wassel-darkBlue transition-colors"
            >
              <Sparkles className="w-4 h-4" />{t.applyNow}<ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={`/${lang}/contact`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-4 h-4" />{t.contactUs}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
