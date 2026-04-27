import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, Clock, ArrowRight, Bell } from 'lucide-react';
import { Language } from '../../types';

interface LatestUpdatesProps {
  lang: Language;
}

type Severity = 'critical' | 'warning' | 'info' | 'success';

interface UpdateItem {
  id: string;
  severity: Severity;
  date: string;
  image: string;
  category: { en: string; ar: string };
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
}

const SEVERITY_STYLES: Record<Severity, { badge: string; ring: string; icon: React.ElementType; label: { en: string; ar: string } }> = {
  critical: {
    badge: 'bg-red-100 text-red-700',
    ring: 'border-l-4 border-red-500 rtl:border-l-0 rtl:border-r-4',
    icon: AlertTriangle,
    label: { en: 'Critical', ar: 'هام جداً' },
  },
  warning: {
    badge: 'bg-amber-100 text-amber-700',
    ring: 'border-l-4 border-amber-500 rtl:border-l-0 rtl:border-r-4',
    icon: Clock,
    label: { en: 'Advisory', ar: 'تنبيه' },
  },
  info: {
    badge: 'bg-blue-100 text-wassel-blue',
    ring: 'border-l-4 border-wassel-blue rtl:border-l-0 rtl:border-r-4',
    icon: Info,
    label: { en: 'Update', ar: 'تحديث' },
  },
  success: {
    badge: 'bg-emerald-100 text-emerald-700',
    ring: 'border-l-4 border-emerald-500 rtl:border-l-0 rtl:border-r-4',
    icon: CheckCircle2,
    label: { en: 'Resumed', ar: 'استئناف' },
  },
};

const UPDATES: UpdateItem[] = [
  {
    id: 'u1',
    severity: 'critical',
    date: '2026-04-22',
    image: 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80&w=800',
    category: { en: 'Customs', ar: 'الجمارك' },
    title: {
      en: 'Customs clearance delays at Allenby Bridge',
      ar: 'تأخير في التخليص الجمركي عند جسر اللنبي',
    },
    desc: {
      en: 'Expect 24–48h additional processing time on inbound shipments through the Allenby crossing this week.',
      ar: 'يُتوقع تأخير إضافي من 24 إلى 48 ساعة على الشحنات الواردة عبر معبر اللنبي خلال هذا الأسبوع.',
    },
  },
  {
    id: 'u2',
    severity: 'warning',
    date: '2026-04-21',
    image: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=800',
    category: { en: 'International', ar: 'دولي' },
    title: {
      en: 'DHL Europe lanes: temporary surcharge in effect',
      ar: 'مسارات DHL أوروبا: رسوم إضافية مؤقتة سارية',
    },
    desc: {
      en: 'A peak-season surcharge of 1.50 USD/kg applies to all express shipments to EU destinations until further notice.',
      ar: 'تطبق رسوم موسم الذروة بقيمة 1.50 دولار/كجم على جميع شحنات الإكسبرس لوجهات الاتحاد الأوروبي حتى إشعار آخر.',
    },
  },
  {
    id: 'u3',
    severity: 'info',
    date: '2026-04-20',
    image: 'https://images.unsplash.com/photo-1601158935942-52255782d322?auto=format&fit=crop&q=80&w=800',
    category: { en: 'Domestic', ar: 'محلي' },
    title: {
      en: 'New Hebron pickup hub now operational',
      ar: 'مركز الاستلام الجديد في الخليل بدأ العمل',
    },
    desc: {
      en: 'Same-day pickup window extended to 18:00 across the southern West Bank from our new Hebron facility.',
      ar: 'تم تمديد وقت الاستلام في نفس اليوم حتى الساعة 18:00 في جنوب الضفة الغربية من مركزنا الجديد في الخليل.',
    },
  },
  {
    id: 'u4',
    severity: 'success',
    date: '2026-04-18',
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800',
    category: { en: 'Gaza', ar: 'غزة' },
    title: {
      en: 'Gaza humanitarian lane: deliveries resumed',
      ar: 'مسار غزة الإنساني: استئناف عمليات التسليم',
    },
    desc: {
      en: 'Coordinated deliveries to Gaza City have resumed under the updated humanitarian framework. Tracking remains live.',
      ar: 'استؤنفت عمليات التسليم المنسقة إلى مدينة غزة وفق الإطار الإنساني المحدث. التتبع متاح بشكل مباشر.',
    },
  },
];

const FILTERS: { key: Severity | 'all'; en: string; ar: string }[] = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'critical', en: 'Critical', ar: 'هام جداً' },
  { key: 'warning', en: 'Advisory', ar: 'تنبيه' },
  { key: 'info', en: 'Update', ar: 'تحديث' },
  { key: 'success', en: 'Resumed', ar: 'استئناف' },
];

export const LatestUpdates: React.FC<LatestUpdatesProps> = ({ lang }) => {
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const t = {
    eyebrow: lang === 'en' ? 'Latest Updates' : 'آخر التحديثات',
    title: lang === 'en' ? 'Service notes & operational alerts' : 'ملاحظات الخدمة والتنبيهات التشغيلية',
    subtitle:
      lang === 'en'
        ? 'Critical notices that may affect your shipments — updated by our operations team in real time.'
        : 'إشعارات هامة قد تؤثر على شحناتك — يتم تحديثها من قبل فريق العمليات بشكل فوري.',
    viewAll: lang === 'en' ? 'View all updates' : 'عرض كل التحديثات',
    empty: lang === 'en' ? 'No updates in this category right now.' : 'لا توجد تحديثات في هذه الفئة حالياً.',
  };

  const visible = filter === 'all' ? UPDATES : UPDATES.filter((u) => u.severity === filter);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-EG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <section className="bg-white py-20 relative">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-sm font-bold text-red-600 uppercase tracking-wider">{t.eyebrow}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-wassel-blue mb-3">{t.title}</h2>
              <p className="text-gray-600 max-w-2xl">{t.subtitle}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors border ${
                      active
                        ? 'bg-wassel-blue text-white border-wassel-blue'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-wassel-blue hover:text-wassel-blue'
                    }`}
                  >
                    {lang === 'en' ? f.en : f.ar}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid */}
          {visible.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              {t.empty}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {visible.map((u, idx) => {
                const s = SEVERITY_STYLES[u.severity];
                const Icon = s.icon;
                return (
                  <article
                    key={u.id}
                    className={`group bg-white shadow-sm hover:shadow-lg transition-all duration-300 ${s.ring} rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl overflow-hidden flex flex-col sm:flex-row animate-slide-up`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {/* Thumbnail */}
                    <div className="relative sm:w-44 h-40 sm:h-auto shrink-0 overflow-hidden bg-gray-100">
                      <img
                        src={u.image}
                        alt={lang === 'en' ? u.title.en : u.title.ar}
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
                      <div className={`absolute top-3 left-3 rtl:left-auto rtl:right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md ${s.badge}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 pl-6 rtl:pl-5 rtl:pr-6 pr-5 py-5">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${s.badge}`}>
                          {lang === 'en' ? s.label.en : s.label.ar}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          {lang === 'en' ? u.category.en : u.category.ar}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <time className="text-xs text-gray-500" dateTime={u.date}>
                          {formatDate(u.date)}
                        </time>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-wassel-blue transition-colors">
                        {lang === 'en' ? u.title.en : u.title.ar}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {lang === 'en' ? u.desc.en : u.desc.ar}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Footer link */}
          <div className="mt-8 flex justify-center">
            <button className="inline-flex items-center gap-2 text-wassel-blue font-bold text-sm hover:underline">
              {t.viewAll}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
