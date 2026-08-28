import React, { useEffect, useRef, useState } from 'react';
import { Search, X, ArrowRight, Sparkles, Loader2, CornerDownLeft } from 'lucide-react';
import { Language } from '../../types';
import {
  suggestKbQuestions,
  getKbQuestionAnswer,
  getTrendingKbTopics,
  KbTopic,
  QuestionSuggestionItem,
} from '../../services/questionsKbService';
import { AssistantConversationTurn, getResourceSearchResponse } from '../../services/geminiService';
import { FormattedAnswer } from '../FormattedAnswer';

const ASSISTANT_CONVERSATION_STORAGE_KEY = 'assistant-search-conversation-id';
const RECENT_SEARCHES_STORAGE_KEY = 'wassel_recent_searches';

interface AiAnswerState {
  query: string;
  answer: string;
  relatedTopics: string[];
}

export interface AssistantSearchPaletteProps {
  lang: Language;
  onClose: () => void;
  /**
   * Called with the raw query before it's sent to the KB/AI. Return true if you handled it
   * yourself (e.g. redirecting a tracking-number query to a Tracking popup) — the palette
   * will close instead of running its normal search.
   */
  onInterceptQuery?: (query: string) => boolean;
  /**
   * Called instead of showing the inline AI answer when a KB suggestion is selected — e.g. the
   * Resources page navigates to the question's own permalink page instead of answering inline.
   */
  onSelectSuggestion?: (item: QuestionSuggestionItem) => void;
}

const resolveQueryLanguage = (input: string, lang: Language): 'ar' | 'en' => {
  if (/[؀-ۿ]/.test(input)) return 'ar';
  if (/[A-Za-z]/.test(input)) return 'en';
  return lang === 'ar' ? 'ar' : 'en';
};

export const AssistantSearchPalette: React.FC<AssistantSearchPaletteProps> = ({
  lang,
  onClose,
  onInterceptQuery,
  onSelectSuggestion,
}) => {
  const isAr = lang === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);
  const assistantConversationIdRef = useRef<string>('');

  const [searchValue, setSearchValue] = useState('');
  const [kbSuggestions, setKbSuggestions] = useState<QuestionSuggestionItem[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [aiTopicSuggestions, setAiTopicSuggestions] = useState<string[]>([]);

  const [aiAnswer, setAiAnswer] = useState<AiAnswerState | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [assistantHistory, setAssistantHistory] = useState<AssistantConversationTurn[]>([]);

  const [kbTopics, setKbTopics] = useState<KbTopic[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY) ?? '[]'); } catch { return []; }
  });

  const t = {
    title: isAr ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?',
    placeholder: isAr ? 'ابحث أو اسأل سؤالاً…' : 'Search or ask a question…',
    askAiLabel: isAr ? 'اسأل AI:' : 'Ask AI:',
    aiAnswerLabel: isAr ? 'إجابة AI — يرجى التحقق قبل التصرف' : 'AI Answer — verify before acting',
    suggestions: isAr ? 'اقتراحات' : 'Suggestions',
    aiTopicSuggestions: isAr ? 'اقتراحات AI' : 'AI Topic Suggestions',
    noSuggestions: isAr ? 'لا توجد اقتراحات. اضغط Enter لسؤال AI.' : 'No suggestions found. Press Enter to ask AI.',
    browseTopics: isAr ? 'تصفح المواضيع' : 'Browse topics',
    recentSearches: isAr ? 'عمليات البحث الأخيرة' : 'Recent searches',
    clear: isAr ? 'مسح' : 'Clear',
    close: isAr ? 'إغلاق' : 'Close',
    backToSearch: isAr ? 'العودة للبحث' : 'Back to search',
    navigate: isAr ? 'تنقل' : 'Navigate',
    select: isAr ? 'اختيار' : 'Select',
  };

  const getAssistantConversationId = (): string => {
    if (assistantConversationIdRef.current) return assistantConversationIdRef.current;
    const fromStorage = window.sessionStorage.getItem(ASSISTANT_CONVERSATION_STORAGE_KEY)?.trim() ?? '';
    if (fromStorage) {
      assistantConversationIdRef.current = fromStorage;
      return fromStorage;
    }
    const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem(ASSISTANT_CONVERSATION_STORAGE_KEY, generated);
    assistantConversationIdRef.current = generated;
    return generated;
  };

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, 5);
      try { localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((q) => q !== query);
      try { localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Start a fresh conversation each time the palette is opened (this component only exists
  // while open, so unmounting here means the palette was closed).
  useEffect(() => {
    return () => {
      window.sessionStorage.removeItem(ASSISTANT_CONVERSATION_STORAGE_KEY);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Load browse-topics chips once — top 7 by recent search volume
  useEffect(() => {
    getTrendingKbTopics(isAr ? 'ar' : 'en', 7).then(setKbTopics).catch(() => {});
  }, [isAr]);

  // Fetch KB suggestions as the user types (debounced), with an AI-topic fallback when empty
  useEffect(() => {
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
        const queryLang = resolveQueryLanguage(searchValue, lang);
        const items = await suggestKbQuestions(searchValue.trim(), queryLang);
        if (!cancelled) {
          setKbSuggestions(items);
          setActiveSuggestionIndex(-1);
          setAiTopicSuggestions([]);
        }

        if (items.length === 0 && searchValue.trim().length >= 4) {
          const aiFallback = await getResourceSearchResponse(searchValue.trim(), {
            conversationId: getAssistantConversationId(),
          });
          if (!cancelled) {
            setAiTopicSuggestions(Array.isArray(aiFallback.relatedTopics) ? aiFallback.relatedTopics.slice(0, 4) : []);
          }
        }
      } catch {
        if (!cancelled) setKbSuggestions([]);
      } finally {
        if (!cancelled) setKbLoading(false);
      }
    }, 280);

    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, lang]);

  const handleAskAi = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    if (onInterceptQuery?.(trimmedQuery)) {
      onClose();
      return;
    }

    const userTurn: AssistantConversationTurn = { role: 'user', content: trimmedQuery };
    const historyToSend = [...assistantHistory, userTurn];

    saveRecentSearch(trimmedQuery);
    setKbSuggestions([]);
    setAiAnswer(null);
    setAiLoading(true);
    setSearchValue('');

    try {
      const resp = await getResourceSearchResponse(trimmedQuery, {
        conversationId: getAssistantConversationId(),
        conversationHistory: historyToSend,
      });

      const assistantTurn: AssistantConversationTurn = { role: 'assistant', content: resp.answer };
      setAssistantHistory([...historyToSend, assistantTurn]);
      setAiAnswer({ query: trimmedQuery, answer: resp.answer, relatedTopics: resp.relatedTopics ?? [] });
    } catch {
      const fallbackAnswer = isAr
        ? 'عذراً، لم أتمكن من الوصول إلى قاعدة المعرفة حالياً.'
        : "Sorry, I couldn't reach the knowledge base right now.";
      const assistantTurn: AssistantConversationTurn = { role: 'assistant', content: fallbackAnswer };
      setAssistantHistory([...historyToSend, assistantTurn]);
      setAiAnswer({ query: trimmedQuery, answer: fallbackAnswer, relatedTopics: [] });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectKbSuggestion = async (item: QuestionSuggestionItem) => {
    saveRecentSearch(item.question);

    if (onSelectSuggestion) {
      onSelectSuggestion(item);
      return;
    }

    setSearchValue(item.question);
    setKbSuggestions([]);
    setAiAnswer(null);
    setAiLoading(true);
    try {
      const queryLang = resolveQueryLanguage(item.question, lang);
      const resp = await getKbQuestionAnswer(item.questionId, queryLang);
      setAiAnswer({ query: item.question, answer: resp.answer, relatedTopics: [] });
    } catch {
      setAiAnswer({
        query: item.question,
        answer: isAr ? 'عذراً، تعذر تحميل الإجابة حالياً.' : "Sorry, couldn't load the answer right now.",
        relatedTopics: [],
      });
    } finally {
      setAiLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchValue('');
    setKbSuggestions([]);
    setKbLoading(false);
    setActiveSuggestionIndex(-1);
    setAiTopicSuggestions([]);
    setAiAnswer(null);
    setAiLoading(false);
    setAssistantHistory([]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) void handleAskAi(searchValue.trim());
  };

  // Index 0 is the "Ask AI" row (when there's a query), followed by the KB suggestion rows.
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (aiAnswer || aiLoading) return;
    const hasQuery = searchValue.trim().length >= 2;
    if (!hasQuery) return;
    const selectableCount = 1 + kbSuggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % selectableCount);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev <= 0 ? selectableCount - 1 : prev - 1));
      return;
    }
    if (e.key === 'Enter' && activeSuggestionIndex >= 0 && activeSuggestionIndex < selectableCount) {
      e.preventDefault();
      if (activeSuggestionIndex === 0) {
        void handleAskAi(searchValue.trim());
        return;
      }
      const suggestion = kbSuggestions[activeSuggestionIndex - 1];
      if (suggestion) void handleSelectKbSuggestion(suggestion);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden animate-pop">
      {/* Input row */}
      <form onSubmit={handleSearchSubmit} className="relative border-b border-gray-200">
        {aiAnswer || aiLoading ? (
          <button
            type="button"
            aria-label={t.backToSearch}
            onClick={() => { setAiAnswer(null); setAiLoading(false); setKbSuggestions([]); setTimeout(() => inputRef.current?.focus(), 0); }}
            className="absolute left-5 rtl:right-5 rtl:left-auto top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
          >
            <ArrowRight className="w-7 h-7 rotate-180 rtl:rotate-0" />
          </button>
        ) : (
          <Search className="absolute left-5 rtl:right-5 rtl:left-auto top-1/2 -translate-y-1/2 text-indigo-500 w-7 h-7" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={t.placeholder}
          className="w-full py-5 pl-16 rtl:pl-4 rtl:pr-16 pr-14 text-[2rem] leading-tight text-gray-800 placeholder:text-indigo-300 outline-none bg-transparent"
          readOnly={aiLoading}
        />
        {searchValue && !aiLoading && (
          <button
            type="button"
            aria-label={t.clear}
            onMouseDown={(e) => e.preventDefault()}
            onClick={resetSearch}
            className="absolute right-16 rtl:left-16 rtl:right-auto top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-semibold px-3 py-2 z-10"
          >
            {t.clear}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t.close}
        >
          <X className="w-7 h-7" />
        </button>
      </form>

      {aiLoading && (
        <div role="status" aria-live="polite" className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm md:text-base font-semibold text-blue-800">
            {isAr ? 'جاري الإجابة على طلبك...' : 'Answering your request...'}
          </span>
        </div>
      )}

      {/* AI Answer Panel */}
      {aiAnswer && !aiLoading && (
        <div className="p-6 max-h-[48vh] overflow-y-auto">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">{t.aiAnswerLabel}</p>
          <h4 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{aiAnswer.query}</h4>
          <FormattedAnswer text={aiAnswer.answer} className="text-base" />
          {aiAnswer.relatedTopics.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              {aiAnswer.relatedTopics.map((topic, idx) => (
                <button
                  key={`${topic}-${idx}`}
                  type="button"
                  onClick={() => void handleAskAi(topic)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-wassel-blue hover:text-white transition-colors border border-gray-200"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KB Suggestions */}
      {!aiAnswer && !aiLoading && searchValue.trim().length >= 2 && (
        <div className="max-h-[45vh] overflow-y-auto">
          <button
            type="button"
            onClick={() => void handleAskAi(searchValue.trim())}
            className={`w-full text-left rtl:text-right flex items-center gap-3 px-5 py-4 border-b border-indigo-100 transition-colors ${
              activeSuggestionIndex === 0 ? 'bg-indigo-100' : 'bg-indigo-50 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            <span className="text-gray-600 text-base">{t.askAiLabel}</span>
            <span className="text-blue-700 font-semibold text-base">{searchValue.trim()}</span>
          </button>

          {(kbLoading || kbSuggestions.length > 0) && (
            <div className="px-5 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              {t.suggestions}
              {kbLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </div>
          )}

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
                  className={`w-full text-left rtl:text-right px-5 py-3 hover:bg-gray-50 transition-colors ${activeSuggestionIndex === index + 1 ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-base text-gray-900 font-medium line-clamp-2">{item.question}</p>
                </button>
              );
            });
            return elements;
          })()}

          {!kbLoading && kbSuggestions.length === 0 && (
            aiTopicSuggestions.length > 0 ? (
              <>
                <div className="px-5 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {t.aiTopicSuggestions}
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
              <p className="px-5 py-3 text-sm text-gray-400">{t.noSuggestions}</p>
            )
          )}
        </div>
      )}

      {/* Empty state: browse topics + recent searches */}
      {!aiAnswer && !aiLoading && searchValue.trim().length < 2 && kbTopics.length > 0 && (
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t.browseTopics}</div>
          <div className="flex flex-wrap gap-2">
            {kbTopics.map((topic) => (
              <button
                key={topic.code}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSearchValue(topic.name); setTimeout(() => inputRef.current?.focus(), 0); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!aiAnswer && !aiLoading && searchValue.trim().length < 2 && recentSearches.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="px-4 pt-4 pb-2 text-sm font-bold text-gray-700">{t.recentSearches}</div>
          {recentSearches.map((query) => (
            <div key={query} className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 group transition-colors">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSearchValue(query); setTimeout(() => inputRef.current?.focus(), 0); }}
                className="flex-1 text-left rtl:text-right text-base text-gray-800 truncate"
              >
                {query}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => removeRecentSearch(query)}
                className="text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div className="px-4 py-3 bg-gray-50 text-gray-500 text-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white text-gray-500">↓</span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white text-gray-500">↑</span>
          <span>{t.navigate}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 h-6 rounded border border-gray-300 bg-white text-gray-500 text-xs font-semibold">
            <CornerDownLeft className="w-3 h-3" />
          </span>
          <span>{t.select}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 h-6 rounded border border-gray-300 bg-white text-gray-500 text-xs font-semibold">ESC</span>
          <span>{t.close}</span>
        </div>
      </div>
    </div>
  );
};
