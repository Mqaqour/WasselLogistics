import React, { useState, useEffect } from 'react';
import { PageView, Language } from '../../types';
import { Menu, X, Truck, User, LogIn, Globe, Phone, MessageCircle } from 'lucide-react';

const BRAND_LOGO = `${import.meta.env.BASE_URL}assets/Wassel logo-01.png`;

interface NavbarProps {
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, isLoggedIn, onLogout, lang, setLang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu on view change
  useEffect(() => {
    setIsOpen(false);
  }, [currentView]);

  const t = {
    dashboard: lang === 'en' ? 'My Dashboard' : 'لوحة التحكم',
    signOut: lang === 'en' ? 'Sign Out' : 'خروج',
    loginShort: lang === 'en' ? 'Login' : 'دخول',
    brand: lang === 'en' ? 'WASSEL' : 'واصل',
    assistant: lang === 'en' ? 'Assistant' : 'المساعدة',
    contactUs: lang === 'en' ? 'Contact Us' : 'تواصل معنا',
  };

  const isTransparent = (
    currentView === 'home' ||
    currentView === 'resources' ||
    currentView === 'contact'
  ) && !isScrolled && !isOpen;

  const topBarBg = isTransparent ? 'bg-transparent border-white/10' : 'bg-wassel-darkBlue border-gray-700/50';
  const mainHeaderBg = isTransparent ? 'bg-transparent' : 'bg-wassel-blue';
  const accentColor = isTransparent ? 'text-white' : 'text-wassel-yellow';

  const handleNavClick = (view: PageView) => {
    setCurrentView(view);
    setIsOpen(false);
    window.scrollTo(0, 0);
  };

  const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 flex flex-col transition-all duration-300 ${isTransparent ? 'shadow-none' : 'shadow-2xl'}`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* LEVEL 1: UTILITIES BAR */}
      <div className={`${topBarBg} text-gray-300 py-2 border-b transition-colors duration-300 relative z-50`}>
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm font-medium">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 hover:text-white cursor-pointer">
              <Phone className="w-4 h-4" />
              <span dir="ltr">1700 974 444</span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={toggleLang} className="flex items-center gap-1 hover:text-white transition-colors">
              <Globe className="w-4 h-4" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <div className="h-4 w-px bg-gray-600"></div>

            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`flex items-center gap-1 hover:${accentColor} ${currentView === 'dashboard' ? accentColor : ''}`}
                >
                  <User className="w-4 h-4" />
                  <span>{t.dashboard}</span>
                </button>
                <button onClick={onLogout} className="text-xs text-gray-400 hover:text-white">{t.signOut}</button>
              </div>
            ) : (
              <a
                href="https://portal.wassel.ps"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 hover:${accentColor} transition-colors`}
              >
                <LogIn className="w-4 h-4 rtl:ml-1 ltr:mr-1" />
                {t.loginShort}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* LEVEL 2: MAIN HEADER (Logo & Top Navigation) */}
      <div className={`${mainHeaderBg} text-white py-4 transition-colors duration-300 relative z-50`}>
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center cursor-pointer gap-3" onClick={() => setCurrentView('home')}>
              {!imgError ? (
                <img
                  src={BRAND_LOGO}
                  alt="Wassel Logistics"
                  className="h-14 sm:h-20 w-auto object-contain brightness-0 invert"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <Truck className={`h-10 w-10 sm:h-12 sm:w-12 ${accentColor}`} />
                  <span className="font-extrabold text-3xl sm:text-4xl tracking-tight leading-none">
                    {t.brand}<span className={accentColor}>.</span>
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              <button
                onClick={() => handleNavClick('resources')}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-base xl:text-lg font-bold transition-all duration-200 text-gray-100 hover:text-wassel-yellow hover:bg-white/5"
              >
                <span>{t.assistant}</span>
              </button>

              <div className="h-6 w-px bg-gray-600 mx-2"></div>

              <button
                onClick={() => handleNavClick('contact')}
                className="ml-2 flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold transition-all duration-200 bg-white text-wassel-blue hover:bg-gray-100 shadow-md"
              >
                <span>{t.contactUs}</span>
              </button>
            </div>

            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`text-white hover:${accentColor} focus:outline-none p-2`}
              >
                {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="lg:hidden bg-wassel-darkBlue border-t border-gray-700 h-[calc(100vh-80px)] overflow-y-auto">
          <div className="px-2 pt-2 pb-20 space-y-1 sm:px-3">
            <div className="border-t border-gray-700/50 pt-2">
              <button onClick={() => handleNavClick('resources')} className="block w-full text-left rtl:text-right px-4 py-4 text-lg font-bold text-gray-200 hover:bg-white/5">
                {t.assistant}
              </button>
              <button onClick={() => handleNavClick('contact')} className="block w-full text-left rtl:text-right px-4 py-4 text-lg font-bold text-gray-200 hover:bg-white/5">
                {t.contactUs}
              </button>
            </div>

            <div className="pt-4 pb-4 space-y-4 px-4 border-t border-gray-700/50">
              <div className="text-gray-400 space-y-4 py-2">
                <div className="flex items-center gap-3 px-4">
                  <Phone className="w-5 h-5" />
                  <span dir="ltr" className="text-lg">1700 974 444</span>
                </div>
                <a href="https://wa.me/972594775000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 hover:text-green-400">
                  <MessageCircle className="w-5 h-5" />
                  <span dir="ltr" className="text-lg">00972 59 477 5000</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
