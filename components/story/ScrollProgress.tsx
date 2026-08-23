import React from 'react';
import { Language } from '../../types';
import { StageConfig, pick } from './types';

interface ScrollProgressProps {
  stages: StageConfig[];
  activeIndex: number;
  lang: Language;
  onSelectStage: (index: number) => void;
  onSkip: () => void;
}

/** Vertical rail of stage dots (click to jump) plus a "skip the animation" control. */
export const ScrollProgress: React.FC<ScrollProgressProps> = ({ stages, activeIndex, lang, onSelectStage, onSkip }) => {
  return (
    <div
      className={`pointer-events-auto absolute top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex ${
        lang === 'ar' ? 'right-6' : 'left-6'
      }`}
      aria-label={lang === 'en' ? 'Story progress' : 'مراحل القصة'}
    >
      {stages.map((stage, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelectStage(index)}
            className="group relative flex items-center"
            aria-label={pick(stage.dotLabel, lang)}
            aria-current={isActive}
          >
            <span
              className={`block rounded-full border transition-all duration-300 ${
                isActive ? 'h-3 w-3 border-wassel-yellow bg-wassel-yellow' : 'h-2 w-2 border-white/50 bg-transparent group-hover:border-white'
              }`}
            />
            <span
              className={`pointer-events-none absolute whitespace-nowrap rounded-md bg-wassel-darkBlue/90 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${
                lang === 'ar' ? 'right-6' : 'left-6'
              }`}
            >
              {pick(stage.dotLabel, lang)}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onSkip}
        className="mt-4 rounded-full border border-white/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70 transition-colors hover:border-wassel-yellow hover:text-wassel-yellow"
      >
        {lang === 'en' ? 'Skip' : 'تخطي'}
      </button>
    </div>
  );
};
