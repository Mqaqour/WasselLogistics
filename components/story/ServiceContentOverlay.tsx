import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../../types';
import { StageConfig, pick } from './types';
import { STAGE_COUNT } from './stagesConfig';

interface ServiceContentOverlayProps {
  stage: StageConfig;
  lang: Language;
  isFirstStage: boolean;
}

/**
 * HTML text overlay rendered above the WebGL canvas — kept as real DOM (not
 * baked into the 3D scene) for accessibility, SEO, and easy copy edits.
 * Anchored to the physical right edge (not RTL-flipped) so it's clear of the
 * floating action bar, which is always bottom-left, and narrow enough to
 * leave the center of frame — where most stage cameras compose the hero
 * object — unobstructed. Re-keyed by `stage.id` so it replays the existing
 * `animate-slide-up` keyframe (opacity + position) every time the active
 * stage changes.
 */
export const ServiceContentOverlay: React.FC<ServiceContentOverlayProps> = ({ stage, lang, isFirstStage }) => {
  return (
    // dir is forced to ltr here (regardless of language) purely so `justify-end`
    // always means the physical right edge — the panel must stay clear of the
    // floating action bar, which is always bottom-left. Text direction/alignment
    // for the copy itself is set separately on the inner panel below.
    <div
      dir="ltr"
      className="pointer-events-none absolute inset-x-0 bottom-[9%] z-10 flex justify-end px-4 sm:bottom-[11%] sm:px-8 lg:pr-14"
    >
      <div
        key={stage.id}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="animate-slide-up pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] px-6 py-6 text-left rtl:text-right shadow-[0_24px_70px_-20px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:max-w-md sm:px-8 sm:py-7"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-wassel-yellow to-transparent" />

        <span className="mb-3 block text-[11px] font-bold tracking-[0.25em] text-white/40">
          {String(stage.index + 1).padStart(2, '0')} / {String(STAGE_COUNT).padStart(2, '0')}
        </span>

        {stage.eyebrow && (
          <span className="mb-3 inline-block rounded-full bg-wassel-yellow/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-wassel-yellow">
            {pick(stage.eyebrow, lang)}
          </span>
        )}
        <h2 className="text-xl font-extrabold leading-tight text-white sm:text-2xl md:text-[1.85rem]">
          {pick(stage.title, lang)}
        </h2>
        <p className="mt-3 text-sm text-white/75 sm:text-base">{pick(stage.subtitle, lang)}</p>

        {stage.badge && (
          <span className="mt-4 inline-block rounded-full border border-wassel-yellow/40 px-3 py-1 text-xs font-bold text-wassel-yellow">
            {pick(stage.badge, lang)}
          </span>
        )}

        {stage.journey && (
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2">
            {stage.journey.map((step, index) => (
              <React.Fragment key={step.en}>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                  {pick(step, lang)}
                </span>
                {index < stage.journey!.length - 1 && (
                  <span className="text-wassel-yellow" aria-hidden="true">
                    {lang === 'ar' ? '←' : '→'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {isFirstStage && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 text-white/70">
          <span className="text-[11px] font-semibold uppercase tracking-widest">
            {lang === 'en' ? 'Scroll to explore' : 'مرر للأسفل للاستكشاف'}
          </span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      )}
    </div>
  );
};
