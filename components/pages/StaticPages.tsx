import React, { useState } from 'react';
import { Language } from '../../types';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2, Globe, AlertTriangle, MessageCircle } from 'lucide-react';
import { getResourceSearchResponse } from '../../services/geminiService';
import { suggestKbQuestions, getKbQuestionAnswer } from '../../services/questionsKbService';

interface PageProps {
  lang: Language;
}

type ContactFormData = {
    topic: string;
    name: string;
    mobile: string;
    email: string;
    message: string;
    trackingNumber: string;
    passportNumber: string;
};

type ContactAiSuggestion = {
    answer: string;
    relatedTopics: string[];
};

type ContactSuggestionResult = {
    suggestion: ContactAiSuggestion;
    logId: number;
};

export const About: React.FC<PageProps> = ({ lang }) => {
  const t = {
    title: lang === 'en' ? 'About Us' : 'من نحن',
    intro: lang === 'en'
      ? 'Delivering a smarter courier experience since 2005.'
      : 'منذ انطلاقنا في العام 2005، نقدم لزبائننا حلولاً ذكية لخدمات التوصيل السريع.',
    p1: lang === 'en'
      ? 'We provide a comprehensive suite of logistics services, including local and international transport and shipping, regular and express mail services, customs clearance, and smart warehousing solutions.'
      : 'نقدم باقة شاملة من الخدمات اللوجستية التي تشمل النقل والشحن المحلي والدولي، خدمات البريد العادي والسريع، التخليص الجمركي، وحلول التخزين الذكية.',
    p2: lang === 'en'
      ? "At WASSEL, we're on a mission to be the courier company that goes beyond distance and destination to offer business transformation, reliable global services, and flexible, agile solutions. We've got to this position thanks to a mix of industry-leading expertise and an unwavering commitment to offering our customers a greater experience day after day."
      : 'تتمثل مهمة واصل في ان تكون شركة التوصيل الأسرع نمواً والأكثر تميزاً في الخدمات اللوجستية على مستوى فلسطين عبر تقديمها خدمات موثوقة وفعالة وحلول أكثر مرونة. وقد حظينا بهذه المكانة بفضل تنوع خبراتنا في هذا المجال، الى جانب التزامنا الدائم بتقديم أفضل الخدمات واجودها لزبائننا يوما بعد يوم.',
    p3: lang === 'en'
      ? 'We believe that our employees are the heart of our success. Our specialized teams, supported by advanced smart technologies and a well-equipped, diverse fleet, work closely together to deliver innovative and efficient services that meet the needs of all our clients across international, local, and governmental levels at competitive prices.'
      : 'نؤمن أن موظفينا هم قلب نجاحنا. ففرق عملنا المتخصصة، مدعومة بالتقنيات الذكية والمتطورة وأسطول شحن متنوع ومجهز، تعمل بتعاون وثيق لتقديم خدمات مبتكرة وفعالة تلبي احتياجات زبائننا كافة وبأسعار تنافسية على المستويات الدولية، المحلية والحكومية.',
    
    // Partnerships
    partnersTitle: lang === 'en' ? 'Our Strategic Partners' : 'شركاؤنا الاستراتيجيون',
    partnersDesc: lang === 'en' 
        ? 'We connect Palestine to the world through our strategic alliances with global industry leaders.' 
        : 'نربط فلسطين بالعالم من خلال تحالفاتنا الاستراتيجية مع قادة الصناعة العالمية.',

    // Page 4 Vision
    vision: lang === 'en'
      ? "We won't settle for what we've achieved; our horizons are broader and our ambition drives us to persistently work toward a smart, connected future."
      : 'لن نكتفي بما أنجزناه، فآفاقنا أوسع، وطموحنا يدفعنا لنواصل العمل بإصرار نحو مستقبل ذكي ومترابط.',

    // Page 3 Stats
    stats: [
        { 
            value: '20', 
            label: lang === 'en' ? 'Years in Business' : 'عاماً في مجال خدمات التوصيل السريع' 
        },
        { 
            value: '40M+', 
            label: lang === 'en' ? 'Shipments Delivered since 2005' : 'أكثر من 40 مليون شحنة تم توصيلها منذ العام 2005' 
        },
        { 
            value: '200+', 
            label: lang === 'en' ? 'Countries Covered' : 'أكثر من 200 دولة حول العالم' 
        },
        { 
            value: '500+', 
            label: lang === 'en' ? 'Worldwide Destinations' : 'أكثر من 500 وجهة عالمية' 
        },
        {
            value: lang === 'en' ? 'Up to 10M ILS' : 'يصل لـ 10 مليون شيكل',
            label: lang === 'en' ? 'Insurance Policy' : 'بوليصة تأمين'
        }
    ]
  };

  const partners = [
      { 
          name: { en: 'FedEx', ar: 'فيديكس' }, 
          desc: { en: 'Global Express Shipping', ar: 'شحن دولي سريع' },
          color: 'bg-purple-600',
          textColor: 'text-purple-600'
      },
      { 
          name: { en: 'DHL', ar: 'دي إتش إل' }, 
          desc: { en: 'International Logistics', ar: 'خدمات لوجستية عالمية' },
          color: 'bg-red-600',
          textColor: 'text-red-600'
      },
      { 
          name: { en: 'Jordan Post', ar: 'البريد الأردني' }, 
          desc: { en: 'Regional Gateway', ar: 'البوابة الإقليمية' },
          color: 'bg-blue-800',
          textColor: 'text-blue-800'
      },
      { 
          name: { en: 'Palestine Post', ar: 'البريد الفلسطيني' }, 
          desc: { en: 'National Carrier', ar: 'الناقل الوطني' },
          color: 'bg-red-500',
          textColor: 'text-red-500'
      }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <div className="relative bg-wassel-blue text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl animate-slide-up">
            {t.title}
          </h1>
        </div>
      </div>

      {/* Main Text Content */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up delay-100">
             <p className="text-2xl font-bold text-wassel-blue text-center leading-relaxed">
                 {t.intro}
             </p>
             <div className="prose prose-lg prose-blue max-w-none text-gray-600 space-y-6 leading-relaxed text-justify">
                <p>{t.p1}</p>
                <p>{t.p2}</p>
                <p>{t.p3}</p>
             </div>
          </div>
      </div>

      {/* Partners Section */}
      <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 animate-slide-up">
                  <h2 className="text-3xl font-bold text-wassel-blue mb-4">{t.partnersTitle}</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t.partnersDesc}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {partners.map((partner, i) => (
                      <div 
                        key={i} 
                        className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group animate-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${partner.textColor} bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
                              <Globe className="w-8 h-8" />
                          </div>
                          <h3 className={`text-xl font-bold mb-2 ${partner.textColor}`}>
                              {lang === 'en' ? partner.name.en : partner.name.ar}
                          </h3>
                          <p className="text-gray-500 text-sm">
                              {lang === 'en' ? partner.desc.en : partner.desc.ar}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Stats Section (Page 3) */}
      <div className="bg-white py-16 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Updated grid to support 5 items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                  {t.stats.map((stat, i) => (
                      <div key={i} className="text-center p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="text-4xl font-extrabold text-wassel-yellow mb-2">{stat.value}</div>
                          <div className="text-gray-600 font-medium">{stat.label}</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Vision Section (Page 4) */}
      <div className="relative py-20 bg-wassel-blue overflow-hidden">
           {/* Decorative background elements */}
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
           
           <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
               <div className="bg-wassel-blue/50 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-white/10 animate-slide-up delay-200">
                   <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                       "{t.vision}"
                   </p>
               </div>
           </div>
      </div>
    </div>
  );
};

export const Management: React.FC<PageProps> = ({ lang }) => (
    <div className="bg-white min-h-screen">
      <div className="relative bg-wassel-blue text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl animate-slide-up">
            {lang === 'en' ? 'Executive Management' : 'الإدارة التنفيذية'}
          </h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-48 h-48 bg-gray-200 rounded-full mb-6 overflow-hidden">
                        <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-wassel-blue">{lang === 'en' ? 'Executive Name' : 'اسم المسؤول'}</h3>
                    <p className="text-wassel-yellow font-medium mb-2">{lang === 'en' ? 'Position Title' : 'المسمى الوظيفي'}</p>
                    <p className="text-gray-500 text-sm max-w-xs">
                        {lang === 'en' ? 'Brief description about the executive role and experience.' : 'وصف موجز عن دور المسؤول وخبرته.'}
                    </p>
                </div>
            ))}
        </div>
      </div>
    </div>
);

export const Contact: React.FC<PageProps> = ({ lang }) => {
    const showContactAiSuggestedQuestions = false;
    const [formData, setFormData] = useState<ContactFormData>({
        topic: '',
        name: '',
        mobile: '',
        email: '',
        message: '',
        trackingNumber: '',
        passportNumber: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
    const [agentError, setAgentError] = useState('');
    const [agentSuggestion, setAgentSuggestion] = useState<ContactAiSuggestion | null>(null);
    const [contactLogId, setContactLogId] = useState<number | null>(null);

    const topics = [
        { id: 'general', en: 'General Inquiry', ar: 'استفسار عام', field: 'none' },
        { id: 'shipment', en: 'Shipment Inquiry', ar: 'استفسار عن شحنة', field: 'tracking' },
        { id: 'passport', en: 'Jordan Passport Services', ar: 'خدمات الجوازات الأردنية', field: 'passport' },
        { id: 'complaint', en: 'Complaint', ar: 'شكوى', field: 'tracking' },
        { id: 'claiming', en: 'Claiming', ar: 'مطالبة', field: 'tracking' }
    ];

    const currentTopic = topics.find(t => t.id === formData.topic);

    const updateField = (key: keyof ContactFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (agentSuggestion) {
            setAgentSuggestion(null);
        }
        setContactLogId(null);
        setAgentError('');
    };

    const persistAiSuggestionLog = async (suggestion: ContactAiSuggestion): Promise<number> => {
        const res = await fetch('/api/contact/log-ai-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                language: lang,
                aiSuggestion: suggestion,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error ?? 'Failed to persist AI suggestion');
        }

        const data = await res.json() as { logId?: number };
        if (typeof data.logId !== 'number' || data.logId <= 0) {
            throw new Error('Contact log id is missing from AI persistence response');
        }

        return data.logId;
    };

    const sendContactMessage = async (suggestion?: ContactAiSuggestion | null, logId?: number | null) => {
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    language: lang,
                    logId: logId ?? contactLogId,
                    aiSuggestion: suggestion ?? agentSuggestion,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as { error?: string }).error ?? 'Failed to send');
            }
            setIsSent(true);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    const runAgentSuggestion = async (): Promise<ContactSuggestionResult | null> => {
        setIsGeneratingSuggestion(true);
        setAgentError('');

        const resolveQueryLanguage = (input: string): 'ar' | 'en' => {
            if (/[\u0600-\u06FF]/.test(input)) return 'ar';
            if (/[A-Za-z]/.test(input)) return 'en';
            return lang === 'ar' ? 'ar' : 'en';
        };

        const runKbFallbackSuggestion = async (): Promise<{ answer: string; relatedTopics: string[] } | null> => {
            const topicKeywords: Record<string, string> = {
                general: lang === 'en' ? 'general inquiry support' : 'استفسار عام دعم',
                shipment: lang === 'en' ? 'shipment tracking delivery status' : 'تتبع شحنة حالة التسليم',
                passport: lang === 'en' ? 'jordan passport renewal issuance' : 'الجواز الأردني تجديد إصدار',
                complaint: lang === 'en' ? 'complaint shipment issue delay' : 'شكوى تأخير مشكلة شحنة',
                claiming: lang === 'en' ? 'claim damaged lost shipment' : 'مطالبة شحنة مفقودة متضررة',
            };

            const queryParts = [
                topicKeywords[formData.topic] ?? '',
                formData.message,
                formData.trackingNumber,
                formData.passportNumber,
            ].filter(Boolean);

            const query = queryParts.join(' ').trim();
            if (!query) return null;

            const queryLang = resolveQueryLanguage(query);
            const suggestions = await suggestKbQuestions(query, queryLang);
            if (!suggestions.length) return null;

            const topAnswer = await getKbQuestionAnswer(suggestions[0].questionId, queryLang);
            const relatedTopics = Array.from(new Set(suggestions.slice(0, 4).map((item) => item.question))).filter(Boolean);

            return {
                answer: topAnswer.answer,
                relatedTopics,
            };
        };

        try {
            const topicName = lang === 'en' ? (currentTopic?.en ?? 'General Inquiry') : (currentTopic?.ar ?? 'استفسار عام');
            const prompt = [
                lang === 'en'
                    ? 'You are helping customer support draft an email before sending.'
                    : 'أنت تساعد فريق الدعم على تحسين رسالة العميل قبل الإرسال.',
                lang === 'en'
                    ? 'Read the provided form data and return practical suggestions.'
                    : 'اقرأ بيانات النموذج وقدّم اقتراحات عملية.',
                lang === 'en'
                    ? 'Include: 1) short answer to user case, 2) 3-4 suggested follow-up questions based on topic.'
                    : 'قدّم: 1) إجابة مختصرة حسب الحالة، 2) من 3 إلى 4 أسئلة متابعة مقترحة حسب الموضوع.',
                '',
                lang === 'en' ? `Topic: ${topicName}` : `الموضوع: ${topicName}`,
                lang === 'en' ? `Name: ${formData.name}` : `الاسم: ${formData.name}`,
                lang === 'en' ? `Mobile: ${formData.mobile}` : `الموبايل: ${formData.mobile}`,
                lang === 'en' ? `Email: ${formData.email || '-'}` : `البريد الإلكتروني: ${formData.email || '-'}`,
                lang === 'en' ? `Tracking Number: ${formData.trackingNumber || '-'}` : `رقم التتبع: ${formData.trackingNumber || '-'}`,
                lang === 'en' ? `Passport Number: ${formData.passportNumber || '-'}` : `رقم الجواز: ${formData.passportNumber || '-'}`,
                lang === 'en' ? `User message: ${formData.message}` : `رسالة العميل: ${formData.message}`,
            ].join('\n');

            const result = await getResourceSearchResponse(prompt);

            const genericFallbackRegex = /couldn't find an answer|please browse our categories|تعذر العثور على إجابة|تصفح المواضيع/i;
            const looksLikeFallback = result.relatedTopics.length === 0 || genericFallbackRegex.test(result.answer);

            if (looksLikeFallback) {
                const kbSuggestion = await runKbFallbackSuggestion();
                if (kbSuggestion) {
                    const persistedLogId = await persistAiSuggestionLog(kbSuggestion);
                    setContactLogId(persistedLogId);
                    setAgentSuggestion(kbSuggestion);
                    return { suggestion: kbSuggestion, logId: persistedLogId };
                }
            }

            const suggestion = {
                answer: result.answer,
                relatedTopics: result.relatedTopics,
            };
            const persistedLogId = await persistAiSuggestionLog(suggestion);
            setContactLogId(persistedLogId);
            setAgentSuggestion(suggestion);
            return { suggestion, logId: persistedLogId };
        } catch {
            try {
                const kbSuggestion = await runKbFallbackSuggestion();
                if (kbSuggestion) {
                    const persistedLogId = await persistAiSuggestionLog(kbSuggestion);
                    setContactLogId(persistedLogId);
                    setAgentSuggestion(kbSuggestion);
                    return { suggestion: kbSuggestion, logId: persistedLogId };
                }
            } catch {
                // ignore secondary fallback errors
            }
            setAgentError(lang === 'en' ? 'Could not generate AI suggestions right now.' : 'تعذر توليد اقتراحات الذكاء الاصطناعي حالياً.');
            return null;
        } finally {
            setIsGeneratingSuggestion(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || isGeneratingSuggestion) {
            return;
        }

        const suggestionResult = agentSuggestion
            ? { suggestion: agentSuggestion, logId: contactLogId }
            : await runAgentSuggestion();

        await sendContactMessage(suggestionResult?.suggestion ?? null, suggestionResult?.logId ?? contactLogId);
    };

    const t = {
        title: lang === 'en' ? 'Contact Us' : 'تواصل معنا',
        subtitle: lang === 'en' ? 'We are here to help. Reach out to us.' : 'نحن هنا للمساعدة. تواصل معنا.',
        phone: lang === 'en' ? 'Call Us' : 'اتصل بنا',
        email: lang === 'en' ? 'Email Us' : 'راسلنا',
        
        // Form Strings
        formTitle: lang === 'en' ? 'Send us a message' : 'أرسل لنا رسالة',
        formSubtitle: lang === 'en' ? 'Please fill the form below and we will get back to you shortly.' : 'يرجى تعبئة النموذج أدناه وسنرد عليك قريباً.',
        labelTopic: lang === 'en' ? 'Topic' : 'الموضوع',
        labelName: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
        labelMobile: lang === 'en' ? 'Mobile Number' : 'رقم الموبايل',
        labelEmail: lang === 'en' ? 'Email Address (Optional)' : 'البريد الإلكتروني (اختياري)',
        labelMessage: lang === 'en' ? 'Your Message' : 'رسالتك',
        labelTracking: lang === 'en' ? 'Tracking Number' : 'رقم التتبع',
        labelPassport: lang === 'en' ? 'Passport Number' : 'رقم الجواز',
        selectTopic: lang === 'en' ? 'Select a topic...' : 'اختر موضوعاً...',
        btnSubmit: lang === 'en' ? 'Send Message' : 'إرسال الرسالة',
        sending: lang === 'en' ? 'Sending...' : 'جاري الإرسال...',
        generatingSuggestion: lang === 'en' ? 'Generating AI suggestions...' : 'جاري توليد الاقتراحات الذكية...',
        continueSend: lang === 'en' ? 'Continue Sending Email' : 'متابعة إرسال الرسالة',
        aiSuggestedQuestions: lang === 'en' ? 'Suggested Questions' : 'الأسئلة المقترحة',
        successTitle: lang === 'en' ? 'Message Sent Successfully!' : 'تم إرسال الرسالة بنجاح!',
        successDesc: lang === 'en' ? 'Thank you for contacting us. Our team will review your message and respond as soon as possible.' : 'شكراً لتواصلك معنا. سيقوم فريقنا بمراجعة رسالتك والرد في أقرب وقت ممكن.',
        sendNew: lang === 'en' ? 'Send Another Message' : 'إرسال رسالة أخرى',
        
        // Branches
        branchesTitle: lang === 'en' ? 'Our Branches & Hours' : 'فروعنا وساعات العمل',
        office: lang === 'en' ? 'Office' : 'المكتب',
        hours: lang === 'en' ? 'Working Hours' : 'ساعات العمل'
    };

    const branchGroups = [
        {
            category: lang === 'en' ? 'Our Offices' : 'فروعنا',
            schedule: lang === 'en' ? 'Sun - Thu: 8:00 AM - 4:30 PM' : 'الأحد - الخميس: 8:00 ص - 4:30 م',
            items: [
                { 
                    name: lang === 'en' ? 'Ramallah' : 'رام الله', 
                    address: lang === 'en' ? 'Al Masyoun, Edward Said St., opposite Legislative Council roundabout, Al-Qalaa Building' : 'الماصيون، شارع إدوارد سعيد، مقابل دوار المجلس التشريعي، عمارة القلعة',
                    mapUrl: 'https://maps.app.goo.gl/Myne187jJwd7GeVn8'
                },
                { 
                    name: lang === 'en' ? 'Nablus' : 'نابلس', 
                    address: lang === 'en' ? 'Rafidya, opposite Family Park, Ammasha Building' : 'رفيديا، مقابل منتزه العائلات، عمارة عماشة',
                    mapUrl: 'https://maps.app.goo.gl/1n24mDWVM7W4eLVz9'
                },
                { 
                    name: lang === 'en' ? 'Hebron' : 'الخليل', 
                    address: lang === 'en' ? 'Ibn Rushd roundabout, near Commercial Chamber, Juthoor Building' : 'دوار ابن رشد، بالقرب من الغرفة التجارية، عمارة جذور',
                    mapUrl: 'https://maps.app.goo.gl/aasJrQgu9wp5B7CG6'
                },
                { 
                    name: lang === 'en' ? 'Jerusalem' : 'القدس', 
                    address: lang === 'en' ? "Shu'fat, Shu'fat St. 45, Jerusalem Towers" : 'شعفاط، شارع شعفاط 45، أبراج القدس',
                    mapUrl: 'https://maps.app.goo.gl/2dX7reYf8DBL6A3n9'
                },
            ]
        },
        {
            category: lang === 'en' ? 'Jordanian Services Center' : 'مركز الخدمات الأردنية',
            items: [
                { 
                    name: lang === 'en' ? 'Rawabi - Q Center' : 'روابي - كيوسنتر', 
                    address: lang === 'en' ? 'Rawabi, Q Center, opposite Arab Bank' : 'روابي، كيوسنتر، مقابل البنك العربي',
                    mapUrl: 'https://maps.app.goo.gl/C9BAZX6Z2UfKsbkJ7'
                }
            ]
        },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* HERO Section: Title and Subtitle with Dark Background for Transparent Header */}
            <div className="bg-wassel-blue pt-36 md:pt-48 pb-20 px-4 sm:px-6 lg:px-8 text-center text-white">
                <div className="max-w-4xl mx-auto animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">{t.title}</h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">{t.subtitle}</p>
                </div>
            </div>

            {/* Split Content Container (Overlapping Hero) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row animate-pop delay-100">
                    
                    {/* Left Panel: Contact Info & Branches (Darker Blue) */}
                    <div className="w-full lg:w-1/3 bg-wassel-darkBlue text-white p-8 lg:p-12 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
                        
                        <div className="relative z-10 space-y-10">
                            {/* Quick Contacts */}
                            <div className="space-y-6 pb-8 border-b border-white/10">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <Phone className="w-5 h-5 text-wassel-yellow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base mb-1">{t.phone}</h3>
                                        <p dir="ltr" className="text-blue-100 text-sm">1700 974 444</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <Mail className="w-5 h-5 text-wassel-yellow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base mb-1">{t.email}</h3>
                                        <p className="text-blue-100 text-sm">info@wassel.ps</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <MessageCircle className="w-5 h-5 text-wassel-yellow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base mb-1">{lang === 'en' ? 'WhatsApp' : 'واتساب'}</h3>
                                        <a
                                            href="https://wa.me/972594775000"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            dir="ltr"
                                            className="text-blue-100 text-sm hover:text-wassel-yellow transition-colors"
                                        >
                                            +972 59 477 5000
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Branches List */}
                            <div>
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-wassel-yellow" />
                                    {t.branchesTitle}
                                </h3>
                                
                                <div className="space-y-8">
                                    {branchGroups.map((group, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <div className="border-b border-white/10 pb-2">
                                                <h4 className="font-bold text-lg text-wassel-yellow">{group.category}</h4>
                                                {group.schedule && (
                                                    <p className="text-xs text-blue-300 mt-1">{group.schedule}</p>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {group.items.map((location, i) => {
                                                    const inner = (
                                                        <>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h5 className="font-bold text-sm text-white">{location.name}</h5>
                                                                {'mapUrl' in location && (
                                                                    <span className="text-[10px] bg-wassel-yellow/20 text-wassel-yellow px-2 py-0.5 rounded whitespace-nowrap">
                                                                        {lang === 'en' ? 'View Map' : 'عرض الخريطة'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-start gap-1.5 text-xs text-blue-200">
                                                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                                                <span className="opacity-80">{location.address}</span>
                                                            </div>
                                                        </>
                                                    );
                                                    return 'mapUrl' in location ? (
                                                        <a key={i} href={(location as { mapUrl: string }).mapUrl} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                                            {inner}
                                                        </a>
                                                    ) : (
                                                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors">
                                                            {inner}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Contact Form */}
                    <div className="flex-1 p-8 lg:p-12 bg-white">
                        {!isSent ? (
                            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{t.formTitle}</h2>
                                <p className="text-gray-500 mb-8">{t.formSubtitle}</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Topic Selection */}
                                    <div>
                                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">{t.labelTopic}</label>
                                        <select 
                                            id="topic"
                                            required 
                                            value={formData.topic}
                                            onChange={(e) => updateField('topic', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                        >
                                            <option value="" disabled>{t.selectTopic}</option>
                                            {topics.map((topic) => (
                                                <option key={topic.id} value={topic.id}>{lang === 'en' ? topic.en : topic.ar}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Conditional Fields based on Topic */}
                                    {currentTopic?.field === 'tracking' && (
                                        <div className="animate-enter">
                                            <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">{t.labelTracking}</label>
                                            <input 
                                                type="text" 
                                                id="trackingNumber"
                                                required 
                                                value={formData.trackingNumber}
                                                onChange={(e) => updateField('trackingNumber', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border bg-blue-50"
                                            />
                                        </div>
                                    )}

                                    {currentTopic?.field === 'passport' && (
                                        <div className="animate-enter">
                                            <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-1">{t.labelPassport}</label>
                                            <input 
                                                type="text" 
                                                id="passportNumber"
                                                required 
                                                value={formData.passportNumber}
                                                onChange={(e) => updateField('passportNumber', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border bg-blue-50"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t.labelName}</label>
                                        <input 
                                            type="text" 
                                            id="name"
                                            required 
                                            value={formData.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">{t.labelMobile}</label>
                                            <input 
                                                type="tel" 
                                                id="mobile"
                                                required 
                                                value={formData.mobile}
                                                onChange={(e) => updateField('mobile', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t.labelEmail}</label>
                                            <input 
                                                type="email" 
                                                id="email"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{t.labelMessage}</label>
                                        <textarea 
                                            id="message"
                                            rows={5}
                                            required 
                                            value={formData.message}
                                            onChange={(e) => updateField('message', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                        ></textarea>
                                    </div>

                                    {(isGeneratingSuggestion || agentSuggestion || agentError) && (
                                        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                                            {isGeneratingSuggestion && (
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t.generatingSuggestion}
                                                </div>
                                            )}

                                            {!isGeneratingSuggestion && agentSuggestion && (
                                                <>
                                                    <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">{agentSuggestion.answer}</p>
                                                    {showContactAiSuggestedQuestions && agentSuggestion.relatedTopics.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.aiSuggestedQuestions}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {agentSuggestion.relatedTopics.map((topic, idx) => (
                                                                    <span key={`${topic}-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-blue-200 text-xs font-medium text-wassel-blue">
                                                                        {topic}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {!isGeneratingSuggestion && agentError && (
                                                <p className="text-sm text-red-600">{agentError}</p>
                                            )}
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || isGeneratingSuggestion}
                                        className="w-full bg-wassel-blue text-white font-bold py-4 rounded-xl shadow-lg hover:bg-wassel-darkBlue transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t.sending}
                                            </>
                                        ) : isGeneratingSuggestion ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t.generatingSuggestion}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5 rtl:rotate-180" />
                                                {agentSuggestion ? t.continueSend : t.btnSubmit}
                                            </>
                                        )}
                                    </button>
                                    {submitError && (
                                        <p className="text-red-600 text-sm mt-2 text-center">{submitError}</p>
                                    )}
                                </form>
                            </div>
                        ) : (
                            <div className="text-center py-12 animate-pop h-full flex flex-col items-center justify-center">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{t.successTitle}</h2>
                                <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                                    {t.successDesc}
                                </p>
                                <button 
                                    onClick={() => { setIsSent(false); setSubmitError(''); setFormData({topic: '', name: '', mobile: '', email: '', message: '', trackingNumber: '', passportNumber: ''}); }}
                                    className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    {t.sendNew}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};