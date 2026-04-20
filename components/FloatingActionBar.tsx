import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Package, Calculator, CreditCard, Truck, Search, X, Sparkles, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface FloatingActionBarProps {
    lang: Language;
    onAction: (action: string) => void;
    activeAction: string | null;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({ 
    lang, 
    onAction, 
    activeAction 
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when overlay opens
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isSearchOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsSearchOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(searchValue.trim()) {
            // Open Chat with the search query (Mock integration: just opens chat for now)
            onAction('chat');
            setIsSearchOpen(false);
            setSearchValue('');
        }
    };

    const suggestions = [
        { id: 'tracking', label: lang === 'en' ? 'Track a Shipment' : 'تتبع شحنة', icon: Package, desc: lang === 'en' ? 'Check status of your package' : 'تحقق من حالة طردك' },
        { id: 'rates', label: lang === 'en' ? 'Calculate Shipping Rates' : 'حاسبة الأسعار', icon: Calculator, desc: lang === 'en' ? 'Get quotes for domestic & intl' : 'احصل على أسعار المحلي والدولي' },
        { id: 'pickup', label: lang === 'en' ? 'Schedule Pickup' : 'طلب استلام', icon: Truck, desc: lang === 'en' ? 'We come to your door' : 'نأتي إلى بابك' },
        { id: 'chat', label: lang === 'en' ? 'Ask AI Assistant' : 'اسأل المساعد الذكي', icon: Sparkles, desc: lang === 'en' ? 'Get instant answers' : 'احصل على إجابات فورية' },
    ];

    const filteredSuggestions = searchValue 
        ? suggestions.filter(s => s.label.toLowerCase().includes(searchValue.toLowerCase()) || s.desc.toLowerCase().includes(searchValue.toLowerCase()))
        : suggestions;

    const items = [
        {
            id: 'chat',
            label: lang === 'en' ? 'Chat' : 'محادثة',
            icon: MessageCircle,
            color: 'text-orange-400'
        },
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
            color: 'text-green-400'
        },
        {
            id: 'pickup',
            label: lang === 'en' ? 'Pickup' : 'استلام',
            icon: Truck,
            color: 'text-purple-400'
        },
        {
            id: 'pay',
            label: lang === 'en' ? 'Pay' : 'ادفع',
            icon: CreditCard,
            color: 'text-blue-400'
        }
    ];

    return (
        <>
            {/* The Floating Bar */}
            <div className={`
                fixed z-40 
                transition-all duration-500 ease-in-out
                /* MOBILE: Bottom Center Horizontal */
                bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-[95vw]
                /* DESKTOP: Bottom Left Vertical (Avoid Top Header Overlap) */
                md:left-6 md:translate-x-0 md:bottom-12 md:top-auto md:translate-y-0 md:max-w-none
            `}>
                <div className={`
                    bg-wassel-darkBlue/95 backdrop-blur-md border border-white/10 shadow-2xl 
                    rounded-2xl
                    p-2 sm:p-3 
                    flex items-center gap-2 sm:gap-4
                    /* RESPONSIVE DIRECTION */
                    flex-row md:flex-col
                `}>
                    {/* Search Trigger Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="group relative flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px] transition-all duration-300 hover:scale-105 opacity-80 hover:opacity-100"
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

                    {items.map((item) => {
                        const isActive = activeAction === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onAction(item.id)}
                                className={`
                                    group relative flex flex-col items-center justify-center 
                                    min-w-[50px] sm:min-w-[60px] 
                                    transition-all duration-300 
                                    ${isActive ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}
                                `}
                            >
                                <div className={`
                                    p-2 rounded-xl transition-colors 
                                    ${isActive ? 'bg-white/10' : 'group-hover:bg-white/5'}
                                `}>
                                    <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? item.color : 'text-white'}`} />
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

            {/* Center Screen Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 animate-enter" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-wassel-darkBlue/90 backdrop-blur-xl transition-opacity"
                        onClick={() => setIsSearchOpen(false)}
                    ></div>

                    <div className="relative w-full max-w-4xl z-10 flex flex-col items-center">
                        {/* Title */}
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 text-center tracking-tight drop-shadow-lg animate-slide-up">
                            {lang === 'en' ? 'Search for anything and it will lead you' : 'ابحث عن أي شيء وسيقودك إليه'}
                        </h2>

                        {/* Close Button */}
                        <button 
                            onClick={() => setIsSearchOpen(false)}
                            className="absolute -top-24 right-0 rtl:left-0 rtl:right-auto text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Search Input Container */}
                        <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-pop">
                            <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-gray-100 p-2 md:p-3">
                                <Search className="w-8 h-8 text-gray-400 absolute left-6 rtl:right-6 rtl:left-auto" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full py-6 pl-20 rtl:pr-20 rtl:pl-6 pr-6 text-2xl md:text-3xl font-medium text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent"
                                    placeholder={lang === 'en' ? 'What are you looking for?' : 'عن ماذا تبحث؟'}
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                />
                                {searchValue && (
                                    <button 
                                        type="button" 
                                        onClick={() => setSearchValue('')}
                                        className="absolute right-6 rtl:left-6 rtl:right-auto text-gray-300 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                )}
                            </form>

                            {/* Suggestions / Results */}
                            <div className="max-h-[50vh] overflow-y-auto bg-gray-50/50">
                                {searchValue && (
                                    <div 
                                        onClick={() => { onAction('chat'); setIsSearchOpen(false); }}
                                        className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors flex items-center gap-5 group"
                                    >
                                        <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-indigo-900 text-xl flex items-center gap-2">
                                                {lang === 'en' ? 'Ask Wassel AI' : 'اسأل واصل AI'}
                                                <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                                            </h4>
                                            <p className="text-indigo-700 text-base mt-1">
                                                {lang === 'en' ? 'Get instant answers about' : 'احصل على إجابات فورية حول'} "{searchValue}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3">
                                    <h3 className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {searchValue ? (lang === 'en' ? 'Suggestions' : 'اقتراحات') : (lang === 'en' ? 'Quick Actions' : 'إجراءات سريعة')}
                                    </h3>
                                    <div className="space-y-1">
                                        {filteredSuggestions.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => { onAction(item.id); setIsSearchOpen(false); }}
                                                className="w-full flex items-center gap-5 p-5 hover:bg-white hover:shadow-md rounded-2xl transition-all group text-left rtl:text-right"
                                            >
                                                <div className="p-4 bg-white border border-gray-100 rounded-xl group-hover:bg-wassel-blue group-hover:text-white transition-colors text-gray-500">
                                                    <item.icon className="w-7 h-7" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-wassel-blue transition-colors">
                                                        {item.label}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                                <div className="ml-auto rtl:mr-auto rtl:ml-0 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 rtl:translate-x-[10px] rtl:group-hover:translate-x-0 duration-300">
                                                    <ArrowRight className="w-6 h-6 text-gray-400 rtl:rotate-180" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {filteredSuggestions.length === 0 && (
                                        <div className="p-10 text-center text-gray-500">
                                            <p className="text-lg">{lang === 'en' ? 'No direct services found.' : 'لا توجد خدمات مباشرة.'}</p>
                                            <p className="text-sm mt-2">{lang === 'en' ? 'Try asking the AI Assistant above.' : 'حاول سؤال المساعد الذكي أعلاه.'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};