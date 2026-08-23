import React, { Suspense, lazy } from 'react';
import { Language } from '../../types';
import { usePrefersReducedMotion, useIsMobileViewport } from './hooks';
import { SceneLoader } from './SceneLoader';
import { ReducedMotionFallback } from './ReducedMotionFallback';
import { MobileStoryFallback } from './MobileStoryFallback';
import { StoryCallToAction } from './StoryCallToAction';

// Dynamic import: three.js / R3F / gsap only ever get fetched for desktop
// visitors who don't have `prefers-reduced-motion` set — everyone else pays
// zero bytes for the 3D engine.
const DesktopStoryExperience = lazy(() =>
  import('./DesktopStoryExperience').then((module) => ({ default: module.DesktopStoryExperience }))
);

export interface WasselStorySectionProps {
  lang: Language;
  /** Matches the Home page's existing `handleAction` (opens the rates/pickup/tracking popups). */
  onAction: (action: string) => void;
  /** Navigates to the full Contact page. */
  onNavigateContact: () => void;
}

/**
 * Premium 3D scroll-based company overview for the Wassel landing page.
 *
 * Renders one of three experiences depending on the visitor:
 *  - Reduced motion requested  -> `ReducedMotionFallback` (static grid, no canvas).
 *  - Small/touch viewport      -> `MobileStoryFallback` (CSS scroll-reveal cards, no canvas).
 *  - Everyone else             -> `DesktopStoryExperience` (pinned R3F + GSAP ScrollTrigger scene),
 *                                  lazy-loaded so the 3D stack never blocks the initial page render.
 *
 * A closing call-to-action section is always shown, regardless of branch.
 */
export const WasselStorySection: React.FC<WasselStorySectionProps> = ({ lang, onAction, onNavigateContact }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobileViewport();

  const skipStory = () => {
    const cta = document.getElementById('wassel-story-cta');
    cta?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {prefersReducedMotion ? (
        <ReducedMotionFallback lang={lang} />
      ) : isMobile ? (
        <MobileStoryFallback lang={lang} />
      ) : (
        <Suspense fallback={<div className="relative h-screen w-full"><SceneLoader lang={lang} /></div>}>
          <DesktopStoryExperience lang={lang} onSkip={skipStory} />
        </Suspense>
      )}

      <div id="wassel-story-cta">
        <StoryCallToAction
          lang={lang}
          onGetRate={() => onAction('rates')}
          onCreateShipment={() => onAction('pickup')}
          onTrackShipment={() => onAction('tracking')}
          onContact={onNavigateContact}
        />
      </div>
    </div>
  );
};
