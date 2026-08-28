import React, { useState } from 'react';
import { MessageCircle, Package, Calculator, CreditCard, Sparkles, Search, Building2 } from 'lucide-react';
import { Language } from '../../types';
import { AssistantSearchPalette } from '../shared/AssistantSearchPalette';

interface FloatingActionBarProps {
    lang: Language;
    onAction: (action: string) => void;
    activeAction: string | null;
    chatUnreadCount?: number;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
    lang,
    onAction,
    activeAction,
    chatUnreadCount = 0,
}) => {
    // Temporary release toggles for floating shortcuts.
    const showQuickSearch = false;
    const showPayShortcut = false;

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const items = [
        {
            id: 'tracking',
            label: lang === 'en' ? 'Tracking' : 'تتبع',
            icon: Package,
            color: 'text-wassel-yellow'
        },
        {
            id: 'rates',
            label: lang === 'en' ? 'Rates' : 'أسعار',
            icon: Calculator,
            color: 'text-wassel-yellow'
        },
        {
            id: 'pay',
            label: lang === 'en' ? 'Pay' : 'ادفع',
            icon: CreditCard,
            color: 'text-wassel-yellow'
        },
        {
            id: 'chat',
            label: lang === 'en' ? 'Chat' : 'محادثة',
            icon: MessageCircle,
            color: 'text-wassel-yellow'
        },
        {
            id: 'assistant',
            label: lang === 'en' ? 'Assistant' : 'المساعدة',
            icon: Sparkles,
            color: 'text-wassel-yellow'
        },
        {
            id: 'open-account',
            label: lang === 'en' ? 'Open Account' : 'افتح حساب',
            icon: Building2,
            color: 'text-wassel-yellow'
        }
    ];

    const visibleItems = showPayShortcut ? items : items.filter((item) => item.id !== 'pay');

    return (
        <>
            {/* The Floating Bar */}
            <div className={`
                fixed z-[65]
                transition-all duration-500 ease-in-out
                /* MOBILE: Strict bottom bar — full width, flush to bottom */
                bottom-0 left-0 right-0 w-full
                /* DESKTOP: Bottom Left Vertical (Avoid Top Header Overlap) */
                md:left-6 md:right-auto md:w-auto md:bottom-12 md:top-auto md:translate-y-0
            `}>
                <div className={`
                    bg-wassel-darkBlue/95 backdrop-blur-md border border-white/10 shadow-2xl
                    rounded-t-2xl rounded-b-none md:rounded-2xl
                    p-2 sm:p-3 pb-safe
                    flex items-center justify-around md:justify-start gap-2 sm:gap-4
                    /* RESPONSIVE DIRECTION */
                    flex-row md:flex-col
                `}>
                    {/* Search Trigger Button */}
                    {showQuickSearch && (
                      <>
                        <button
                            type="button"
                            title={lang === 'en' ? 'Open quick search' : 'فتح البحث السريع'}
                            aria-label={lang === 'en' ? 'Open quick search' : 'فتح البحث السريع'}
                            onClick={() => setIsSearchOpen(true)}
                            className="group relative flex min-h-[56px] min-w-[56px] flex-col items-center justify-center sm:min-w-[64px] transition-all duration-300 hover:scale-105 opacity-90 hover:opacity-100"
                        >
                            <div className="p-2 transition-colors group-hover:bg-white/5 rounded-xl relative">
                                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                {/* AI Badge */}
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-wassel-darkBlue flex items-center gap-0.5 animate-pulse">
                                    <Sparkles size={8} className="text-yellow-200" />
                                    AI
                                </div>
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium mt-1 text-gray-300">
                                {lang === 'en' ? 'Search' : 'بحث'}
                            </span>
                        </button>

                        <div className="w-px h-8 md:w-8 md:h-px bg-white/10 mx-1 hidden sm:block"></div>
                      </>
                    )}

                    {visibleItems.map((item) => {
                        const isActive = activeAction === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                title={item.label}
                                aria-label={item.label}
                                data-quick-action={item.id}
                                onClick={() => {
                                    if (item.id === 'assistant') {
                                        setIsSearchOpen(true);
                                        return;
                                    }
                                    onAction(item.id);
                                }}
                                className={`
                                    group relative flex min-h-[56px] min-w-[56px] flex-col items-center justify-center
                                    sm:min-w-[64px]
                                    transition-all duration-300
                                    ${isActive ? 'scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100'}
                                `}
                            >
                                <div className={`
                                    relative p-2 rounded-xl transition-colors
                                    ${isActive ? 'bg-white/10' : 'group-hover:bg-white/5'}
                                `}>
                                    <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? item.color : 'text-white'}`} />
                                    {item.id === 'chat' && chatUnreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-wassel-darkBlue">
                                            {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] sm:text-xs font-medium mt-1 transition-colors ${isActive ? item.color : 'text-gray-300'}`}>
                                    {item.label}
                                </span>

                                {isActive && (
                                    <span className={`
                                        absolute w-1.5 h-1.5 rounded-full ${item.color.replace('text-', 'bg-')}
                                        -top-1 right-1 md:top-2 md:-right-2
                                    `}></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Assistant Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 animate-enter" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-wassel-darkBlue/90 backdrop-blur-xl transition-opacity"
                        onClick={() => setIsSearchOpen(false)}
                    />

                    <div className="relative w-full max-w-3xl z-10 flex flex-col items-center">
                        {/* Title */}
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center tracking-tight drop-shadow-lg animate-slide-up">
                            {lang === 'en' ? 'How can I help you?' : 'كيف يمكنني مساعدتك؟'}
                        </h2>

                        <AssistantSearchPalette lang={lang} onClose={() => setIsSearchOpen(false)} />
                    </div>
                </div>
            )}
        </>
    );
};
