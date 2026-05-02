import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Tracking,
  RateCalculator,
  Pickup,
  Dashboard,
  Login,
  ChatBot,
  Services,
  Corporate,
  Handmade,
  Resources,
  Industries,
  PaymentGateway,
  FloatingActionBar,
  About,
  Management,
  Contact,
  FloatingCircles,
  IDPOrderModal,
  ServiceDetail,
  BookingWindow,
  LatestUpdates,
} from './components';
import { ChatWidget } from './components/chat/ChatWidget';
import { PageView, Language, Theme } from './types';
import { Package, X, Truck } from 'lucide-react';

const BRAND_LOGO = `${import.meta.env.BASE_URL}assets/Wassel logo-01.png`;

export const App: React.FC = () => {
  const respondIoChannelId = import.meta.env.VITE_RESPONDIO_CHANNEL_ID?.trim();
  const shouldRenderLegacyChatBot = Boolean(respondIoChannelId);

  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [theme, setTheme] = useState<Theme>('individuals');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  
  // State to pass data from Tracking to PaymentGateway
  // Updated to include billDetails for down payments
  const [paymentParams, setPaymentParams] = useState<{ 
      ref: string; 
      service: string;
      billDetails?: { label: string; amount: number }[];
  } | null>(null);
  
  // Quick Track State from Home
  const [quickTrackId, setQuickTrackId] = useState(''); 
  const [homeTrackingInput, setHomeTrackingInput] = useState('');

  // Rate Calculator State
  const [rateTab, setRateTab] = useState<'international' | 'domestic'>('international');

  // Tracking Popup State
  const [trackingMode, setTrackingMode] = useState<'standard' | 'customs'>('standard');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Generic Popup State
  const [activePopup, setActivePopup] = useState<string | null>(null);

  // Background Image State
  const [bgError, setBgError] = useState(false);

  // Check URL params for Booking Window Mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'booking') {
        setCurrentView('booking_window');
        const l = params.get('lang') as Language;
        if(l) setLang(l);
    }
  }, []);

  // Preloading Logic
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const imageUrls = [
          `${import.meta.env.BASE_URL}assets/background.jpg`,
          BRAND_LOGO,
          `${import.meta.env.BASE_URL}assets/airplane.png`,
          `${import.meta.env.BASE_URL}assets/truck.png`,
          `${import.meta.env.BASE_URL}assets/warehouse.png`,
          `${import.meta.env.BASE_URL}assets/corporate-bg.jpg`
        ];

        const imagePromises = imageUrls.map((src) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve; // Continue even if error
          });
        });

        // Wait for fonts and images
        await Promise.all([
          document.fonts.ready,
          ...imagePromises
        ]);

      } catch (error) {
        console.error("Resource loading failed", error);
      } finally {
         // Minimum timeout to prevent flash
         setTimeout(() => setLoading(false), 2000);
      }
    };

    if (currentView !== 'booking_window') {
        preloadAssets();
    } else {
        setLoading(false);
    }
  }, [currentView]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Scroll to top when view or theme changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, theme]);

  const t = {
    heroTitleHighlight: lang === 'en' ? 'Connecting Palestine.' : 'نصل فلسطين بالعالم.',
    heroDesc: lang === 'en' ? 'We go beyond logistics — embedding our solutions into your supply chain to drive efficiency, visibility, and growth, while you stay focused on your core business.' : 'نحن نتخطى حدود الخدمات اللوجستية — ندمج حلولنا في سلسلة التوريد الخاصة بك لتحقيق الكفاءة والشفافية والنمو، بينما تركّز أنت على جوهر أعمالك.',
    trackBtn: lang === 'en' ? 'Track Shipment' : 'تتبع الشحنة',
    trackPlaceholder: lang === 'en' ? 'Enter Tracking Number' : 'أدخل رقم التتبع',
    quoteBtn: lang === 'en' ? 'Get Quote' : 'احصل على عرض سعر',
    pickupLabel: lang === 'en' ? 'Schedule Pickup' : 'جدولة استلام',
    ready: lang === 'en' ? 'Ready to get started?' : 'مستعد للبدء؟',
    createAccount: lang === 'en' ? 'Create an account today.' : 'أنشئ حساباً اليوم.',
    signUp: lang === 'en' ? 'Sign up for free' : 'سجل مجاناً',
    footerRights: lang === 'en' ? '© 2023 Wassel Logistics. All rights reserved.' : '© 2023 واصل للخدمات اللوجستية. جميع الحقوق محفوظة.',
    privacy: lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية',
    terms: lang === 'en' ? 'Terms of Service' : 'شروط الخدمة',
    contact: lang === 'en' ? 'Contact' : 'اتصل بنا',
    footerServices: lang === 'en' ? 'Services' : 'الخدمات',
    footerCorporate: lang === 'en' ? 'Corporate Solutions' : 'حلول الشركات',
    footerCompany: lang === 'en' ? 'Company' : 'الشركة',
    quickTools: lang === 'en' ? 'Quick Tools' : 'أدوات سريعة',
    ourServices: lang === 'en' ? 'Our Services' : 'خدماتنا',
    servicesDesc: lang === 'en' ? 'Tailored solutions for your personal shipping needs' : 'حلول مخصصة لاحتياجات الشحن الشخصية'
  };

  const footerData = {
    services: [
      { en: 'Parcel Clearance', ar: 'تخليص الطرود' },
      { en: 'International Express', ar: 'الشحن الدولي السريع' },
      { en: 'Domestic Shipping', ar: 'الشحن المحلي' },
      { en: 'Shop & Ship', ar: 'تسوق واستلم' }
    ],
    corporate: [
      { en: 'Daily Mail', ar: 'البريد اليومي' },
      { en: 'Document Signing', ar: 'توقيع المستندات' },
      { en: 'Bulk Distribution', ar: 'التوزيع بالجملة' },
      { en: 'Import & Export', ar: 'الإستيراد والتصدير' },
      { en: 'Storage', ar: 'التخزين' },
      { en: 'Warehouse Management', ar: 'إدارة المستودعات' },
      { en: 'Heavy Freight', ar: 'الشحن الثقيل' }
    ]
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('home');
  };

  const handleAction = (action: string) => {
    if (action === 'chat') {
        setIsChatOpen(!isChatOpen);
        if (activePopup === 'chat') {
             setActivePopup(null);
        } else {
             setActivePopup('chat');
        }
    } else {
        if (action === 'rates') {
            setRateTab('international');
        }
        if (action === 'tracking') {
            setTrackingMode('standard');
        }
        setActivePopup(action);
        setIsChatOpen(false); 
    }
  };

  // Helper to handle actions from ServiceDetail pages
  const handleServiceAction = (actionType: string, params?: any) => {
      switch(actionType) {
          case 'tracking-customs':
              setTrackingMode('customs');
              setActivePopup('tracking');
              break;
          case 'tracking':
              setTrackingMode('standard');
              setActivePopup('tracking');
              break;
          case 'pay':
              setPaymentParams(null); // Or preset if available
              setActivePopup('pay');
              break;
          case 'rates-international':
              setRateTab('international');
              setActivePopup('rates');
              break;
          case 'rates-domestic':
              setRateTab('domestic');
              setActivePopup('rates');
              break;
          case 'pickup':
              setActivePopup('pickup');
              break;
          case 'login':
              setCurrentView('login');
              break;
          case 'idp-flow':
              setActivePopup('idp-flow');
              break;
          case 'contact':
              setCurrentView('contact');
              break;
          default:
              break;
      }
  };

  // --- SPECIAL RENDER FOR BOOKING WINDOW (No Layout) ---
  if (currentView === 'booking_window') {
      const params = new URLSearchParams(window.location.search);
      const rateData = {
          provider: params.get('provider') || '' as any,
          service: params.get('service') || '',
          price: parseFloat(params.get('price') || '0'),
          currency: params.get('currency') || '',
          deliveryDate: params.get('deliveryDate') || '',
          weight: parseFloat(params.get('weight') || '0'),
          origin: params.get('origin') || '',
          destination: params.get('destination') || ''
      }; 
      return <BookingWindow lang={lang} initialRate={rateData} />;
  }

  // Determine effective theme logic
  const isCorporateMode = (theme === 'corporate' && currentView === 'home') || currentView.startsWith('service-corp-');
  const effectiveTheme = isCorporateMode ? 'corporate' : 'individuals';

  // Determine if the current view should be treated as a "Landing Page" (Transparent Header & Background)
  const isLandingPage = currentView === 'home' || currentView === 'handmade' || currentView === 'industries' || currentView === 'resources' || currentView === 'contact';

  const renderView = () => {
    // Specific Service Page Logic
    if (currentView.startsWith('service-')) {
        return <ServiceDetail serviceId={currentView} lang={lang} onAction={handleServiceAction} />;
    }

    switch (currentView) {
      case 'tracking':
        return <Tracking 
          lang={lang} 
          initialTrackingId={quickTrackId}
          onNavigateToPayment={(ref, service, billDetails) => {
            setPaymentParams({ ref, service, billDetails });
            setActivePopup('pay'); // Ensure popup switches to pay if tracking was in popup
            if (!activePopup) setCurrentView('payment-gateway'); // Or navigate if not popup
          }}
          isPopup={!!activePopup}
          mode={trackingMode}
          onContact={() => {
              setActivePopup(null);
              setCurrentView('contact');
          }}
        />;
      case 'rates':
        return <RateCalculator lang={lang} />;
      case 'pickup':
        return <Pickup lang={lang} />;
      case 'services':
        return <Services lang={lang} onNavigate={setCurrentView} />;
      case 'corporate':
        return <Corporate lang={lang} />;
      case 'handmade':
        return <Handmade lang={lang} />;
      case 'resources':
        return <Resources lang={lang} />;
      case 'latest_updates':
        return <LatestUpdates lang={lang} />;
      case 'industries':
        return <Industries lang={lang} />;
      case 'payment-gateway':
        return <PaymentGateway lang={lang} initialParams={paymentParams} />;
      case 'about':
        return <About lang={lang} />;
      case 'management':
        return <Management lang={lang} />;
      case 'contact':
        return <Contact lang={lang} />;
      case 'login':
        return <Login onLogin={handleLogin} lang={lang} />;
      case 'dashboard':
        return isLoggedIn ? <Dashboard lang={lang} /> : <Login onLogin={handleLogin} lang={lang} />;
      case 'home':
      default:
        // Conditional Home View based on Theme
        if (effectiveTheme === 'corporate') {
            return (
                <div className="animate-enter">
                    <Corporate lang={lang} />
                </div>
            );
        }

        // Default / Individuals Home
        return (
          <div className="flex flex-col flex-1 animate-enter relative">
            {/* --- GLOBAL HOME BACKGROUND IMAGE --- */}
            <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#002B49]">
                {!bgError ? (
                    <img 
                        src={`${import.meta.env.BASE_URL}assets/background.jpg`} 
                        alt="Background" 
                        className="w-full h-full object-cover object-top opacity-100"
                        onError={() => setBgError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-[#002B49]"></div>
                )}
            </div>

            {/* Hero Section */}
            <div className="relative z-10 bg-transparent overflow-hidden flex-1 min-h-[60vh] sm:min-h-[70vh] flex flex-col justify-center pt-32 lg:pt-44">
              
              {/* Subtle Pattern Background */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#002B49_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Floating Circles Background Effect */}
              <FloatingCircles />

              <div className="w-full max-w-[1920px] mx-auto relative z-10">
                <div className="relative pb-6 sm:pb-8 md:pb-10 lg:w-full lg:pb-12 xl:pb-14 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                  
                  <div className="max-w-4xl mx-auto pointer-events-auto">
                      <h1 className="text-5xl tracking-tight font-extrabold text-wassel-blue sm:text-6xl md:text-7xl leading-tight animate-slide-up mb-6">
                        <span className="block text-wassel-yellow xl:inline">{t.heroTitleHighlight}</span>
                      </h1>
                      <div className="max-w-2xl mx-auto mb-10">
                        <p className="text-lg text-white sm:text-xl md:text-2xl font-medium animate-slide-up delay-100 drop-shadow-md">
                            {t.heroDesc}
                        </p>
                      </div>

                      {/* Tracking box — sits directly below hero description */}
                      <div className="w-full max-w-3xl mx-auto animate-slide-up delay-200">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if(homeTrackingInput.trim()) {
                                setQuickTrackId(homeTrackingInput);
                                setTrackingMode('standard');
                                setActivePopup('tracking');
                            }
                        }}>
                            <div className="relative rounded-xl shadow-2xl bg-white transition-transform hover:scale-[1.01] duration-300">
                                <input
                                    type="text"
                                    className="block w-full rounded-xl border-0 py-6 pl-8 pr-40 sm:pr-56 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-wassel-yellow text-lg sm:text-2xl sm:leading-relaxed rtl:pr-8 rtl:pl-40 sm:rtl:pl-56"
                                    placeholder={t.trackPlaceholder}
                                    value={homeTrackingInput}
                                    onChange={(e) => setHomeTrackingInput(e.target.value)}
                                />
                                <div className="absolute inset-y-2 right-2 rtl:right-auto rtl:left-2 flex items-center">
                                    <button type="submit" className="h-full rounded-lg bg-wassel-blue px-6 sm:px-10 text-white font-bold text-lg hover:bg-wassel-darkBlue transition-colors flex items-center gap-3">
                                        <Package className="w-6 h-6" />
                                        <span className="hidden sm:inline">{t.trackBtn}</span>
                                    </button>
                                </div>
                            </div>
                        </form>

                        <p className="text-center mt-3 text-white font-medium text-sm sm:text-base animate-slide-up delay-300">
                             {lang === 'en' 
                                ? 'Insert your Domestic shipment or FedEx or DHL shipments or Passport No or Clearance No'
                                : 'أدخل رقم الشحنة المحلية أو شحنات FedEx أو DHL أو رقم الجواز أو رقم المعاملة الجمركية'}
                        </p>
                      </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        );
    }
  };

  // Theme based classes
  const footerBg = effectiveTheme === 'corporate' ? 'bg-corp-primary border-gray-600' : 'bg-wassel-blue border-gray-800';
  const footerText = 'text-gray-300';
  const footerHeading = 'text-white font-bold text-lg mb-6 border-b pb-2 inline-block md:block ' + (effectiveTheme === 'corporate' ? 'border-gray-600' : 'border-gray-700');
  const footerLink = `text-sm text-gray-400 transition-colors hover:pl-1 rtl:hover:pr-1 hover:${effectiveTheme === 'corporate' ? 'text-corp-secondary' : 'text-wassel-yellow'}`;

  // LOADING SCREEN
  if (loading) {
      return (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#002B49] text-white">
               <div className="w-24 h-24 mx-auto">
                   <div className="w-full h-full rounded-full border-4 border-[#FFCD00] border-t-transparent animate-spin"></div>
               </div>
               <h1 className="text-2xl font-bold tracking-widest text-white animate-pulse mt-4">WASSEL</h1>
               <p className="text-[#FFCD00] text-sm mt-2 font-medium tracking-wide uppercase">Logistics</p>
          </div>
      );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isLandingPage ? 'bg-transparent' : 'bg-white'} ${effectiveTheme === 'corporate' ? 'text-corp-primary' : 'text-wassel-blue'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout} 
        lang={lang} 
        setLang={setLang}
        theme={effectiveTheme}
        setTheme={setTheme}
      />
      {/* Key ensures animation replays on view change. Padding adjusted to account for header height without banner. */}
      {/* Remove padding-top for landing pages (Individuals & Corporate Home) so background sits behind header */}
      <main key={currentView + effectiveTheme} className={`animate-enter flex-1 flex flex-col ${isLandingPage ? 'bg-transparent pt-0' : 'pt-[116px] sm:pt-[148px]'} pb-20 md:pb-0`}>
        {renderView()}
      </main>
      
      {/* Floating Action Bar - Only show if NOT corporate and NOT in specific pages */}
      {effectiveTheme !== 'corporate' && !['about', 'management', 'contact'].includes(currentView) && (
        <FloatingActionBar 
          lang={lang}
          onAction={handleAction}
          activeAction={activePopup}
        />
      )}

      {/* Custom Chat Widget — driven by FloatingActionBar "Chat" button */}
      <ChatWidget
        lang={lang}
        externalOpen={isChatOpen}
        onExternalClose={() => {
          setIsChatOpen(false);
          if (activePopup === 'chat') setActivePopup(null);
        }}
      />

      {/* Legacy respond.io widget — only rendered when VITE_RESPONDIO_CHANNEL_ID is set */}
      {shouldRenderLegacyChatBot && (
        <ChatBot
          lang={lang}
          isOpen={false}
          onClose={() => {}}
        />
      )}

      {/* Generic Popup Modal */}
      {activePopup && activePopup !== 'chat' && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                 {/* Backdrop */}
                 <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => setActivePopup(null)}></div>
                 
                 <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                 {/* Modal Panel - SPECIAL HANDLING FOR IDP MODAL (It has its own styling, so we render it directly) */}
                 {activePopup === 'idp-flow' ? (
                     <div className="inline-block align-middle transform transition-all w-full max-w-2xl">
                         <IDPOrderModal lang={lang} onClose={() => setActivePopup(null)} />
                     </div>
                 ) : (
                     /* Default Modal Panel for other popups */
                     <div className="inline-block align-middle bg-white rounded-xl text-left rtl:text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-5xl w-full relative">
                         <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-10">
                             <button
                                onClick={() => setActivePopup(null)}
                                className="bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors"
                                aria-label={lang === 'en' ? 'Close modal' : 'إغلاق النافذة'}
                                title={lang === 'en' ? 'Close modal' : 'إغلاق النافذة'}
                             >
                                <X className="w-6 h-6 text-gray-500" />
                             </button>
                         </div>
                         <div className="px-1 py-6 sm:p-6 max-h-[85vh] overflow-y-auto">
                            {activePopup === 'tracking' && (
                                <Tracking 
                                    lang={lang} 
                                    initialTrackingId={quickTrackId} 
                                    isPopup={true}
                                    mode={trackingMode}
                                    onNavigateToPayment={(ref, service, billDetails) => {
                                        setPaymentParams({ ref, service, billDetails });
                                        setActivePopup('pay'); // Switch popup content to pay
                                    }}
                                    onContact={() => {
                                        setActivePopup(null);
                                        setCurrentView('contact');
                                    }}
                                />
                            )}
                            {activePopup === 'rates' && <RateCalculator lang={lang} isPopup={true} initialTab={rateTab} />}
                            {activePopup === 'pickup' && <Pickup lang={lang} isPopup={true} />}
                            {activePopup === 'pay' && <PaymentGateway lang={lang} initialParams={paymentParams} isPopup={true} />}
                         </div>
                     </div>
                 )}
            </div>
        </div>
      )}
    </div>
  );
};