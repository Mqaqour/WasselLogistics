import React from 'react';
import { Calculator, PackagePlus, Search, PhoneCall } from 'lucide-react';
import { Language } from '../../types';

interface StoryCallToActionProps {
  lang: Language;
  onGetRate: () => void;
  onCreateShipment: () => void;
  onTrackShipment: () => void;
  onContact: () => void;
}

/** Closing call-to-action shown after the story (in every mode: desktop, mobile, reduced-motion). */
export const StoryCallToAction: React.FC<StoryCallToActionProps> = ({
  lang,
  onGetRate,
  onCreateShipment,
  onTrackShipment,
  onContact,
}) => {
  const buttons = [
    { label: lang === 'en' ? 'Get a Rate' : 'احصل على عرض سعر', icon: Calculator, onClick: onGetRate, primary: true },
    { label: lang === 'en' ? 'Create Shipment' : 'أنشئ شحنة', icon: PackagePlus, onClick: onCreateShipment, primary: false },
    { label: lang === 'en' ? 'Track Shipment' : 'تتبع الشحنة', icon: Search, onClick: onTrackShipment, primary: false },
    { label: lang === 'en' ? 'Contact Us' : 'اتصل بنا', icon: PhoneCall, onClick: onContact, primary: false },
  ];

  return (
    <section className="relative overflow-hidden bg-wassel-blue py-16 sm:py-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-[radial-gradient(#FFCD00_1px,transparent_1px)] opacity-10 [background-size:18px_18px]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          {lang === 'en' ? 'Ready to Ship with Wassel?' : 'مستعد للشحن مع واصل؟'}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">
          {lang === 'en'
            ? 'Get a shipping rate, create a shipment, or manage your deliveries through the Wassel platform.'
            : 'احصل على عرض سعر، أنشئ شحنة، أو أدر توصيلاتك عبر منصة واصل.'}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {buttons.map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={button.onClick}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-base font-bold shadow-lg transition-transform hover:scale-105 ${
                button.primary
                  ? 'bg-wassel-yellow text-wassel-blue hover:bg-wassel-lightYellow'
                  : 'border border-white/30 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <button.icon className="h-5 w-5" />
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
