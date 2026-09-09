import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Navbar,
  Tracking,
  RateCalculator,
  Pickup,
  Dashboard,
  Login,
  KnowledgeBaseAdmin,
  SystemSettings,
  ChatBot,
  Resources,
  About,
  FloatingActionBar,
  Contact,
  FloatingCircles,
  IDPOrderModal,
  BusinessAccountModal,
  BusinessAccountRequests,
  NotifyMeModal,
  QuoteRequestModal,
  BookingWindow,
  Maintenance,
  MaintenanceConfig,
} from './components';
import { ChatWidget } from './components/chat/ChatWidget';
import { Seo } from './components/Seo';
import { getPageSeo } from './seo/pageMeta';
import { useTypewriter } from './hooks/useTypewriter';
import { adminFetch, clearAdminToken } from './services/adminApi';
import { PageView, Language } from './types';
import { Package, X, Truck, Plane, IdCard, FileCheck, Ship, Container } from 'lucide-react';

// Icons for the home tracking button, synced by index to trackPlaceholderWords below
const TRACK_ICONS = [Package, Plane, Truck, IdCard, FileCheck, Ship, Container];

const BRAND_LOGO = `${import.meta.env.BASE_URL}assets/Wassel logo-01.png`;

export const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const localeFromPath = useMemo<Language | null>(() => {
    const firstSegment = location.pathname.split('/').filter(Boolean)[0];
    if (firstSegment === 'ar' || firstSegment === 'en') {
      return firstSegment;
    }
    return null;
  }, [location.pathname]);

  const pathnameWithoutLocale = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const segments = path.split('/').filter(Boolean);
    if (segments[0] === 'ar' || segments[0] === 'en') {
      const stripped = `/${segments.slice(1).join('/')}`;
      return stripped === '/' ? '/' : stripped.replace(/\/+$/, '');
    }
    return path;
  }, [location.pathname]);

  const respondIoChannelId = import.meta.env.VITE_RESPONDIO_CHANNEL_ID?.trim();
  const shouldRenderLegacyChatBot = Boolean(respondIoChannelId);

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('wsl_logged_in') === '1');
  const [lang, setLang] = useState<Language>(() => {
    const firstSegment = window.location.pathname.split('/').filter(Boolean)[0];
    return firstSegment === 'en' || firstSegment === 'ar' ? firstSegment : 'ar';
  });

  const viewToPath = useMemo<Record<PageView, string>>(() => ({
    home: '/',
    tracking: '/tracking',
    rates: '/rates',
    pickup: '/pickup',
    login: '/login',
    dashboard: '/dashboard',
    contact: '/contact',
    resources: '/resources',
    about: '/about',
    booking_window: '/booking',
    'kb-admin': '/admin/kb',
    'system-settings': '/admin/settings',
    'business-accounts': '/admin/business-accounts',
  }), []);

  const currentView = useMemo<PageView>(() => {
    const path = pathnameWithoutLocale || '/';

    if (path === '/resources' || path.startsWith('/resources/')) {
      return 'resources';
    }

    const pathToView: Record<string, PageView> = {
      '/': 'home',
      '/tracking': 'tracking',
      '/rates': 'rates',
      '/pickup': 'pickup',
      '/login': 'login',
      '/dashboard': 'dashboard',
      '/admin/kb': 'kb-admin',
      '/admin/settings': 'system-settings',
      '/admin/business-accounts': 'business-accounts',
      '/contact': 'contact',
      '/about': 'about',
      '/booking': 'booking_window',
    };

    return pathToView[path] ?? 'home';
  }, [pathnameWithoutLocale]);

  const setCurrentView = useCallback((view: PageView) => {
    const nextPath = viewToPath[view] ?? '/';
    const localizedPath = `/${lang}${nextPath === '/' ? '' : nextPath}`;
    if (localizedPath !== location.pathname) {
      navigate(localizedPath);
    }
  }, [navigate, location.pathname, viewToPath, lang]);

  const handleSetLang = useCallback((nextLang: Language) => {
    const basePath = pathnameWithoutLocale === '/' ? '' : pathnameWithoutLocale;
    const localizedPath = `/${nextLang}${basePath}`;
    const target = `${localizedPath}${location.search}`;

    setLang(nextLang);
    if (target !== `${location.pathname}${location.search}`) {
      navigate(target);
    }
  }, [pathnameWithoutLocale, location.search, location.pathname, navigate]);

  useEffect(() => {
    if (localeFromPath && localeFromPath !== lang) {
      setLang(localeFromPath);
    }
  }, [localeFromPath, lang]);
  
  // Quick Track State from Home
  const [quickTrackId, setQuickTrackId] = useState('');
  const [homeTrackingInput, setHomeTrackingInput] = useState('');

  // Deep-link tracking number, e.g. /tracking?awb=4094459143 — used for SMS/email links sent to customers.
  const urlTrackingId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('awb') || params.get('trackingNumber') || '';
  }, [location.search]);

  // Typewriter placeholder for the home tracking box — types, pauses, backspaces, then moves to the next word
  const trackPlaceholderWords = useMemo(() => ({
    ar: ['واصل', 'فيديكس', 'دي اتش ال', 'جواز السفر', 'المعاملة الجمركية', 'الشحن البحري', 'الكونتينر'],
    en: ['Wassel', 'FedEx', 'DHL', 'Passport', 'Customs Transaction', 'Sea Freight', 'Container'],
  }), []);
  const trackPlaceholderTypewriter = useTypewriter(lang === 'en' ? trackPlaceholderWords.en : trackPlaceholderWords.ar);
  const trackPlaceholderTypedWord = trackPlaceholderTypewriter.text;
  const TrackButtonIcon = TRACK_ICONS[trackPlaceholderTypewriter.index % TRACK_ICONS.length];

  // Rate Calculator State
  const [rateTab, setRateTab] = useState<'international' | 'domestic'>('international');

  // Tracking Popup State
  const [trackingMode, setTrackingMode] = useState<'standard' | 'customs'>('standard');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Generic Popup State
  const [activePopup, setActivePopup] = useState<string | null>(null);

  // Background Image State
  const [bgError, setBgError] = useState(false);

  // Maintenance / "under construction" takeover — driven by public/maintenance.json
  // so ops can flip it without a rebuild. Null until the flag is fetched.
  const [maintenance, setMaintenance] = useState<MaintenanceConfig | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}maintenance.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data && typeof data === 'object') setMaintenance(data as MaintenanceConfig); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Keep legacy booking query support while routing to /booking
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryLang = params.get('lang');
    if (queryLang === 'ar' || queryLang === 'en') {
      setLang(queryLang);
    }

    if (params.get('mode') === 'booking' && currentView !== 'booking_window') {
      navigate(`/${lang}/booking${location.search}`, { replace: true });
    }
  }, [location.search, currentView, navigate, lang]);

  // Preloading Logic
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const imageUrls = [
          `${import.meta.env.BASE_URL}assets/background.png`,
          BRAND_LOGO,
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

  // Scroll to top when the view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const t = {
    heroTitleHighlight: lang === 'en' ? 'Connecting Palestine.' : 'نصل فلسطين بالعالم.',
    heroDesc: lang === 'en' ? 'We build smarter, more efficient, and more transparent supply chains — connecting you to the world.' : 'نبني سلاسل توريد أكثر ذكاءً وكفاءة وشفافية، لنصلك بالعالم.',
    trackBtn: lang === 'en' ? 'Track' : 'تتبع',
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('wsl_logged_in', '1');
    setCurrentView('dashboard');
  };

  const handleLogout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    clearAdminToken();
    setIsLoggedIn(false);
    sessionStorage.removeItem('wsl_logged_in');
    setCurrentView('home');
  }, [setCurrentView]);

  // Validate a restored session against the backend; drop it if the token is gone/expired.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    adminFetch('/api/auth/me')
      .then((r: Response) => { if (!cancelled && r.status === 401) handleLogout(); })
      .catch(() => {});
    return () => { cancelled = true; };
    // Run once on mount for a restored session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // MAINTENANCE TAKEOVER — shown to customers only. Logged-in staff and the
  // /admin and /login routes keep working so the site can be managed while it's on.
  const maintenanceBypass =
    isLoggedIn ||
    /\/(admin|login)(\/|$)/.test(pathnameWithoutLocale) ||
    new URLSearchParams(location.search).has('nomaintenance');
  const showMaintenance = Boolean(maintenance?.enabled) && !maintenanceBypass;
  if (showMaintenance) {
    return <Maintenance lang={lang} config={maintenance} />;
  }

  // --- SPECIAL RENDER FOR BOOKING WINDOW (No Layout) ---
  if (currentView === 'booking_window') {
      const params = new URLSearchParams(location.search);
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

  // Determine if the current view should be treated as a "Landing Page" (Transparent Header & Background)
  const isLandingPage = currentView === 'home' || currentView === 'resources' || currentView === 'contact' || currentView === 'about';

  const renderView = () => {
    switch (currentView) {
      case 'tracking':
        return <Tracking
          lang={lang}
          initialTrackingId={quickTrackId || urlTrackingId}
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
      case 'resources':
        return <Resources
          lang={lang}
          onTrack={(id) => { setQuickTrackId(id); setTrackingMode('standard'); setActivePopup('tracking'); }}
          onAction={handleAction}
        />;
      case 'contact':
        return <Contact lang={lang} />;
      case 'about':
        return <About lang={lang} onAction={handleAction} />;
      case 'login':
        return <Login onLogin={handleLogin} lang={lang} />;
      case 'dashboard':
        return isLoggedIn ? <Dashboard lang={lang} /> : <Login onLogin={handleLogin} lang={lang} />;
      case 'kb-admin':
        return isLoggedIn ? <KnowledgeBaseAdmin lang={lang} /> : <Login onLogin={handleLogin} lang={lang} />;
      case 'system-settings':
        return isLoggedIn ? <SystemSettings lang={lang} /> : <Login onLogin={handleLogin} lang={lang} />;
      case 'business-accounts':
        return isLoggedIn ? <BusinessAccountRequests lang={lang} /> : <Login onLogin={handleLogin} lang={lang} />;
      case 'home':
      default:
        return (
          <div className="flex flex-col flex-1 animate-enter relative">
            {/* --- GLOBAL HOME BACKGROUND IMAGE --- */}
            <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#002B49]">
                {!bgError ? (
                    <img
                        src={`${import.meta.env.BASE_URL}assets/background.png`}
                        alt=""
                        aria-hidden="true"
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
                                    placeholder={lang === 'en'
                                        ? `Enter tracking number for ${trackPlaceholderTypedWord}|`
                                        : `ادخل رقم تتبع ${trackPlaceholderTypedWord}|`}
                                    value={homeTrackingInput}
                                    onChange={(e) => setHomeTrackingInput(e.target.value)}
                                />
                                <div className="absolute inset-y-2 right-2 rtl:right-auto rtl:left-2 flex items-center">
                                    <button type="submit" className="h-full rounded-lg bg-wassel-blue px-6 sm:px-10 text-white font-bold text-lg hover:bg-wassel-darkBlue transition-colors flex items-center gap-3">
                                        <TrackButtonIcon className="w-6 h-6" />
                                        <span className="hidden sm:inline">{t.trackBtn}</span>
                                    </button>
                                </div>
                            </div>
                        </form>

                      </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        );
    }
  };


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
    <div className={`min-h-screen flex flex-col ${isLandingPage ? 'bg-transparent' : 'bg-white'} text-wassel-blue`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Seo {...getPageSeo(currentView, lang)} />
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        lang={lang}
        setLang={handleSetLang}
      />
      {/* Key ensures animation replays on view change. Padding removed for landing pages so the background sits behind the header. */}
      <main key={currentView} className={`animate-enter flex-1 flex flex-col ${isLandingPage ? 'bg-transparent pt-0' : 'pt-[116px] sm:pt-[148px]'} pb-20 md:pb-0`}>
        {renderView()}
      </main>

      {/* Floating Action Bar — hidden on the contact and resources pages */}
      {!['contact', 'resources'].includes(currentView) && (
        <FloatingActionBar
          lang={lang}
          onAction={handleAction}
          activeAction={activePopup}
          chatUnreadCount={chatUnreadCount}
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
        onUnreadChange={setChatUnreadCount}
      />

      {/* Legacy respond.io widget — only rendered when VITE_RESPONDIO_CHANNEL_ID is set */}
      {shouldRenderLegacyChatBot && (
        <ChatBot
          lang={lang}
          isOpen={false}
          onClose={() => {}}
        />
      )}

      {/* Self-contained overlay modals — launched from the floating bar / Resources tools */}
      {activePopup === 'open-account' && (
        <BusinessAccountModal lang={lang} onClose={() => setActivePopup(null)} />
      )}
      {activePopup === 'notify' && (
        <NotifyMeModal lang={lang} onClose={() => setActivePopup(null)} initialTrackingNumber={quickTrackId} />
      )}
      {activePopup === 'quote' && (
        <QuoteRequestModal lang={lang} onClose={() => setActivePopup(null)} />
      )}

      {/* Generic Popup Modal */}
      {activePopup && !['chat', 'open-account', 'notify', 'quote'].includes(activePopup) && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                 {/* Backdrop — click-outside intentionally does NOT close the modal; use the X button. */}
                <div className="fixed inset-0 bg-gray-900/70 transition-opacity backdrop-blur-md"></div>
                 
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
                                    initialTrackingId={quickTrackId || urlTrackingId}
                                    isPopup={true}
                                    mode={trackingMode}
                                    onContact={() => {
                                        setActivePopup(null);
                                        setCurrentView('contact');
                                    }}
                                />
                            )}
                            {activePopup === 'rates' && <RateCalculator lang={lang} isPopup={true} initialTab={rateTab} />}
                            {activePopup === 'pickup' && <Pickup lang={lang} isPopup={true} />}
                         </div>
                     </div>
                 )}
            </div>
        </div>
      )}
    </div>
  );
};