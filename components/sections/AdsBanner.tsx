import React, { useState, useEffect } from 'react';
import { X, Megaphone, ArrowRight } from 'lucide-react';
import { Language } from '../../types';

interface AdsBannerProps {
  lang: Language;
  isTransparent?: boolean;
}

export const AdsBanner: React.FC<AdsBannerProps> = ({ lang, isTransparent = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const ads = [
    {
      en: "Get 20% OFF your first international shipment using Wassel Pay!",
      ar: "احصل على خصم 20% على شحنتك الدولية الأولى باستخدام واصل باي!"
    },
    {
      en: "New: Track your shipments instantly via WhatsApp.",
      ar: "جديد: تتبع شحناتك فوراً عبر واتساب."
    },
    {
      en: "Business solutions tailored for e-commerce. Contact us today.",
      ar: "حلول أعمال مخصصة للتجارة الإلكترونية. تواصل معنا اليوم."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  // Dynamic background based on transparent prop
  const bgClass = isTransparent 
    ? 'bg-transparent border-white/10' 
    : 'bg-gradient-to-r from-wassel-blue to-wassel-darkBlue shadow-md';

  return (
    <div className={`${bgClass} text-white py-3 px-4 relative animate-enter z-40 border-b border-white/10 transition-colors duration-300`}>
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between sm:px-6 lg:px-8">
        <div className="flex items-center flex-1 min-w-0 justify-center sm:justify-start">
          <span className="flex p-1 rounded-lg bg-wassel-yellow text-wassel-blue">
            <Megaphone className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="rtl:mr-3 ltr:ml-3 font-medium text-sm sm:text-base truncate transition-all duration-500 ease-in-out">
            {lang === 'en' ? ads[currentAdIndex].en : ads[currentAdIndex].ar}
          </p>
          <a href="#" className="hidden md:flex items-center text-sm font-bold text-wassel-yellow hover:text-white transition-colors rtl:mr-4 ltr:ml-4">
            {lang === 'en' ? 'Learn More' : 'اعرف المزيد'}
            <ArrowRight className="w-4 h-4 rtl:mr-1 ltr:ml-1 rtl:rotate-180" />
          </a>
        </div>
        <div className="flex-shrink-0 order-2 sm:order-3 sm:ml-3 rtl:sm:mr-3">
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="-mr-1 flex p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2 transition-colors"
          >
            <span className="sr-only">{lang === 'en' ? 'Dismiss' : 'إغلاق'}</span>
            <X className="h-5 w-5 text-white" aria-hidden="true" />
          </button>
        </div>
      </div>
      
      {/* Mobile only link (takes up space below text if text wraps, but here simplified) */}
      <div className="md:hidden mt-1 text-center">
          <a href="#" className="text-xs font-bold text-wassel-yellow hover:text-white transition-colors inline-flex items-center">
            {lang === 'en' ? 'Learn More' : 'اعرف المزيد'}
            <ArrowRight className="w-3 h-3 rtl:mr-1 ltr:ml-1 rtl:rotate-180" />
          </a>
      </div>
    </div>
  );
};