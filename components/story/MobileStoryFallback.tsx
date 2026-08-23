import React, { useRef } from 'react';
import { Globe, Boxes, Plane, Ship, Warehouse, Truck, MapPinned, Network, LucideIcon } from 'lucide-react';
import { Language } from '../../types';
import { STAGES } from './stagesConfig';
import { StageId, pick } from './types';
import { useInViewport } from './hooks';

const STAGE_ICONS: Record<StageId, LucideIcon> = {
  intro: Globe,
  shipments: Boxes,
  air: Plane,
  sea: Ship,
  cargo: Warehouse,
  trucking: Truck,
  domestic: MapPinned,
  network: Network,
};

interface StoryCardProps {
  stage: (typeof STAGES)[number];
  lang: Language;
  index: number;
}

const StoryCard: React.FC<StoryCardProps> = ({ stage, lang, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewport(ref, '-10% 0px -10% 0px');
  const Icon = STAGE_ICONS[stage.id];

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-wassel-blue to-wassel-darkBlue p-6 shadow-xl transition-all duration-700 ease-out ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wassel-yellow/15 text-wassel-yellow">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">
          {String(index + 1).padStart(2, '0')} / {String(STAGES.length).padStart(2, '0')}
        </span>
      </div>

      {stage.eyebrow && (
        <span className="mb-2 inline-block rounded-full bg-wassel-yellow/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-wassel-yellow">
          {pick(stage.eyebrow, lang)}
        </span>
      )}
      <h3 className="text-xl font-extrabold leading-snug text-white">{pick(stage.title, lang)}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{pick(stage.subtitle, lang)}</p>

      {stage.journey && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stage.journey.map((step) => (
            <span key={step.en} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
              {pick(step, lang)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface MobileStoryFallbackProps {
  lang: Language;
}

/**
 * Lightweight mobile/tablet version of the story: a scroll-revealed stack of
 * cards instead of a pinned WebGL scene. No canvas, no GSAP — just an
 * IntersectionObserver-driven fade/slide per card, so it stays fast on
 * constrained devices while still telling all eight service beats.
 */
export const MobileStoryFallback: React.FC<MobileStoryFallbackProps> = ({ lang }) => {
  return (
    <section className="bg-wassel-darkBlue px-4 py-14 sm:px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto mb-10 max-w-xl text-center">
        <h2 className="text-3xl font-extrabold text-white">
          {lang === 'en' ? 'Delivering Without Limits' : 'توصيل بلا حدود'}
        </h2>
        <p className="mt-3 text-base text-white/70">
          {lang === 'en'
            ? 'From documents and parcels to pallets and full cargo shipments, Wassel connects cities, countries, and businesses.'
            : 'من المستندات والطرود إلى المنصات النقالة والشحنات الكاملة، واصل يربط المدن والدول والشركات.'}
        </p>
      </div>

      <div className="mx-auto flex max-w-xl flex-col gap-4">
        {STAGES.map((stage, index) => (
          <StoryCard key={stage.id} stage={stage} lang={lang} index={index} />
        ))}
      </div>
    </section>
  );
};
