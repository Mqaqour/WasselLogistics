import React from 'react';
import { Language } from '../../types';

interface SceneLoaderProps {
  lang: Language;
}

/** Shown while the 3D chunk (three.js/R3F/gsap) is being fetched and while the first frame compiles. */
export const SceneLoader: React.FC<SceneLoaderProps> = ({ lang }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-wassel-darkBlue text-white">
    <div className="w-14 h-14">
      <div className="w-full h-full rounded-full border-4 border-wassel-yellow border-t-transparent animate-spin" />
    </div>
    <p className="mt-4 text-sm font-medium tracking-wide text-white/70">
      {lang === 'en' ? 'Loading the Wassel experience…' : 'جاري تحميل تجربة واصل…'}
    </p>
  </div>
);
