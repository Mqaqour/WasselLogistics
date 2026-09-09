import React, { useEffect } from 'react';
import { Language } from '../../types';
import { CopilotToggle } from '../shared/CopilotToggle';

const BRAND_LOGO = `${import.meta.env.BASE_URL}assets/Wassel logo-01.png`;

export interface MaintenanceConfig {
  enabled: boolean;
  titleAr?: string;
  titleEn?: string;
  messageAr?: string;
  messageEn?: string;
  /** Expected downtime, shown as a line under the message, e.g. "10 دقائق" / "10 minutes". */
  durationAr?: string;
  durationEn?: string;
}

interface MaintenanceProps {
  lang: Language;
  /** Optional copy overrides pulled from public/maintenance.json. */
  config?: MaintenanceConfig | null;
}

/**
 * Full-screen "under construction" takeover shown to customers while the system
 * is being worked on. Toggled by `public/maintenance.json` (`{"enabled": true}`)
 * so ops can flip it without a rebuild — see the check in App.tsx. Logged-in
 * staff and the /admin and /login routes bypass it.
 */
export const Maintenance: React.FC<MaintenanceProps> = ({ lang, config }) => {
  const isAr = lang === 'ar';

  const title = (isAr ? config?.titleAr : config?.titleEn)?.trim()
    || (isAr ? 'الموقع قيد التطوير' : 'We’re under construction');

  const message = (isAr ? config?.messageAr : config?.messageEn)?.trim()
    || (isAr
      ? 'نُجري حالياً بعض التحسينات على النظام. نعتذر عن الإزعاج وسنعود قريباً.'
      : 'We’re making some improvements to our systems. Sorry for the interruption — we’ll be back shortly.');

  const duration = (isAr ? config?.durationAr : config?.durationEn)?.trim();

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Wassel`;
    return () => { document.title = previous; };
  }, [title]);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-wassel-blue px-6 text-center text-white"
    >
      {/* Subtle dotted pattern, same texture as the home hero */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative z-10 flex max-w-lg flex-col items-center">
        <img src={BRAND_LOGO} alt="Wassel" className="mb-10 h-10 w-auto opacity-90" />

        <CopilotToggle interactive={false} size={132} label={isAr ? 'واصل' : 'Wassel'} className="mb-8" />

        <h1 className="text-3xl font-extrabold leading-tight text-wassel-yellow sm:text-4xl">
          {title}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
          {message}
        </p>

        {duration && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white">
            <span aria-hidden="true">⏱</span>
            {isAr ? `المدة المتوقعة: ${duration}` : `Estimated duration: ${duration}`}
          </p>
        )}

        <div className="mt-10 h-1 w-16 rounded-full bg-wassel-yellow/70" />

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">
          {isAr ? 'شكراً لصبركم' : 'Thank you for your patience'}
        </p>
      </div>
    </div>
  );
};
