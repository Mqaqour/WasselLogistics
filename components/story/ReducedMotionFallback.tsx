import React from 'react';
import { Globe, Boxes, Plane, Ship, Warehouse, Truck, MapPinned, Network, LucideIcon } from 'lucide-react';
import { Language } from '../../types';
import { STAGES } from './stagesConfig';
import { StageId, pick } from './types';

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

interface ReducedMotionFallbackProps {
  lang: Language;
}

/**
 * Static, non-animated overview shown instead of the cinematic scroll scene
 * when the visitor's OS requests `prefers-reduced-motion: reduce`. Same
 * eight-service story, told as a plain readable grid — no canvas, no scroll
 * hijacking.
 */
export const ReducedMotionFallback: React.FC<ReducedMotionFallbackProps> = ({ lang }) => {
  return (
    <section className="bg-wassel-darkBlue py-16 sm:py-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            {lang === 'en' ? 'Delivering Without Limits' : 'توصيل بلا حدود'}
          </h2>
          <p className="mt-4 text-lg text-white/70">
            {lang === 'en'
              ? 'From documents and parcels to pallets and full cargo shipments, Wassel connects cities, countries, and businesses.'
              : 'من المستندات والطرود إلى المنصات النقالة والشحنات الكاملة، واصل يربط المدن والدول والشركات.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => {
            const Icon = STAGE_ICONS[stage.id];
            return (
              <div
                key={stage.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-wassel-yellow/40"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-wassel-yellow/10 text-wassel-yellow">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{pick(stage.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{pick(stage.subtitle, lang)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
