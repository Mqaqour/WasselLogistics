import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Language } from '../../types';
import { STAGES, STAGE_COUNT, stageIndexForProgress } from './stagesConfig';
import { ProgressStore } from './types';
import { WasselScene } from './WasselScene';
import { ServiceContentOverlay } from './ServiceContentOverlay';
import { ScrollProgress } from './ScrollProgress';
import { useInViewport } from './hooks';

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance dedicated to each stage, in viewport-heights — generous enough to read scrub smoothly without dragging. */
const SCROLL_VH_PER_STAGE = 110;

/** Rough, cheap heuristic to trim shadow/AA cost on weaker devices (still full WebGL, just lighter). */
const detectLowPowerDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  return cores <= 4;
};

interface DesktopStoryExperienceProps {
  lang: Language;
  onSkip: () => void;
}

/**
 * The full cinematic desktop experience: a tall scroll-driver holding a
 * CSS-`sticky` pinned viewport, a GSAP ScrollTrigger that turns scroll
 * position into a 0..1 progress value (fed to the R3F scene via a mutable
 * ref so scroll never triggers a React re-render), and the HTML overlay
 * (text + progress rail) layered on top of the canvas.
 */
export const DesktopStoryExperience: React.FC<DesktopStoryExperienceProps> = ({ lang, onSkip }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<ProgressStore>({ progress: 0 });
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lowPower] = useState(detectLowPowerDevice);
  const isInViewport = useInViewport(wrapperRef, '400px 0px 400px 0px');

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        storeRef.current.progress = self.progress;
        const nextIndex = stageIndexForProgress(self.progress);
        if (nextIndex !== activeIndexRef.current) {
          activeIndexRef.current = nextIndex;
          setActiveIndex(nextIndex);
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const scrollToStage = (index: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const wrapperTop = window.scrollY + wrapper.getBoundingClientRect().top;
    const scrollableDistance = wrapper.offsetHeight - window.innerHeight;
    const targetProgress = index / (STAGE_COUNT - 1);
    window.scrollTo({ top: wrapperTop + targetProgress * scrollableDistance, behavior: 'smooth' });
  };

  const activeStage = STAGES[activeIndex];

  return (
    <div ref={wrapperRef} className="relative" style={{ height: `${STAGE_COUNT * SCROLL_VH_PER_STAGE}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <Canvas
            dpr={lowPower ? [1, 1.4] : [1, 2]}
            gl={{ antialias: !lowPower, powerPreference: 'high-performance', alpha: false }}
            camera={{ fov: 50, near: 0.1, far: 60, position: STAGES[0].camera.position }}
            shadows={!lowPower}
            frameloop={isInViewport ? 'always' : 'demand'}
          >
            <Suspense fallback={null}>
              <WasselScene store={storeRef.current} lowPower={lowPower} />
            </Suspense>
          </Canvas>
        </div>

        {/* Readability gradient so text stays legible over any part of the scene */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wassel-darkBlue/70 via-transparent to-wassel-darkBlue/20" />

        <ServiceContentOverlay stage={activeStage} lang={lang} isFirstStage={activeIndex === 0} />
        <ScrollProgress stages={STAGES} activeIndex={activeIndex} lang={lang} onSelectStage={scrollToStage} onSkip={onSkip} />
      </div>
    </div>
  );
};
