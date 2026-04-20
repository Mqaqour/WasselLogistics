import React, { useState, useEffect, useRef } from 'react';
import { PageView, Language, Theme } from '../types';
import { Menu, X, Truck, User, LogIn, Globe, CreditCard, Phone, MessageCircle, ChevronDown, ChevronUp, ArrowRight, Info, Users, Briefcase } from 'lucide-react';

interface NavbarProps {
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, isLoggedIn, onLogout, lang, setLang, theme, setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Mega Menu State
  const [activeMegaMenu, setActiveMegaMenu] = useState<'discover' | 'individuals' | 'corporate' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setActiveMegaMenu(null);
        }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus on view change
  useEffect(() => {
      setActiveMegaMenu(null);
      setIsOpen(false);
  }, [currentView]);

  const t = {
    pay: lang === 'en' ? 'Wassel Pay' : 'واصل باي',
    dashboard: lang === 'en' ? 'My Dashboard' : 'لوحة التحكم',
    signOut: lang === 'en' ? 'Sign Out' : 'خروج',
    login: lang === 'en' ? 'Customer Login' : 'دخول العملاء',
    loginShort: lang === 'en' ? 'Login' : 'دخول',
    brand: lang === 'en' ? 'WASSEL' : 'واصل',
    individuals: lang === 'en' ? 'Individuals' : 'الأفراد',
    corporate: lang === 'en' ? 'Corporate' : 'الشركات',
    discover: lang === 'en' ? 'Discover Wassel' : 'اكتشف واصل',
    exploreServices: lang === 'en' ? 'Explore Services' : 'استكشف الخدمات',
    viewAll: lang === 'en' ? 'View All' : 'عرض الكل',
  };

  // Determine if we are on the specific Corporate Home Page
  const isCorporateTheme = theme === 'corporate';

  // Determine if header should be transparent
  const isTransparent = (
      currentView === 'home' || 
      currentView === 'handmade' || 
      currentView === 'industries' || 
      currentView === 'resources' || 
      currentView === 'contact'
    ) && !isScrolled && !isOpen && !activeMegaMenu;

  // Colors based on Theme & State
  const mobileMenuBg = isCorporateTheme ? 'bg-corp-dark' : 'bg-wassel-darkBlue';
  
  const topBarBg = isTransparent 
    ? 'bg-transparent border-white/10' 
    : (isCorporateTheme ? 'bg-corp-dark border-gray-700/50' : 'bg-wassel-darkBlue border-gray-700/50');
    
  const mainHeaderBg = isTransparent 
    ? 'bg-transparent' 
    : (isCorporateTheme ? 'bg-corp-primary' : 'bg-wassel-blue');
    
  const accentColor = isTransparent 
    ? 'text-white' // Ensure visibility on transparent
    : (isCorporateTheme ? 'text-corp-secondary' : 'text-wassel-yellow');

  // --- SERVICE DATA ---

  const individualServices = [
    { id: 'clearance', label: { en: 'Parcel Clearance', ar: 'تخليص الطرود' }, desc: { en: 'Customs handling', ar: 'تخليص جمركي' }, view: 'service-clearance', icon: Globe },
    { id: 'pick-pack', label: { en: 'Pick & Pack', ar: 'التغليف والتجهيز' }, desc: { en: 'Professional packing', ar: 'تغليف احترافي' }, view: 'service-pick-pack', icon: Truck },
    { id: 'express', label: { en: 'International Express', ar: 'الشحن الدولي السريع' }, desc: { en: 'Global shipping', ar: 'شحن عالمي' }, view: 'service-express', icon: Globe },
    { id: 'domestic', label: { en: 'Domestic Shipping', ar: 'الشحن المحلي' }, desc: { en: 'Local delivery', ar: 'توصيل محلي' }, view: 'service-domestic', icon: Truck },
    { id: 'shop', label: { en: 'Shop & Ship', ar: 'تسوق واستلم' }, desc: { en: 'Global addresses', ar: 'عناوين عالمية' }, view: 'service-shop', icon: Truck },
    { id: 'idp', label: { en: 'Intl. Driving Permit', ar: 'رخصة القيادة الدولية' }, desc: { en: 'Drive globally', ar: 'قيادة عالمية' }, view: 'service-idp', icon: CreditCard },
    { id: 'jordanian', label: { en: 'Jordanian Passports', ar: 'الجوازات الأردنية' }, desc: { en: 'Passport services', ar: 'خدمات الجوازات' }, view: 'service-jordanian', icon: User }
  ];

  const corporateServices = [
    { id: 'corp-pick-pack', label: { en: 'Fulfillment Packing', ar: 'تجهيز وتغليف الأعمال' }, desc: { en: 'Outsourced packing', ar: 'تغليف خارجي' }, view: 'service-corp-pick-pack', icon: Truck },
    { id: 'daily', label: { en: 'Daily Mail', ar: 'البريد اليومي' }, desc: { en: 'Scheduled runs', ar: 'جولات مجدولة' }, view: 'service-corp-daily', icon: MessageCircle },
    { id: 'signing', label: { en: 'Document Signing', ar: 'توقيع المستندات' }, desc: { en: 'Verified signatures', ar: 'تواقيع معتمدة' }, view: 'service-corp-signing', icon: User },
    { id: 'bulk', label: { en: 'Bulk Distribution', ar: 'التوزيع بالجملة' }, desc: { en: 'Mass delivery', ar: 'توصيل كميات' }, view: 'service-corp-bulk', icon: Truck },
    { id: 'import', label: { en: 'Import & Export', ar: 'الإستيراد والتصدير' }, desc: { en: 'Freight forwarding', ar: 'شحن بضائع' }, view: 'service-corp-import', icon: Globe },
    { id: 'storage', label: { en: 'Storage', ar: 'التخزين' }, desc: { en: 'Secure storage', ar: 'تخزين آمن' }, view: 'service-corp-storage', icon: Truck },
    { id: 'warehousing', label: { en: 'Warehouse Management', ar: 'إدارة المستودعات' }, desc: { en: 'Full logistics', ar: 'لوجستيات كاملة' }, view: 'service-corp-warehousing', icon: Truck },
    { id: 'freight', label: { en: 'Heavy Freight', ar: 'الشحن الثقيل' }, desc: { en: 'Large cargo', ar: 'بضائع ضخمة' }, view: 'service-corp-freight', icon: Truck }
  ];

  const discoverItems = [
      { id: 'about', label: { en: 'About Wassel', ar: 'نبذة عن واصل' }, desc: { en: 'Our story & vision', ar: 'قصتنا ورؤيتنا' }, view: 'about', icon: Info },
      { id: 'management', label: { en: 'Executive Management', ar: 'الإدارة التنفيذية' }, desc: { en: 'Leadership team', ar: 'فريق القيادة' }, view: 'management', icon: Users },
      { id: 'careers', label: { en: 'Careers', ar: 'الوظائف' }, desc: { en: 'Join our team', ar: 'انضم لفريقنا' }, view: 'about', icon: Briefcase }
  ];

  // --- HANDLERS ---

  const handleNavClick = (view: string) => {
    setCurrentView(view as PageView);
    setIsOpen(false);
    setActiveMegaMenu(null);
    window.scrollTo(0, 0);
  };

  const handleMegaMenuTrigger = (menu: 'discover' | 'individuals' | 'corporate') => {
      if (activeMegaMenu === menu) {
          setActiveMegaMenu(null);
      } else {
          setActiveMegaMenu(menu);
          // Contextual Theme Switch
          if (menu === 'corporate') setTheme('corporate');
          if (menu === 'individuals') setTheme('individuals');
      }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const toggleMobileSubmenu = (id: string) => {
    setMobileSubmenu(mobileSubmenu === id ? null : id);
  };

  return (
    <nav 
        className={`fixed top-0 left-0 w-full z-50 flex flex-col transition-all duration-300 ${isTransparent ? 'shadow-none' : 'shadow-2xl'}`} 
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        ref={menuRef}
    >
      {/* LEVEL 1: UTILITIES BAR */}
      <div className={`${topBarBg} text-gray-300 py-2 border-b transition-colors duration-300 relative z-50`}>
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm font-medium">
            <div className="flex items-center gap-4 sm:gap-6">
                <button 
                  onClick={() => handleNavClick('payment-gateway')}
                  className={`flex items-center gap-2 hover:${accentColor} transition-colors ${currentView === 'payment-gateway' ? accentColor : ''}`}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>{t.pay}</span>
                </button>
                <div className="hidden sm:flex items-center gap-2 hover:text-white cursor-pointer">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">1700 974 444</span>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
                <button
                    onClick={toggleLang}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                >
                    <Globe className="w-4 h-4" />
                    <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                </button>

                <div className="h-4 w-px bg-gray-600"></div>

                {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleNavClick('dashboard')}
                            className={`flex items-center gap-1 hover:${accentColor} ${
                                currentView === 'dashboard' ? accentColor : ''
                            }`}
                        >
                            <User className="w-4 h-4" />
                            <span>{t.dashboard}</span>
                        </button>
                        <button onClick={onLogout} className="text-xs text-gray-400 hover:text-white">{t.signOut}</button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleNavClick('login')}
                        className={`flex items-center gap-1 hover:${accentColor} transition-colors`}
                    >
                        <LogIn className="w-4 h-4 rtl:ml-1 ltr:mr-1" />
                        {t.loginShort}
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* LEVEL 2: MAIN HEADER (Logo & Top Navigation) */}
      <div className={`${mainHeaderBg} text-white py-4 transition-colors duration-300 relative z-50`}>
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center cursor-pointer gap-3" onClick={() => { setTheme('individuals'); setCurrentView('home'); }}>
                    {!imgError ? (
                        <img 
                            src="Wassel logo-01.png" 
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

                {/* Desktop Top Menu */}
                <div className="hidden lg:flex items-center gap-1 xl:gap-2">
                    {/* Discover Trigger */}
                    <button
                        onClick={() => handleMegaMenuTrigger('discover')}
                        className={`flex items-center gap-1 px-4 py-2 rounded-md text-base xl:text-lg font-bold transition-all duration-200 group hover:bg-white/5 ${activeMegaMenu === 'discover' ? `bg-white/10 ${accentColor}` : `text-gray-100 hover:${accentColor}`}`}
                    >
                        <span>{t.discover}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMegaMenu === 'discover' ? 'rotate-180' : ''}`} />
                    </button>

                    <button onClick={() => handleNavClick('handmade')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-base xl:text-lg font-bold transition-all duration-200 relative group text-gray-100 hover:text-wassel-yellow hover:bg-white/5`}>
                        <span>{lang === 'en' ? 'Handmade' : 'هاند ميد'}</span>
                        <span className="absolute -top-2.5 -right-3 rtl:-left-3 rtl:right-auto px-1.5 py-[1px] text-[8px] leading-none bg-wassel-yellow text-wassel-blue rounded-[2px] font-bold uppercase shadow-sm">
                            {lang === 'en' ? 'New' : 'جديد'}
                        </span>
                    </button>

                    <button onClick={() => handleNavClick('resources')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-base xl:text-lg font-bold transition-all duration-200 text-gray-100 hover:text-wassel-yellow hover:bg-white/5`}>
                        <span>{lang === 'en' ? 'Resources' : 'المصادر'}</span>
                    </button>

                    <div className="h-6 w-px bg-gray-600 mx-2"></div>

                    {/* Individuals Trigger */}
                    <button
                        onClick={() => handleMegaMenuTrigger('individuals')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-base xl:text-lg font-bold transition-all duration-200 ${activeMegaMenu === 'individuals' || (theme === 'individuals' && !activeMegaMenu && currentView !== 'home') ? 'text-wassel-yellow bg-white/10' : 'text-gray-100 hover:text-wassel-yellow hover:bg-white/5'}`}
                    >
                        <span>{t.individuals}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMegaMenu === 'individuals' ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Corporate Trigger */}
                    <button
                        onClick={() => handleMegaMenuTrigger('corporate')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-base xl:text-lg font-bold transition-all duration-200 ${activeMegaMenu === 'corporate' || (theme === 'corporate' && !activeMegaMenu && currentView !== 'home') ? 'text-corp-secondary bg-white/10' : 'text-gray-100 hover:text-corp-secondary hover:bg-white/5'}`}
                    >
                        <span>{t.corporate}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMegaMenu === 'corporate' ? 'rotate-180' : ''}`} />
                    </button>

                    <button onClick={() => handleNavClick('contact')} className={`ml-2 flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold transition-all duration-200 bg-white text-wassel-blue hover:bg-gray-100 shadow-md`}>
                        <span>{lang === 'en' ? 'Contact Us' : 'تواصل معنا'}</span>
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

      {/* --- MEGA MENU OVERLAY (DESKTOP) --- */}
      {activeMegaMenu && (
          <div className="hidden lg:block absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-100 animate-slide-up z-40 max-h-[85vh] overflow-y-auto">
              <div className="max-w-[1920px] mx-auto px-8 py-10">
                  <div className="flex gap-12">
                      {/* Left Side: Featured / Description */}
                      <div className="w-1/4 pr-8 border-r border-gray-100 rtl:border-r-0 rtl:border-l rtl:pl-8 rtl:pr-0">
                          <h3 className="text-3xl font-extrabold text-wassel-blue mb-4">
                              {activeMegaMenu === 'individuals' && t.individuals}
                              {activeMegaMenu === 'corporate' && t.corporate}
                              {activeMegaMenu === 'discover' && t.discover}
                          </h3>
                          <p className="text-gray-500 mb-8 leading-relaxed">
                              {activeMegaMenu === 'individuals' && (lang === 'en' ? 'Personalized shipping solutions for your everyday needs. Shop, ship, and track with ease.' : 'حلول شحن مخصصة لاحتياجاتك اليومية. تسوق، اشحن، وتتبع بسهولة.')}
                              {activeMegaMenu === 'corporate' && (lang === 'en' ? 'End-to-end logistics infrastructure for businesses. Scale your operations with our network.' : 'بنية تحتية لوجستية شاملة للأعمال. وسع عملياتك مع شبكتنا.')}
                              {activeMegaMenu === 'discover' && (lang === 'en' ? 'Learn more about our journey, leadership, and vision for the future of logistics.' : 'تعرف أكثر على رحلتنا، قيادتنا، ورؤيتنا لمستقبل الخدمات اللوجستية.')}
                          </p>
                          <button 
                            onClick={() => {
                                if (activeMegaMenu === 'individuals') { setCurrentView('services'); setTheme('individuals'); }
                                if (activeMegaMenu === 'corporate') { setCurrentView('home'); setTheme('corporate'); }
                                if (activeMegaMenu === 'discover') { setCurrentView('about'); }
                                setActiveMegaMenu(null);
                            }}
                            className={`flex items-center gap-2 font-bold text-lg ${activeMegaMenu === 'corporate' ? 'text-corp-secondary' : 'text-wassel-blue'} hover:underline`}
                          >
                              {t.viewAll} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                          </button>
                      </div>

                      {/* Right Side: Grid of Links */}
                      <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">{t.exploreServices}</h4>
                          <div className="grid grid-cols-3 gap-x-8 gap-y-8">
                              {activeMegaMenu === 'individuals' && individualServices.map((service) => (
                                  <button 
                                    key={service.id}
                                    onClick={() => handleNavClick(service.view)}
                                    className="group flex items-start gap-4 text-left rtl:text-right p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                  >
                                      <div className="p-3 bg-blue-50 text-wassel-blue rounded-lg group-hover:bg-wassel-blue group-hover:text-white transition-colors">
                                          <service.icon className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <div className="font-bold text-gray-900 group-hover:text-wassel-blue text-lg">{lang === 'en' ? service.label.en : service.label.ar}</div>
                                          <div className="text-sm text-gray-500 mt-1">{lang === 'en' ? service.desc.en : service.desc.ar}</div>
                                      </div>
                                  </button>
                              ))}

                              {activeMegaMenu === 'corporate' && corporateServices.map((service) => (
                                  <button 
                                    key={service.id}
                                    onClick={() => handleNavClick(service.view)}
                                    className="group flex items-start gap-4 text-left rtl:text-right p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                  >
                                      <div className="p-3 bg-gray-100 text-corp-primary rounded-lg group-hover:bg-corp-primary group-hover:text-corp-secondary transition-colors">
                                          <service.icon className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <div className="font-bold text-gray-900 group-hover:text-corp-primary text-lg">{lang === 'en' ? service.label.en : service.label.ar}</div>
                                          <div className="text-sm text-gray-500 mt-1">{lang === 'en' ? service.desc.en : service.desc.ar}</div>
                                      </div>
                                  </button>
                              ))}

                              {activeMegaMenu === 'discover' && discoverItems.map((item) => (
                                  <button 
                                    key={item.id}
                                    onClick={() => handleNavClick(item.view)}
                                    className="group flex items-start gap-4 text-left rtl:text-right p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                  >
                                      <div className="p-3 bg-blue-50 text-wassel-blue rounded-lg group-hover:bg-wassel-blue group-hover:text-white transition-colors">
                                          <item.icon className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <div className="font-bold text-gray-900 group-hover:text-wassel-blue text-lg">{lang === 'en' ? item.label.en : item.label.ar}</div>
                                          <div className="text-sm text-gray-500 mt-1">{lang === 'en' ? item.desc.en : item.desc.ar}</div>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
              {/* Overlay Backdrop for outside click visual */}
              <div className="fixed top-[top-full] left-0 w-full h-screen bg-black/20 backdrop-blur-sm -z-10" onClick={() => setActiveMegaMenu(null)}></div>
          </div>
      )}

      {/* MOBILE MENU */}
      {isOpen && (
        <div className={`lg:hidden ${mobileMenuBg} border-t border-gray-700 h-[calc(100vh-80px)] overflow-y-auto`}>
          <div className="px-2 pt-2 pb-20 space-y-1 sm:px-3">
            
            {/* Mobile Tab Switcher */}
            <div className="flex border-b border-gray-700 mb-2">
                <button 
                  onClick={() => setTheme('individuals')}
                  className={`flex-1 py-3 text-center font-bold ${theme === 'individuals' ? 'text-wassel-yellow bg-white/10' : 'text-gray-400'}`}
                >
                  {t.individuals}
                </button>
                <div className="w-px bg-gray-700"></div>
                <button 
                  onClick={() => setTheme('corporate')}
                  className={`flex-1 py-3 text-center font-bold ${theme === 'corporate' ? 'text-corp-secondary bg-white/10' : 'text-gray-400'}`}
                >
                  {t.corporate}
                </button>
            </div>

            {/* Discover Section */}
            <div className="border-b border-gray-700/50">
                <button
                    onClick={() => toggleMobileSubmenu('discover')}
                    className="w-full flex justify-between items-center px-4 py-4 text-lg font-bold text-gray-200 hover:text-white hover:bg-white/5 rounded-md"
                >
                    <span>{t.discover}</span>
                    {mobileSubmenu === 'discover' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {mobileSubmenu === 'discover' && (
                    <div className="bg-black/20 px-4 py-2 space-y-1">
                        {discoverItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.view)}
                                className="block w-full text-left rtl:text-right px-4 py-3 text-base font-medium text-gray-400 hover:text-white rounded-md transition-colors"
                            >
                                {lang === 'en' ? item.label.en : item.label.ar}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Services List Based on Active Mobile Tab */}
            <div className="px-4 py-4">
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 text-gray-400`}>
                    {theme === 'corporate' ? (lang === 'en' ? 'Corporate Services' : 'خدمات الشركات') : 
                        (lang === 'en' ? 'Individual Services' : 'خدمات الأفراد')}
                </h3>
                <div className="space-y-1 bg-black/10 rounded-lg overflow-hidden">
                    {(theme === 'corporate' ? corporateServices : individualServices).map((service) => (
                            <button
                            key={service.id}
                            onClick={() => handleNavClick(service.view)}
                            className={`block w-full text-left rtl:text-right px-4 py-3 text-base font-medium text-gray-300 hover:bg-white/5 hover:${accentColor} transition-colors border-b border-gray-700/30 last:border-0 ${currentView === service.view ? accentColor : ''}`}
                        >
                            {lang === 'en' ? service.label.en : service.label.ar}
                        </button>
                    ))}
                </div>
            </div>

            {/* Static Links */}
            <div className="border-t border-gray-700/50 pt-2">
                <button onClick={() => handleNavClick('handmade')} className="block w-full text-left rtl:text-right px-4 py-4 text-lg font-bold text-gray-200 hover:bg-white/5 flex justify-between">
                    <span>{lang === 'en' ? 'Handmade' : 'هاند ميد'}</span>
                    <span className="px-1.5 py-[1px] text-[8px] leading-none bg-wassel-yellow text-wassel-blue rounded-[2px] font-bold uppercase">New</span>
                </button>
                <button onClick={() => handleNavClick('resources')} className="block w-full text-left rtl:text-right px-4 py-4 text-lg font-bold text-gray-200 hover:bg-white/5">
                    {lang === 'en' ? 'Resources' : 'المصادر'}
                </button>
                <button onClick={() => handleNavClick('contact')} className="block w-full text-left rtl:text-right px-4 py-4 text-lg font-bold text-gray-200 hover:bg-white/5">
                    {lang === 'en' ? 'Contact Us' : 'تواصل معنا'}
                </button>
            </div>
            
            <div className="pt-4 pb-4 space-y-4 px-4 border-t border-gray-700/50">
                <button
                    onClick={() => handleNavClick('payment-gateway')}
                    className="block w-full text-left rtl:text-right px-4 py-3 text-base font-medium text-gray-300 hover:text-white bg-white/5 rounded-lg"
                >
                     <div className="flex items-center">
                        <CreditCard className="w-5 h-5 rtl:ml-4 ltr:mr-4" />
                        {t.pay}
                    </div>
                </button>
                
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