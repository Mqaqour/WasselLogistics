import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Package, Calculator, CreditCard, Truck, Search, X, Sparkles, ArrowRight, Loader2, CornerDownLeft } from 'lucide-react';
import { Language } from '../../types';
import { suggestKbQuestions, getKbQuestionAnswer, QuestionSuggestionItem } from '../../services/questionsKbService';
import { getResourceSearchResponse } from '../../services/geminiService';
import { FormattedAnswer } from '../FormattedAnswer';

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
    // Temporary release toggles for floating shortcuts.
    const showQuickSearch = false;
    const showPayShortcut = false;

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // KB suggestions state
    const [kbSuggestions, setKbSuggestions] = useState<QuestionSuggestionItem[]>([]);
    const [kbLoading, setKbLoading] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [aiTopicSuggestions, setAiTopicSuggestions] = useState<string[]>([]);

    // AI answer state
    const [aiAnswer, setAiAnswer] = useState<{ query: string; answer: string } | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const resetSearch = () => {
        setSearchValue('');
        setKbSuggestions([]);
        setKbLoading(false);
        setActiveSuggestionIndex(-1);
        setAiTopicSuggestions([]);
        setAiAnswer(null);
        setAiLoading(false);
    };

    const closeOverlay = () => {
        setIsSearchOpen(false);
        resetSearch();
    };

    // Focus input when overlay opens
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isSearchOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeOverlay();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Fetch KB suggestions as user types (debounced)
    useEffect(() => {
        if (!isSearchOpen) return;
        if (searchValue.trim().length < 2) {
            setKbSuggestions([]);
            setKbLoading(false);
            setActiveSuggestionIndex(-1);
            setAiTopicSuggestions([]);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setKbLoading(true);
            try {
                const queryLang = /[\u0600-\u06FF]/.test(searchValue) ? 'ar' : lang === 'ar' ? 'ar' : 'en';
                const items = await suggestKbQuestions(searchValue.trim(), queryLang);
                if (!cancelled) {
                    setKbSuggestions(items);
                    setActiveSuggestionIndex(-1);
                    setAiTopicSuggestions([]);
                }

                // Fallback: show AI-related topic suggestions when KB has no direct matches.
                if (items.length === 0 && searchValue.trim().length >= 4) {
                    const aiFallback = await getResourceSearchResponse(searchValue.trim());
                    if (!cancelled) {
                        setAiTopicSuggestions(Array.isArray(aiFallback.relatedTopics) ? aiFallback.relatedTopics.slice(0, 4) : []);
                    }
                }
            } catch {
                if (!cancelled) {
                    setKbSuggestions([]);
                    try {
                        const aiFallback = await getResourceSearchResponse(searchValue.trim());
                        if (!cancelled) {
                            setAiTopicSuggestions(Array.isArray(aiFallback.relatedTopics) ? aiFallback.relatedTopics.slice(0, 4) : []);
                        }
                    } catch {
                        if (!cancelled) setAiTopicSuggestions([]);
                    }
                }
            } finally {
                if (!cancelled) setKbLoading(false);
            }
        }, 280);

        return () => { cancelled = true; clearTimeout(timer); };
    }, [searchValue, isSearchOpen, lang]);

    const handleSelectKbSuggestion = async (item: QuestionSuggestionItem) => {
        setSearchValue(item.question);
        setKbSuggestions([]);
        setAiAnswer(null);
        setAiLoading(true);
        try {
            const queryLang = /[\u0600-\u06FF]/.test(item.question) ? 'ar' : 'en';
            const resp = await getKbQuestionAnswer(item.questionId, queryLang);
            setAiAnswer({ query: item.question, answer: resp.answer });
        } catch {
            setAiAnswer({ query: item.question, answer: lang === 'en' ? "Sorry, couldn't load the answer right now." : 'عذراً، تعذر تحميل الإجابة حالياً.' });
        } finally {
            setAiLoading(false);
        }
    };

    const handleAskAi = async (query: string) => {
        if (!query.trim()) return;
        setKbSuggestions([]);
        setAiAnswer(null);
        setAiLoading(true);
        try {
            const resp = await getResourceSearchResponse(query);
            setAiAnswer({ query, answer: resp.answer });
        } catch {
            setAiAnswer({ query, answer: lang === 'en' ? "Sorry, I couldn't reach the knowledge base right now." : 'عذراً، لم أتمكن من الوصول إلى قاعدة المعرفة حالياً.' });
        } finally {
            setAiLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchValue.trim()) {
            void handleAskAi(searchValue.trim());
        }
    };

    // Quick-action chips (unchanged look)
    const quickActions = [
        { id: 'tracking', label: lang === 'en' ? 'Track a Shipment' : 'تتبع شحنة', icon: Package },
        { id: 'rates',    label: lang === 'en' ? 'Shipping Rates'   : 'أسعار الشحن',  icon: Calculator },
        { id: 'pickup',   label: lang === 'en' ? 'Schedule Pickup'  : 'طلب استلام',   icon: Truck },
    ];

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
        },
        {
            id: 'chat',
            label: lang === 'en' ? 'Chat' : 'محادثة',
            icon: MessageCircle,
            color: 'text-orange-400'
        },
        {
            id: 'assistant',
            label: lang === 'en' ? 'Assistant' : 'المساعدة',
            icon: Sparkles,
            color: 'text-cyan-300'
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

            {/* Assistant Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 animate-enter" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-wassel-darkBlue/90 backdrop-blur-xl transition-opacity"
                        onClick={closeOverlay}
                    />

                    <div className="relative w-full max-w-3xl z-10 flex flex-col items-center">
                        {/* Title */}
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center tracking-tight drop-shadow-lg animate-slide-up">
                            {lang === 'en' ? 'How can I help you?' : 'كيف يمكنني مساعدتك؟'}
                        </h2>

                        {/* Close Button */}
                        <button
                            type="button"
                            aria-label={lang === 'en' ? 'Close assistant search' : 'إغلاق البحث'}
                            onClick={closeOverlay}
                            className="absolute -top-20 right-0 rtl:left-0 rtl:right-auto text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Search card */}
                        <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-pop">

                            {/* Input row */}
                            <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-gray-100">
                                {aiAnswer || aiLoading ? (
                                    <button
                                        type="button"
                                        aria-label={lang === 'en' ? 'Back to search' : 'العودة للبحث'}
                                        onClick={() => { setAiAnswer(null); setAiLoading(false); setKbSuggestions([]); setTimeout(() => inputRef.current?.focus(), 0); }}
                                        className="absolute left-5 rtl:right-5 rtl:left-auto text-blue-600 hover:text-blue-700"
                                    >
                                        <ArrowRight className="w-6 h-6 rotate-180 rtl:rotate-0" />
                                    </button>
                                ) : (
                                    <Search className="absolute left-5 rtl:right-5 rtl:left-auto text-indigo-400 w-6 h-6" />
                                )}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => { setSearchValue(e.target.value); setAiAnswer(null); }}
                                    placeholder={lang === 'en' ? 'Search or ask a question…' : 'ابحث أو اسأل سؤالاً…'}
                                    className="w-full py-5 pl-14 rtl:pr-14 rtl:pl-10 pr-14 text-xl md:text-2xl text-gray-800 placeholder-gray-300 focus:outline-none bg-transparent"
                                    readOnly={aiLoading}
                                />
                                {searchValue && !aiLoading && (
                                    <button
                                        type="button"
                                        aria-label={lang === 'en' ? 'Clear search' : 'مسح البحث'}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={resetSearch}
                                        className="absolute right-5 rtl:left-5 rtl:right-auto text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </form>

                            {/* AI Answer Panel */}
                            {(aiAnswer || aiLoading) && (
                                <div className="p-5 max-h-[45vh] overflow-y-auto">
                                    {aiLoading ? (
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {lang === 'en' ? 'Answering…' : 'جاري الإجابة…'}
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                                                {lang === 'en' ? 'AI Answer — verify before acting' : 'إجابة AI — يرجى التحقق قبل التصرف'}
                                            </p>
                                            <h4 className="text-lg font-bold text-gray-900 mb-3">{aiAnswer?.query}</h4>
                                            <FormattedAnswer text={aiAnswer?.answer ?? ''} className="text-base" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* KB Suggestions */}
                            {!aiAnswer && !aiLoading && searchValue.trim().length >= 2 && (
                                <div className="max-h-[45vh] overflow-y-auto">
                                    {/* Ask AI row */}
                                    <button
                                        type="button"
                                        onClick={() => void handleAskAi(searchValue.trim())}
                                        className="w-full text-left rtl:text-right flex items-center gap-3 px-5 py-4 bg-indigo-50 hover:bg-indigo-100 border-b border-indigo-100 transition-colors"
                                    >
                                        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                                        <span className="text-gray-600 text-base">{lang === 'en' ? 'Ask AI:' : 'اسأل AI:'}</span>
                                        <span className="text-blue-700 font-semibold text-base">{searchValue.trim()}</span>
                                    </button>

                                    {/* Suggestions label */}
                                    {(kbLoading || kbSuggestions.length > 0) && (
                                        <div className="px-5 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            {lang === 'en' ? 'Suggestions' : 'اقتراحات'}
                                            {kbLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        </div>
                                    )}

                                    {/* Suggestion rows grouped by topic */}
                                    {!kbLoading && (() => {
                                        const elements: React.ReactNode[] = [];
                                        let lastTopic = '';
                                        kbSuggestions.forEach((item, index) => {
                                            if (item.topicName !== lastTopic) {
                                                lastTopic = item.topicName;
                                                elements.push(
                                                    <div key={`topic-${item.topicName}-${index}`} className="px-5 pt-3 pb-1 text-xs font-bold text-gray-300 uppercase tracking-widest">
                                                        {item.topicName}
                                                    </div>
                                                );
                                            }
                                            elements.push(
                                                <button
                                                    key={item.questionId}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => void handleSelectKbSuggestion(item)}
                                                    className={`w-full text-left rtl:text-right px-5 py-3 hover:bg-gray-50 transition-colors ${activeSuggestionIndex === index ? 'bg-blue-50' : ''}`}
                                                >
                                                    <p className="text-base text-gray-900 font-medium line-clamp-2">{item.question}</p>
                                                </button>
                                            );
                                        });
                                        return elements;
                                    })()}

                                    {!kbLoading && kbSuggestions.length === 0 && (
                                        <>
                                            {aiTopicSuggestions.length > 0 ? (
                                                <>
                                                    <div className="px-5 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                        {lang === 'en' ? 'AI Topic Suggestions' : 'اقتراحات AI'}
                                                    </div>
                                                    {aiTopicSuggestions.map((topic, index) => (
                                                        <button
                                                            key={`${topic}-${index}`}
                                                            type="button"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => void handleAskAi(topic)}
                                                            className="w-full text-left rtl:text-right px-5 py-3 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <p className="text-base text-gray-900 font-medium line-clamp-2">{topic}</p>
                                                        </button>
                                                    ))}
                                                </>
                                            ) : (
                                                <p className="px-5 py-3 text-sm text-gray-400">
                                                    {lang === 'en' ? 'No suggestions found. Press Enter to ask AI.' : 'لا توجد اقتراحات. اضغط Enter لسؤال AI.'}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Empty state: quick action chips */}
                            {!aiAnswer && !aiLoading && searchValue.trim().length < 2 && (
                                <div className="p-4 flex flex-wrap gap-2">
                                    {quickActions.map((a) => (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => { onAction(a.id); closeOverlay(); }}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:border-wassel-blue hover:text-wassel-blue transition-colors"
                                        >
                                            <a.icon className="w-4 h-4" />
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Footer hint */}
                            <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 bg-white font-mono">
                                        <CornerDownLeft className="w-3 h-3" />
                                    </span>
                                    {lang === 'en' ? 'Ask AI' : 'اسأل AI'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-white font-mono">ESC</span>
                                    {lang === 'en' ? 'Close' : 'إغلاق'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};