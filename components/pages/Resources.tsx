import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Book, FileText, Box, AlertCircle, HelpCircle, ChevronRight, Download, Globe, Sparkles, Loader2, ArrowRight, Lightbulb, ChevronDown, ChevronUp, X, CornerDownLeft } from 'lucide-react';
import { Language } from '../../types';
import { getResourceSearchResponse } from '../../services/geminiService';
import { FAQ_DATA } from '../../data/faqs';
import { suggestKbQuestions, getKbQuestionAnswer, getKbTopics, KbTopic, QuestionSuggestionItem } from '../../services/questionsKbService';
import { FormattedAnswer } from '../FormattedAnswer';

interface ResourcesProps {
  lang: Language;
  onTrack?: (trackingId: string) => void;
}

export const Resources: React.FC<ResourcesProps> = ({ lang, onTrack }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [aiData, setAiData] = useState<{ answer: string; relatedTopics: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<QuestionSuggestionItem[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [paletteAiAnswer, setPaletteAiAnswer] = useState<{ query: string; answer: string; relatedTopics: string[] } | null>(null);
  const [paletteAiLoading, setPaletteAiLoading] = useState(false);
  const [kbTopics, setKbTopics] = useState<KbTopic[]>([]);
  const [selectedResourceGroupId, setSelectedResourceGroupId] = useState<string | null>(null);
  const [selectedResourceItem, setSelectedResourceItem] = useState<string | null>(null);
  const [relatedFaqs, setRelatedFaqs] = useState<QuestionSuggestionItem[]>([]);
  const [relatedFaqsLoading, setRelatedFaqsLoading] = useState(false);
  const [relatedFaqsError, setRelatedFaqsError] = useState<string | null>(null);
  const [openRelatedFaqId, setOpenRelatedFaqId] = useState<number | null>(null);
  const [relatedFaqAnswers, setRelatedFaqAnswers] = useState<Record<number, string>>({});
  const [loadingRelatedFaqId, setLoadingRelatedFaqId] = useState<number | null>(null);

  // Resource category metadata from API (title, description, image, is_active)
  const [apiCategories, setApiCategories] = useState<Array<{
    id: number; code: string;
    title_ar: string; title_en: string | null;
    description_ar: string | null; description_en: string | null;
    image_url: string | null; sort_order: number; is_active: boolean;
  }>>([]);

  // Sub-items per category from API
  const [apiSubItems, setApiSubItems] = useState<Record<string, Array<{
    id: number; category_code: string; title_ar: string; title_en: string | null;
  }>>>({});
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('wassel_recent_searches') ?? '[]'); } catch { return []; }
  });

  // Load KB topics once on mount (or when language changes)
  useEffect(() => {
    const queryLang = lang === 'ar' ? 'ar' : 'en';
    getKbTopics(queryLang).then(setKbTopics).catch(() => {});
    fetch('/api/resource-categories?active=true')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.categories)) setApiCategories(d.categories); })
      .catch(() => {});
    fetch('/api/resource-sub-items?active=true')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) {
          const grouped: Record<string, typeof d.items> = {};
          for (const item of d.items) {
            if (!grouped[item.category_code]) grouped[item.category_code] = [];
            grouped[item.category_code].push(item);
          }
          setApiSubItems(grouped);
        }
      })
      .catch(() => {});
  }, [lang]);
  const [activeFaqTab, setActiveFaqTab] = useState<'general' | 'services' | 'corporate' | 'industries'>('general');
  const [openFaqIndex, setOpenFaqIndex] = useState<string | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const paletteInputRef = useRef<HTMLInputElement | null>(null);

  const t = {
    heroTitle: lang === 'en' ? 'How can we help?' : 'كيف يمكننا مساعدتك؟',
    heroSubtitle: lang === 'en' ? 'Find answers, guides, and resources for all your shipping needs.' : 'اعثر على الإجابات والأدلة والموارد لجميع احتياجاتك اللوجستية.',
    searchPlaceholder: lang === 'en' ? 'Help me with...' : 'كيف يمكنني مساعدتك...',
    askBtn: lang === 'en' ? 'Ask AI' : 'اسأل AI',
    categoriesTitle: lang === 'en' ? 'Browse Topics' : 'تصفح المواضيع',
    faqTitle: lang === 'en' ? 'Common Questions' : 'أسئلة شائعة',
    downloadsTitle: lang === 'en' ? 'Forms & Downloads' : 'نماذج وتنزيلات',
    aiAnswer: lang === 'en' ? 'AI Answer:' : 'إجابة الذكاء الاصطناعي:',
    generatedBy: lang === 'en' ? 'Generated by Wassel AI' : 'تم الإنشاء بواسطة واصل AI',
    clear: lang === 'en' ? 'Clear Results' : 'مسح النتائج',
    viewGuide: lang === 'en' ? 'View Guide' : 'عرض الدليل',
    relatedTopics: lang === 'en' ? 'Related Topics:' : 'مواضيع ذات صلة:',
    palettePlaceholder: lang === 'en' ? 'Search docs or ask AI a question' : 'ابحث في المصادر أو اسأل الذكاء الاصطناعي',
    workflowsTitle: lang === 'en' ? 'Suggestions' : 'اقتراحات',
    askAiLabel: lang === 'en' ? 'Ask AI:' : 'اسأل AI:',
    verifyDisclaimer: lang === 'en' ? 'Answers are generated with AI which can make mistakes. Verify responses.' : 'يتم توليد الإجابات بالذكاء الاصطناعي وقد تحتوي على أخطاء. يرجى التحقق.',
    askAnother: lang === 'en' ? 'Ask another question...' : 'اسأل سؤالا آخر...',
    answering: lang === 'en' ? 'Answering...' : 'جاري الإجابة...',
    backToSearch: lang === 'en' ? 'Back to search' : 'العودة للبحث',
    allCollections: lang === 'en' ? 'All Collections' : 'كل الأقسام',
    tabs: {
        general: lang === 'en' ? 'General' : 'عام',
        services: lang === 'en' ? 'Services' : 'الخدمات',
        corporate: lang === 'en' ? 'Corporate' : 'الشركات',
        industries: lang === 'en' ? 'Sectors' : 'القطاعات',
    },
    relatedFaqsTitle: lang === 'en' ? 'Related FAQs' : 'الأسئلة ذات الصلة',
    relatedFaqsSubtitle: lang === 'en' ? 'Choose a question below to view its answer.' : 'اختر سؤالاً من القائمة التالية لعرض الإجابة.',
    noRelatedFaqs: lang === 'en' ? 'No related FAQs found for this item yet.' : 'لا توجد أسئلة مرتبطة بهذا العنصر حالياً.',
    loadingRelatedFaqs: lang === 'en' ? 'Loading related FAQs...' : 'جاري تحميل الأسئلة ذات الصلة...',
    failedRelatedFaqs: lang === 'en' ? 'Unable to load related FAQs right now.' : 'تعذر تحميل الأسئلة ذات الصلة حالياً.',
    backToItems: lang === 'en' ? 'Back to items' : 'العودة للعناصر',
    loadingAnswer: lang === 'en' ? 'Loading answer...' : 'جاري تحميل الإجابة...',
    failedAnswer: lang === 'en' ? "Sorry, we couldn't load this answer right now." : 'عذراً، تعذر تحميل هذه الإجابة حالياً.',
  };

  const resourceGroups = [
    {
      id: 'services',
      title: lang === 'en' ? 'Services' : 'الخدمات',
      icon: Box,
      color: 'bg-blue-100 text-blue-500',
      items: lang === 'en'
        ? [
            'International Shipping',
            'Domestic Shipping',
            'Heavy Shipping / Cargo',
            'Customs Clearance',
            'No-Objection Service',
            'Jordanian Passport Services',
            'US Embassy Passport Delivery Service',
            'Storage and 3PL Services',
            'Customer Pickup Service',
            'Door Delivery Service',
            'Cash on Delivery (COD)',
            'Documents Service',
            'Packages Service',
            'Commercial Goods Service',
          ]
        : [
            'الشحن الدولي',
            'الشحن المحلي',
            'الشحن الثقيل / Cargo',
            'التخليص الجمركي',
            'خدمة عدم الممانعة',
            'خدمات الجوازات الأردنية',
            'خدمة توصيل جوازات السفارة الأمريكية',
            'خدمات التخزين والـ 3PL',
            'خدمة الاستلام من العميل',
            'خدمة التوصيل للباب',
            'خدمة الدفع عند الاستلام COD',
            'خدمة المستندات Documents',
            'خدمة الطرود Packages',
            'خدمة البضائع التجارية',
          ],
    },
    {
      id: 'shipping-guides',
      title: lang === 'en' ? 'Shipping Guides' : 'أدلة الشحن',
      icon: Book,
      color: 'bg-emerald-100 text-emerald-500',
      items: lang === 'en'
        ? [
            'How do I start a shipping request?',
            'Shipment preparation steps',
            'Difference between document and package shipping',
            'How to calculate volumetric weight',
            'How to choose the right service type',
            'How to track a shipment',
            'How to prepare an international shipment',
            'How to prepare a domestic shipment',
            'How to request pickup from location',
            'How to print a shipping waybill',
            'How to attach required documents',
            'Shipment drop-off steps at branch',
            'Customer pickup steps',
          ]
        : [
            'كيف أبدأ طلب شحن؟',
            'خطوات تجهيز الشحنة',
            'الفرق بين شحن المستندات والطرود',
            'كيفية حساب الوزن الحجمي',
            'كيفية اختيار نوع الخدمة المناسبة',
            'كيفية تتبع الشحنة',
            'كيفية تجهيز شحنة دولية',
            'كيفية تجهيز شحنة محلية',
            'كيفية طلب استلام من الموقع',
            'كيفية طباعة بوليصة الشحن',
            'كيفية إرفاق المستندات المطلوبة',
            'خطوات تسليم الشحنة للفرع',
            'خطوات الاستلام من العميل',
          ],
    },
    {
      id: 'tracking-status',
      title: lang === 'en' ? 'Tracking & Shipment Status' : 'التتبع وحالة الشحنة',
      icon: Search,
      color: 'bg-orange-100 text-orange-500',
      items: lang === 'en'
        ? [
            'How to track a shipment',
            'Shipment status explanation',
            'Shipment created',
            'Shipment received',
            'In processing',
            'Out for delivery',
            'Delivered',
            'Failed delivery attempt',
            'Shipment in customs clearance',
            'Shipment needs additional information',
            'Shipment delayed',
            'What if tracking status does not appear?',
            'What if shipment status is unclear?',
          ]
        : [
            'كيفية تتبع الشحنة',
            'شرح حالات التتبع',
            'تم إنشاء الشحنة',
            'تم استلام الشحنة',
            'قيد المعالجة',
            'خرجت للتوصيل',
            'تم التسليم',
            'محاولة تسليم فاشلة',
            'الشحنة قيد التخليص',
            'الشحنة بحاجة إلى معلومات إضافية',
            'الشحنة متأخرة',
            'ماذا أفعل إذا لم تظهر حالة التتبع؟',
            'ماذا أفعل إذا كانت حالة الشحنة غير واضحة؟',
          ],
    },
    {
      id: 'packaging',
      title: lang === 'en' ? 'Packaging' : 'التغليف',
      icon: Box,
      color: 'bg-red-100 text-red-500',
      items: lang === 'en'
        ? [
            'Document packaging guidelines',
            'Package packaging guidelines',
            'Fragile items packaging',
            'Electronics packaging',
            'Clothing and light products packaging',
            'Liquids and sensitive materials packaging',
            'Using the right carton',
            'Using internal protective materials',
            'How to seal parcel securely',
            'Common packaging mistakes',
            'When should a pallet be used?',
            'How to write address on shipment',
          ]
        : [
            'إرشادات تغليف المستندات',
            'إرشادات تغليف الطرود',
            'تغليف المواد القابلة للكسر',
            'تغليف الأجهزة الإلكترونية',
            'تغليف الملابس والمنتجات الخفيفة',
            'تغليف السوائل والمواد الحساسة',
            'استخدام الكرتون المناسب',
            'استخدام مواد الحماية الداخلية',
            'طريقة إغلاق الطرد بشكل آمن',
            'الأخطاء الشائعة في التغليف',
            'متى يجب استخدام Pallet؟',
            'تعليمات كتابة العنوان على الشحنة',
          ],
    },
    {
      id: 'prohibited-items',
      title: lang === 'en' ? 'Prohibited & Restricted Items' : 'المواد المحظورة',
      icon: AlertCircle,
      color: 'bg-violet-100 text-violet-500',
      items: lang === 'en'
        ? [
            'Locally prohibited items',
            'Internationally prohibited items',
            'Dangerous goods',
            'Liquids and chemicals',
            'Batteries and electronics',
            'Medicines and medical supplies',
            'Food items',
            'Cash and precious metals',
            'Sensitive official documents',
            'Weapons and sharp tools',
            'Products requiring special approvals',
            'Difference between prohibited and restricted',
            'What happens if a prohibited item is shipped?',
          ]
        : [
            'المواد المحظورة محلياً',
            'المواد المحظورة دولياً',
            'المواد الخطرة Dangerous Goods',
            'السوائل والمواد الكيميائية',
            'البطاريات والأجهزة الإلكترونية',
            'الأدوية والمستلزمات الطبية',
            'المواد الغذائية',
            'الأموال والمعادن الثمينة',
            'الوثائق الرسمية الحساسة',
            'الأسلحة والأدوات الحادة',
            'المنتجات التي تحتاج موافقات خاصة',
            'الفرق بين ممنوع ومقيّد',
            'ماذا يحدث إذا تم إرسال مادة محظورة؟',
          ],
    },
    {
      id: 'customs-clearance',
      title: lang === 'en' ? 'Customs & Clearance' : 'الجمارك والتخليص',
      icon: Globe,
      color: 'bg-teal-100 text-teal-500',
      items: lang === 'en'
        ? [
            'Customs clearance requirements',
            'Commercial invoice',
            'Shipment contents description',
            'Declared value',
            'Customs duties and taxes',
            'Commercial shipments',
            'Personal shipments',
            'Import documents',
            'Export documents',
            'Reasons for customs delays',
            'Countries requiring additional documents',
            'How to pay customs fees',
            'Customer responsibility for customs data',
          ]
        : [
            'متطلبات التخليص الجمركي',
            'الفاتورة التجارية Commercial Invoice',
            'وصف محتويات الشحنة',
            'القيمة المصرّح عنها',
            'الرسوم الجمركية والضرائب',
            'الشحنات التجارية',
            'الشحنات الشخصية',
            'مستندات الاستيراد',
            'مستندات التصدير',
            'أسباب تأخير التخليص',
            'الدول التي تتطلب مستندات إضافية',
            'آلية دفع الرسوم الجمركية',
            'مسؤولية العميل عن البيانات الجمركية',
          ],
    },
    {
      id: 'accounts-payments',
      title: lang === 'en' ? 'Accounts & Payments' : 'الحسابات والدفع',
      icon: FileText,
      color: 'bg-indigo-100 text-indigo-500',
      items: lang === 'en'
        ? [
            'Open a business account',
            'Account types',
            'Customer pricing mechanism',
            'Available payment methods',
            'Cash payment',
            'POS payment',
            'Cash on delivery (COD)',
            'Monthly invoices',
            'Account statement',
            'Credit limits',
            'Amount settlement mechanism',
            'Additional service fees',
            'Invoice inquiry',
            'Invoice dispute',
          ]
        : [
            'فتح حساب تجاري',
            'أنواع الحسابات',
            'آلية التسعير للعملاء',
            'طرق الدفع المتاحة',
            'الدفع النقدي',
            'الدفع عبر POS',
            'الدفع عند الاستلام COD',
            'الفواتير الشهرية',
            'كشف الحساب',
            'الحدود الائتمانية',
            'آلية تسوية المبالغ',
            'رسوم الخدمات الإضافية',
            'الاستفسار عن فاتورة',
            'الاعتراض على فاتورة',
          ],
    },
    {
      id: 'policies-terms',
      title: lang === 'en' ? 'Policies & Terms' : 'السياسات والشروط',
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-500',
      items: lang === 'en'
        ? [
            'International shipping policy',
            'Domestic shipping policy',
            'Pricing and fees policy',
            'Packaging policy',
            'Prohibited items policy',
            'Liability and compensation policy',
            'Complaint submission policy',
            'Refund policy',
            'Payment and collection policy',
            'Business accounts policy',
            'Privacy and data protection policy',
            'Wassel services terms of use',
            'Delay or non-delivery policy',
            'Incorrect addresses policy',
            'Temporary parcel storage policy',
          ]
        : [
            'سياسة الشحن الدولي',
            'سياسة الشحن المحلي',
            'سياسة الأسعار والرسوم',
            'سياسة التغليف',
            'سياسة المواد المحظورة',
            'سياسة المسؤولية والتعويض',
            'سياسة تقديم الشكاوى',
            'سياسة الاسترداد',
            'سياسة الدفع والتحصيل',
            'سياسة الحسابات التجارية',
            'سياسة الخصوصية وحماية البيانات',
            'شروط استخدام خدمات واصل',
            'سياسة التأخير أو عدم التسليم',
            'سياسة العناوين غير الصحيحة',
            'سياسة التخزين المؤقت للطرود',
          ],
    },
    {
      id: 'complaints-claims',
      title: lang === 'en' ? 'Complaints & Claims' : 'الشكاوى والمطالبات',
      icon: HelpCircle,
      color: 'bg-rose-100 text-rose-500',
      items: lang === 'en'
        ? [
            'Submit a shipment complaint',
            'Submit a compensation claim',
            'Damaged shipment claim',
            'Lost shipment claim',
            'Delayed shipment claim',
            'Required claim documents',
            'Complaint processing duration',
            'Track complaint status',
            'Cases not covered by liability',
            'How to contact customer service',
            'Escalate complaint to management',
          ]
        : [
            'تقديم شكوى على شحنة',
            'تقديم مطالبة تعويض',
            'مطالبة تلف الشحنة',
            'مطالبة فقدان الشحنة',
            'مطالبة تأخير الشحنة',
            'المستندات المطلوبة للمطالبة',
            'مدة معالجة الشكوى',
            'متابعة حالة الشكوى',
            'حالات لا تشملها المسؤولية',
            'كيفية التواصل مع خدمة العملاء',
            'تصعيد الشكوى للإدارة المختصة',
          ],
    },
    {
      id: 'forms-downloads',
      title: lang === 'en' ? 'Forms & Downloads' : 'النماذج والتنزيلات',
      icon: Download,
      color: 'bg-cyan-100 text-cyan-500',
      items: lang === 'en'
        ? [
            'Commercial invoice form',
            'Customs declaration form',
            'Claim form',
            'Account opening request form',
            'International shipping request form',
            'Heavy shipping request form',
            'Customs clearance authorization form',
            'Shipment contents declaration form',
            'Customer complaint form',
            'Account data update form',
            'Pricing and services guide',
            'Packaging guide',
          ]
        : [
            'نموذج الفاتورة التجارية',
            'نموذج التصريح الجمركي',
            'نموذج المطالبة',
            'نموذج طلب فتح حساب',
            'نموذج طلب شحن دولي',
            'نموذج طلب شحن ثقيل',
            'نموذج تفويض التخليص الجمركي',
            'نموذج إقرار محتويات الشحنة',
            'نموذج شكوى عميل',
            'نموذج تحديث بيانات الحساب',
            'دليل الأسعار والخدمات',
            'دليل التغليف',
          ],
    },
    {
      id: 'general-questions',
      title: lang === 'en' ? 'General Questions' : 'أسئلة عامة',
      icon: HelpCircle,
      color: 'bg-slate-100 text-slate-500',
      items: lang === 'en'
        ? [
            'What are working hours?',
            'Where are Wassel branches located?',
            'How do I contact customer service?',
            'How do I track my shipment?',
            'What is the delivery duration?',
            'Can I change the delivery address?',
            'Can I cancel the shipping request?',
            'Is there pickup from home or company?',
            'How do I know shipping cost?',
            'Is there shipment insurance?',
            'What should I do if shipment is delayed?',
            'What should I do if shipment arrives damaged?',
          ]
        : [
            'ما هي ساعات العمل؟',
            'أين تقع فروع واصل؟',
            'كيف أتواصل مع خدمة العملاء؟',
            'كيف أتتبع شحنتي؟',
            'ما هي مدة التوصيل؟',
            'هل يمكن تغيير عنوان التسليم؟',
            'هل يمكن إلغاء طلب الشحن؟',
            'هل يوجد استلام من المنزل أو الشركة؟',
            'كيف أعرف تكلفة الشحن؟',
            'هل يوجد تأمين على الشحنة؟',
            'ماذا أفعل إذا تأخرت الشحنة؟',
            'ماذا أفعل إذا وصلت الشحنة تالفة؟',
          ],
    },
  ];

  const downloadCategories = [
    {
      id: 'shipping-forms',
      title: lang === 'ar' ? 'نماذج الشحن' : 'Shipping Forms',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
      files: [
        {
          name: lang === 'ar' ? 'نموذج الفاتورة التجارية' : 'Commercial Invoice Template',
          description: lang === 'ar' ? 'يُستخدم لوصف محتويات الشحنة وقيمتها للجمارك' : 'Used to describe shipment contents and value for customs',
          format: 'PDF',
          size: '245 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/commercial-invoice.pdf`,
        },
        {
          name: lang === 'ar' ? 'نموذج قائمة التعبئة' : 'Packing List Template',
          description: lang === 'ar' ? 'قائمة تفصيلية بمحتويات الطرود داخل الشحنة' : 'Detailed list of contents inside the shipment boxes',
          format: 'Excel',
          size: '120 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/packing-list.xlsx`,
        },
      ],
    },
    {
      id: 'customs-forms',
      title: lang === 'ar' ? 'نماذج الجمارك' : 'Customs Forms',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
      files: [
        {
          name: lang === 'ar' ? 'نموذج التصريح الجمركي' : 'Customs Declaration Form',
          description: lang === 'ar' ? 'الإقرار الرسمي بمحتويات الشحنة وقيمتها الجمركية' : 'Official declaration of shipment contents and customs value',
          format: 'PDF',
          size: '200 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/customs-declaration.pdf`,
        },
        {
          name: lang === 'ar' ? 'نموذج تفويض التخليص الجمركي' : 'Customs Clearance Authorization',
          description: lang === 'ar' ? 'تفويض واصل للقيام بإجراءات التخليص الجمركي' : 'Authorize Wassel to handle customs clearance procedures',
          format: 'PDF',
          size: '155 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/customs-clearance-authorization.pdf`,
        },
        {
          name: lang === 'ar' ? 'نموذج إقرار محتويات الشحنة' : 'Shipment Contents Declaration',
          description: lang === 'ar' ? 'إقرار تفصيلي بمحتويات الشحنة لأغراض التخليص' : 'Detailed declaration of shipment contents for clearance',
          format: 'PDF',
          size: '170 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/contents-declaration.pdf`,
        },
      ],
    },
    {
      id: 'account-forms',
      title: lang === 'ar' ? 'نماذج الحسابات' : 'Account Forms',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
      files: [
        {
          name: lang === 'ar' ? 'نموذج طلب فتح حساب تجاري' : 'Business Account Opening Request',
          description: lang === 'ar' ? 'لفتح حساب شركة مع واصل والحصول على خدمات تجارية' : 'Open a corporate account with Wassel for business services',
          format: 'PDF',
          size: '310 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/account-opening-request.pdf`,
        },
        {
          name: lang === 'ar' ? 'نموذج تحديث بيانات الحساب' : 'Account Data Update Form',
          description: lang === 'ar' ? 'تحديث بيانات الشركة أو معلومات التواصل' : 'Update company information or contact details',
          format: 'PDF',
          size: '140 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/account-update-form.pdf`,
        },
      ],
    },
    {
      id: 'claims-forms',
      title: lang === 'ar' ? 'نماذج المطالبات والشكاوى' : 'Claims & Complaints',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
      files: [
        {
          name: lang === 'ar' ? 'نموذج المطالبة (تلف / فقدان)' : 'Claim Form (Damage / Loss)',
          description: lang === 'ar' ? 'لتقديم مطالبة تعويض عن شحنة تالفة أو مفقودة' : 'Submit a compensation claim for damaged or lost shipments',
          format: 'PDF',
          size: '210 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/claim-form.pdf`,
        },
        {
          name: lang === 'ar' ? 'نموذج شكوى عميل' : 'Customer Complaint Form',
          description: lang === 'ar' ? 'تقديم شكوى رسمية بشأن خدمة أو شحنة' : 'Submit a formal complaint regarding a service or shipment',
          format: 'PDF',
          size: '165 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/complaint-form.pdf`,
        },
      ],
    },
    {
      id: 'guides',
      title: lang === 'ar' ? 'أدلة وإرشادات' : 'Guides & References',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
      files: [
        {
          name: lang === 'ar' ? 'دليل التغليف الصحيح' : 'Proper Packaging Guide',
          description: lang === 'ar' ? 'إرشادات لتغليف الشحنات بشكل آمن واحترافي' : 'Guidelines for packing shipments safely and professionally',
          format: 'PDF',
          size: '380 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/packaging-guide.pdf`,
        },
        {
          name: lang === 'ar' ? 'دليل الدول والمناطق المخدومة' : 'Coverage Countries & Zones Guide',
          description: lang === 'ar' ? 'قائمة الدول والمناطق التي تغطيها شبكة واصل' : 'List of countries and zones covered by the Wassel network',
          format: 'PDF',
          size: '295 KB',
          url: `${import.meta.env.BASE_URL}assets/downloads/coverage-guide.pdf`,
        },
      ],
    },
  ];

  // API-only categories: active groups from the DB that have no hardcoded counterpart
  const hardcodedGroupIds = new Set(resourceGroups.map(g => g.id));
  const apiOnlyGroups = apiCategories
    .filter(c => c.is_active && !hardcodedGroupIds.has(c.code))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(c => ({
      id: c.code,
      title: lang === 'ar' ? c.title_ar : (c.title_en ?? c.title_ar),
      icon: Globe,
      color: 'bg-blue-100 text-blue-500' as const,
      items: (apiSubItems[c.code] ?? []).map(i => lang === 'ar' ? i.title_ar : (i.title_en ?? i.title_ar)),
    }));
  const allDisplayGroups = [...resourceGroups, ...apiOnlyGroups];

  const selectedResourceGroup = allDisplayGroups.find((group) => group.id === selectedResourceGroupId) ?? null;
  const resourceGroupIdSet = useMemo(() => new Set(allDisplayGroups.map((group) => group.id)), [allDisplayGroups]);
  const sharedResourceCardColor = 'bg-blue-100 text-blue-500';

  // Build a lookup from API categories (code → data) for fast access
  const apiCategoryMap = useMemo(
    () => Object.fromEntries(apiCategories.map(c => [c.code, c])),
    [apiCategories],
  );

  // Active codes set — if API returned data, hide cards marked inactive
  const activeCodes = useMemo(
    () => apiCategories.length > 0 ? new Set(apiCategories.filter(c => c.is_active).map(c => c.code)) : null,
    [apiCategories],
  );

  const groupImages: Record<string, string> = {
    'services': `${import.meta.env.BASE_URL}assets/projects/services.png`,
    'shipping-guides': `${import.meta.env.BASE_URL}assets/projects/shipping-guides.png`,
    'packaging': `${import.meta.env.BASE_URL}assets/projects/packaging.png`,
    'prohibited-items': `${import.meta.env.BASE_URL}assets/projects/prohibited-items.png`,
    'customs-clearance': `${import.meta.env.BASE_URL}assets/projects/customs-clearance.png`,
    'accounts-payments': `${import.meta.env.BASE_URL}assets/projects/accounts-payments.png`,
    'policies-terms': `${import.meta.env.BASE_URL}assets/projects/policies-terms.png`,
  };

  // Prefer API image_url if set, otherwise fall back to static mapping
  const resolveGroupImage = (groupId: string) => {
    const apiImg = apiCategoryMap[groupId]?.image_url;
    if (apiImg) return apiImg.startsWith('http') || apiImg.startsWith('/') ? apiImg : `${import.meta.env.BASE_URL}${apiImg.replace(/^\//, '')}`;
    return groupImages[groupId] ?? null;
  };
  const localePrefix = `/${lang}`;
  const resourcesBasePath = `${localePrefix}/resources`;
  const serviceCanonicalSlugs = [
    'internationalshipping',
    'domesticshipping',
    'heavyshippingcargo',
    'customsclearance',
    'noobjectionservice',
    'jordanianpassportservices',
    'usembassypassportdeliveryservice',
    'storageand3plservices',
    'customerpickupservice',
    'doordeliveryservice',
    'cashondeliverycod',
    'documentsservice',
    'packagesservice',
    'commercialgoodsservice',
  ];

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/\//g, ' ')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');

  const getCanonicalItemSlug = (groupId: string, item: string, index: number) => {
    if (groupId === 'services' && serviceCanonicalSlugs[index]) {
      return serviceCanonicalSlugs[index];
    }
    return toSlug(item);
  };

  const normalizeCanonicalSlugInput = (slug: string) => {
    if (slug === 'internationalshippiong') {
      return 'internationalshipping';
    }
    return slug;
  };

  const toResourceItemPath = (groupId: string, item: string, itemIndex: number) => {
    const slug = getCanonicalItemSlug(groupId, item, itemIndex);
    return slug ? `${resourcesBasePath}/${groupId}/${encodeURIComponent(slug)}` : `${resourcesBasePath}/${groupId}`;
  };

  const resetSelectedResourceDetails = () => {
    setSelectedResourceItem(null);
    setRelatedFaqs([]);
    setRelatedFaqsError(null);
    setOpenRelatedFaqId(null);
    setRelatedFaqAnswers({});
    setLoadingRelatedFaqId(null);
  };

  const clearResourceSelection = () => {
    setSelectedResourceGroupId(null);
    resetSelectedResourceDetails();
  };

  const groupDescription = (groupId: string) => {
    // Prefer API description if available
    const apiDesc = lang === 'ar'
      ? apiCategoryMap[groupId]?.description_ar
      : apiCategoryMap[groupId]?.description_en;
    if (apiDesc) return apiDesc;

    const descriptions = {
      services: lang === 'en' ? 'Explore all shipping and logistics services available for individuals and businesses.' : 'تعرّف على جميع خدمات الشحن والخدمات اللوجستية المتاحة للأفراد والشركات.',
      'shipping-guides': lang === 'en' ? 'Step-by-step guides to help you prepare, book, and deliver shipments smoothly.' : 'أدلة خطوة بخطوة لمساعدتك في تجهيز الشحنات وطلبها وتسليمها بسهولة.',
      'tracking-status': lang === 'en' ? 'Learn how tracking works and what each shipment status means.' : 'تعرّف على آلية التتبع ومعاني حالات الشحنة المختلفة.',
      packaging: lang === 'en' ? 'Best practices for packing shipments safely and professionally.' : 'أفضل الممارسات لتغليف الشحنات بشكل آمن واحترافي.',
      'prohibited-items': lang === 'en' ? 'Check restricted and prohibited items before creating your shipment.' : 'اطّلع على المواد الممنوعة والمقيّدة قبل إنشاء شحنتك.',
      'customs-clearance': lang === 'en' ? 'Everything related to customs paperwork, duties, and clearance requirements.' : 'كل ما يتعلق بالمستندات الجمركية والرسوم ومتطلبات التخليص.',
      'accounts-payments': lang === 'en' ? 'Information about accounts, invoicing, payment methods, and financial processes.' : 'معلومات عن الحسابات والفوترة وطرق الدفع والإجراءات المالية.',
      'policies-terms': lang === 'en' ? 'Review the operational policies, service terms, and customer obligations.' : 'راجع السياسات التشغيلية وشروط الخدمة والتزامات العميل.',
      'complaints-claims': lang === 'en' ? 'Find the right process for complaints, escalations, and compensation claims.' : 'اعرف الإجراء الصحيح لتقديم الشكاوى والتصعيد والمطالبات.',
      'forms-downloads': lang === 'en' ? 'Access the most important forms, templates, and downloadable resources.' : 'الوصول إلى أهم النماذج والقوالب والملفات القابلة للتنزيل.',
      'general-questions': lang === 'en' ? 'Quick answers to common questions about branches, delivery, support, and more.' : 'إجابات سريعة على الأسئلة العامة حول الفروع والتوصيل والدعم وغيرها.',
    } as const;

    return descriptions[groupId as keyof typeof descriptions] ?? '';
  };

  const itemDescriptions = {
    ar: {
      'الشحن الدولي': 'خدمة مخصصة لنقل الشحنات بين الدول مع متابعة المتطلبات والإجراءات اللازمة.',
      'الشحن المحلي': 'حل سريع ومرن لتوصيل الشحنات داخل المدن والمناطق المحلية بكفاءة.',
      'الشحن الثقيل / Cargo': 'خدمة للشحنات الكبيرة أو الثقيلة التي تحتاج ترتيبات نقل وتجهيز خاصة.',
      'التخليص الجمركي': 'إنجاز معاملات التخليص الجمركي وتجهيز المستندات لتسريع عبور الشحنة.',
      'خدمة عدم الممانعة': 'مساعدة في إصدار ومتابعة مستندات عدم الممانعة المطلوبة لبعض الشحنات.',
      'خدمات الجوازات الأردنية': 'خدمات مخصصة لاستلام وتسليم ومعالجة معاملات الجوازات الأردنية.',
      'خدمة توصيل جوازات السفارة الأمريكية': 'تنسيق وتسليم جوازات السفارة الأمريكية بطريقة آمنة ومنظمة.',
      'خدمات التخزين والـ 3PL': 'حلول تخزين وتشغيل لوجستي متكاملة لإدارة المخزون والتوزيع.',
      'خدمة الاستلام من العميل': 'استلام الشحنة من موقع العميل مباشرة لتسهيل بدء عملية الشحن.',
      'خدمة التوصيل للباب': 'إيصال الشحنة إلى عنوان المستلم النهائي بسرعة وراحة أكبر.',
      'خدمة الدفع عند الاستلام COD': 'خدمة تحصيل قيمة الشحنة عند التسليم وتحويلها وفق آلية متفق عليها.',
      'خدمة المستندات Documents': 'شحن المستندات والملفات الرسمية بسرعة مع عناية خاصة بحساسيتها.',
      'خدمة الطرود Packages': 'خدمة مخصصة للطرود بمختلف الأحجام مع خيارات شحن مناسبة.',
      'خدمة البضائع التجارية': 'نقل البضائع التجارية مع مراعاة احتياجات الشركات والفواتير والوثائق.',
    },
    en: {
      'International Shipping': 'A tailored service for moving shipments across countries with the required procedures in place.',
      'Domestic Shipping': 'A fast and flexible option for delivering shipments across local cities and areas.',
      'Heavy Shipping / Cargo': 'Built for oversized or heavy shipments that require special handling and transport planning.',
      'Customs Clearance': 'Support for customs processing and paperwork to help your shipment move faster.',
      'No-Objection Service': 'Assistance with obtaining and following up on no-objection documents for eligible shipments.',
      'Jordanian Passport Services': 'Dedicated handling for receiving, delivering, and processing Jordanian passport-related requests.',
      'US Embassy Passport Delivery Service': 'Secure coordination and delivery service for US embassy passports.',
      'Storage and 3PL Services': 'Integrated storage and third-party logistics solutions for inventory and distribution.',
      'Customer Pickup Service': 'We collect the shipment directly from the customer location to simplify the process.',
      'Door Delivery Service': 'A convenient service that delivers shipments directly to the final recipient address.',
      'Cash on Delivery (COD)': 'Collect shipment payments upon delivery and transfer them through an agreed settlement process.',
      'Documents Service': 'Fast and careful shipping for official documents and sensitive paperwork.',
      'Packages Service': 'A dedicated parcel service for different package sizes with suitable shipping options.',
      'Commercial Goods Service': 'Transport solutions for commercial goods with business-focused documentation support.',
    },
  } as const;

  const itemDescription = (item: string) => {
    if (lang === 'en') {
      return itemDescriptions.en[item as keyof typeof itemDescriptions.en] ?? `Everything you need to know about ${item}.`;
    }
    return itemDescriptions.ar[item as keyof typeof itemDescriptions.ar] ?? `كل ما تحتاج معرفته حول ${item}.`;
  };

  const resolveQueryLanguage = (input: string): 'ar' | 'en' => {
    if (/[\u0600-\u06FF]/.test(input)) return 'ar';
    if (/[A-Za-z]/.test(input)) return 'en';
    return lang === 'ar' ? 'ar' : 'en';
  };

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, 5);
      try { localStorage.setItem('wassel_recent_searches', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((q) => q !== query);
      try { localStorage.setItem('wassel_recent_searches', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const isTrackingQuery = (q: string): string | null => {
    const stripped = q.trim();
    // Matches: "track 123", "تتبع 123", "تتبع: 123", or bare long numbers (8+ digits)
    const explicit = stripped.match(/^(?:track|تتبع)[:\s]+([\w\d]+)/i);
    if (explicit) return explicit[1];
    const bareNumber = stripped.match(/^(\d{8,})$/);
    if (bareNumber) return bareNumber[1];
    return null;
  };

  const executeSearch = async () => {
    if (!searchQuery.trim()) return;
    setSuggestionsOpen(false);
    saveRecentSearch(searchQuery);

    // Intercept tracking queries and redirect to the Tracking popup
    const trackingId = isTrackingQuery(searchQuery);
    if (trackingId && onTrack) {
      setIsSearchPaletteOpen(false);
      onTrack(trackingId);
      return;
    }
    
    setLoading(true);
    setAiData(null);

    // Only fetch from KB when the user explicitly selected a suggestion item.
    const kbQuestionId = selectedSuggestionId;
    const queryLanguage = resolveQueryLanguage(searchQuery);

    if (kbQuestionId !== null) {
      try {
        const response = await getKbQuestionAnswer(kbQuestionId, queryLanguage);
        setAiData({
          answer: response.answer,
          relatedTopics: [response.topicName],
        });
        setPaletteAiAnswer(null);
        setIsSearchPaletteOpen(false);
      } catch {
        setAiData({
          answer: lang === 'en'
            ? "Sorry, I couldn't load the knowledge base answer right now."
            : 'عذراً، تعذر تحميل إجابة قاعدة المعرفة حالياً.',
          relatedTopics: [],
        });
        setPaletteAiAnswer(null);
        setIsSearchPaletteOpen(false);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
        setPaletteAiLoading(true);
        setPaletteAiAnswer(null);
        const response = await getResourceSearchResponse(searchQuery);
        setAiData(response);
        setPaletteAiAnswer({
          query: searchQuery,
          answer: response.answer,
          relatedTopics: response.relatedTopics,
        });
        setIsSearchPaletteOpen(true);
    } catch (err) {
        const fallback = {
            answer: lang === 'en' ? "Sorry, I couldn't reach the knowledge base right now. Please try again." : "عذراً، لم أتمكن من الوصول إلى قاعدة المعرفة حالياً. يرجى المحاولة مرة أخرى.",
            relatedTopics: []
        };
        setAiData(fallback);
        setPaletteAiAnswer({
          query: searchQuery,
          answer: fallback.answer,
          relatedTopics: [],
        });
        setIsSearchPaletteOpen(true);
    } finally {
        setPaletteAiLoading(false);
        setLoading(false);
        setTimeout(() => paletteInputRef.current?.focus(), 0);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch();
  };

  const handleSuggestionSelect = async (item: QuestionSuggestionItem) => {
    setSearchQuery(item.question);
    setSelectedSuggestionId(item.questionId);
    setSuggestionsOpen(false);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    saveRecentSearch(item.question);

    setPaletteAiAnswer(null);
    setPaletteAiLoading(true);

    const queryLanguage = resolveQueryLanguage(item.question);

    try {
      const response = await getKbQuestionAnswer(item.questionId, queryLanguage);
      setPaletteAiAnswer({
        query: item.question,
        answer: response.answer,
        relatedTopics: [response.topicName],
      });
    } catch {
      setPaletteAiAnswer({
        query: item.question,
        answer: lang === 'en'
          ? "Sorry, I couldn't load the knowledge base answer right now."
          : 'عذراً، تعذر تحميل إجابة قاعدة المعرفة حالياً.',
        relatedTopics: [item.topicName],
      });
    } finally {
      setPaletteAiLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
      setSelectedSuggestionId(null);
      setSearchQuery(topic);
      setLoading(true);
      setAiData(null);
      getResourceSearchResponse(topic).then(response => {
          setAiData(response);
          setLoading(false);
      }).catch(() => setLoading(false));
  };

  const handleClear = () => {
      setSearchQuery('');
      setSelectedSuggestionId(null);
      setAiData(null);
      setPaletteAiAnswer(null);
      setPaletteAiLoading(false);
      setSuggestions([]);
      setSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
  };

  const handleResourceGroupSelect = (groupId: string) => {
    setSelectedResourceGroupId(groupId);
    resetSelectedResourceDetails();

    const nextPath = `${resourcesBasePath}/${groupId}`;
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const handleResourceItemSelect = async (item: string, itemIndex: number, shouldNavigate = true) => {
    setSelectedResourceItem(item);
    setRelatedFaqs([]);
    setRelatedFaqsError(null);
    setOpenRelatedFaqId(null);
    setRelatedFaqAnswers({});
    setLoadingRelatedFaqId(null);
    setRelatedFaqsLoading(true);

    if (shouldNavigate && selectedResourceGroupId) {
      const nextPath = toResourceItemPath(selectedResourceGroupId, item, itemIndex);
      if (location.pathname !== nextPath) {
        navigate(nextPath);
      }
    }

    try {
      const queryLanguage = resolveQueryLanguage(item);
      const matches = await suggestKbQuestions(item, queryLanguage);
      setRelatedFaqs(matches.slice(0, 8));
    } catch {
      setRelatedFaqsError(t.failedRelatedFaqs);
    } finally {
      setRelatedFaqsLoading(false);
    }
  };

  const handleRelatedFaqToggle = async (faq: QuestionSuggestionItem) => {
    if (openRelatedFaqId === faq.questionId) {
      setOpenRelatedFaqId(null);
      return;
    }

    setOpenRelatedFaqId(faq.questionId);

    if (relatedFaqAnswers[faq.questionId]) return;

    setLoadingRelatedFaqId(faq.questionId);
    try {
      const queryLanguage = resolveQueryLanguage(faq.question);
      const answerResponse = await getKbQuestionAnswer(faq.questionId, queryLanguage);
      setRelatedFaqAnswers((prev) => ({
        ...prev,
        [faq.questionId]: answerResponse.answer,
      }));
    } catch {
      setRelatedFaqAnswers((prev) => ({
        ...prev,
        [faq.questionId]: t.failedAnswer,
      }));
    } finally {
      setLoadingRelatedFaqId(null);
    }
  };

  useEffect(() => {
    // Only query suggestions when user typed enough text.
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(isSearchPaletteOpen && searchQuery.trim().length > 0);
      setSuggestionsLoading(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const queryLanguage = resolveQueryLanguage(searchQuery.trim());
        const items = await suggestKbQuestions(searchQuery.trim(), queryLanguage);
        if (!cancelled) {
          setSuggestions(items);
          setSuggestionsOpen(true);
          setActiveSuggestionIndex(-1);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestionsOpen(isSearchPaletteOpen && searchQuery.trim().length > 0);
        }
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, lang, isSearchPaletteOpen]);

  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const routeRootIndex = segments[0] === 'ar' || segments[0] === 'en' ? 1 : 0;
    if (segments[routeRootIndex] !== 'resources') return;

    const routeGroupId = segments[routeRootIndex + 1] ?? null;
    const routeItemSlug = segments[routeRootIndex + 2] ?? null;

    if (!routeGroupId) {
      if (selectedResourceGroupId !== null || selectedResourceItem !== null) {
        clearResourceSelection();
      }
      return;
    }

    if (!resourceGroupIdSet.has(routeGroupId)) {
      navigate(resourcesBasePath, { replace: true });
      return;
    }

    const routeGroup = allDisplayGroups.find((group) => group.id === routeGroupId) ?? null;
    if (!routeGroup) return;

    if (selectedResourceGroupId !== routeGroupId) {
      setSelectedResourceGroupId(routeGroupId);
      resetSelectedResourceDetails();
    }

    if (!routeItemSlug) {
      if (selectedResourceItem !== null) {
        resetSelectedResourceDetails();
      }
      return;
    }

    let decodedItemSlug = routeItemSlug;
    try {
      decodedItemSlug = routeItemSlug ? decodeURIComponent(routeItemSlug) : routeItemSlug;
    } catch {
      decodedItemSlug = routeItemSlug;
    }
    decodedItemSlug = decodedItemSlug ? normalizeCanonicalSlugInput(decodedItemSlug) : decodedItemSlug;

    const matchedItemIndex = routeGroup.items.findIndex((item, index) => {
      const canonicalSlug = getCanonicalItemSlug(routeGroupId, item, index);
      const localizedSlug = toSlug(item);
      return canonicalSlug === decodedItemSlug || localizedSlug === decodedItemSlug;
    });

    if (matchedItemIndex < 0) {
      navigate(`${resourcesBasePath}/${routeGroupId}`, { replace: true });
      return;
    }

    const matchedItem = routeGroup.items[matchedItemIndex];

    if (selectedResourceItem !== matchedItem) {
      void handleResourceItemSelect(matchedItem, matchedItemIndex, false);
    }
  }, [location.pathname, resourceGroupIdSet, allDisplayGroups, selectedResourceGroupId, selectedResourceItem, navigate, resourcesBasePath]);

  useEffect(() => {
    if (!isSearchPaletteOpen) return;
    const timer = setTimeout(() => paletteInputRef.current?.focus(), 20);
    return () => clearTimeout(timer);
  }, [isSearchPaletteOpen]);

  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchPaletteOpen(false);
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, []);

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(event.target as Node)) {
        setSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, []);

  // Helper to filter FAQs based on active tab
  const displayedFAQs = useMemo(() => {
      const allKeys = Object.keys(FAQ_DATA);
      let filteredKeys: string[] = [];

      if (activeFaqTab === 'general') {
          filteredKeys = ['general'];
      } else if (activeFaqTab === 'services') {
          filteredKeys = allKeys.filter(k => k.startsWith('service-') && !k.startsWith('service-corp-'));
      } else if (activeFaqTab === 'corporate') {
          filteredKeys = allKeys.filter(k => k.startsWith('service-corp-'));
      } else if (activeFaqTab === 'industries') {
          filteredKeys = allKeys.filter(k => !k.startsWith('service') && k !== 'general');
      }

      // Flatten the result
      let result: { category: string, q: string, a: string, id: string }[] = [];
      filteredKeys.forEach(key => {
          // Format category name for display
          let catName = key.replace('service-corp-', '').replace('service-', '').replace(/-/g, ' ');
          catName = catName.charAt(0).toUpperCase() + catName.slice(1);
          
          FAQ_DATA[key].forEach((item, idx) => {
              result.push({
                  category: key === 'general' ? '' : catName, // Only show category label if not general
                  q: lang === 'en' ? item.q.en : item.q.ar,
                  a: lang === 'en' ? item.a.en : item.a.ar,
                  id: `${key}-${idx}`
              });
          });
      });
      return result;
  }, [activeFaqTab, lang]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Search Section */}
      <div className="bg-wassel-blue relative overflow-hidden pb-20 pt-36 md:pt-52">
        {/* Subtle background shapes */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-wassel-yellow/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-3xl mx-auto px-4 relative z-30 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight animate-slide-up">
                <span className="mr-3 rtl:ml-3 rtl:mr-0">👋</span>{t.heroTitle}
            </h1>
            <p className="text-base md:text-lg text-blue-200 mb-10 max-w-xl mx-auto animate-slide-up delay-100">
                {t.heroSubtitle}
            </p>

            {/* Search Box Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchPaletteOpen(true)}
              className="relative z-50 block w-full max-w-2xl mx-auto animate-slide-up delay-200"
            >
              <div className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-left rtl:text-right border border-gray-200">
                <div className="w-full py-4 pl-12 rtl:pl-4 rtl:pr-12 pr-28 text-base text-gray-400">
                  {searchQuery.trim() ? <span className="text-gray-700">{searchQuery}</span> : t.searchPlaceholder}
                </div>
                <Search className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <div className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-mono font-semibold border border-gray-200">
                    Ctrl
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-mono font-semibold border border-gray-200">
                    K
                  </span>
                </div>
              </div>
            </button>
        </div>
      </div>

      {/* Search Palette Modal */}
      {isSearchPaletteOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#12214f]/40 backdrop-blur-sm px-4 pt-16" onClick={() => { if (!paletteAiLoading) setIsSearchPaletteOpen(false); }}>
          <form onSubmit={handleSearch} className="max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div ref={searchBoxRef} className="bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
              <div className="relative border-b border-gray-200">
                {paletteAiAnswer || paletteAiLoading ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPaletteAiAnswer(null);
                      setPaletteAiLoading(false);
                      setSuggestionsOpen(searchQuery.trim().length > 0);
                    }}
                    className="absolute left-5 rtl:right-5 rtl:left-auto top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 transition-colors"
                    aria-label="Back"
                  >
                    <ArrowRight className="w-7 h-7 rotate-180 rtl:rotate-0" />
                  </button>
                ) : (
                  <Search className="absolute left-5 rtl:right-5 rtl:left-auto top-1/2 -translate-y-1/2 text-indigo-500 w-7 h-7" />
                )}
                <input
                  ref={paletteInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedSuggestionId(null);
                  }}
                  onFocus={() => setSuggestionsOpen(searchQuery.trim().length > 0)}
                  onKeyDown={(e) => {
                    const hasQuery = searchQuery.trim().length > 0;
                    const selectableCount = hasQuery ? suggestions.length + 1 : suggestions.length;
                    if (!suggestionsOpen || selectableCount === 0) return;

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
                      if (hasQuery && activeSuggestionIndex === 0) {
                        void executeSearch();
                        return;
                      }

                      const suggestionIndex = hasQuery ? activeSuggestionIndex - 1 : activeSuggestionIndex;
                      if (suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
                        void handleSuggestionSelect(suggestions[suggestionIndex]);
                      }
                    }
                  }}
                  placeholder={t.palettePlaceholder}
                  className="w-full py-5 pl-16 rtl:pl-4 rtl:pr-16 pr-14 text-[2rem] leading-tight text-gray-800 placeholder:text-indigo-300 outline-none"
                  readOnly={paletteAiAnswer !== null || paletteAiLoading}
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
                    className="absolute right-16 rtl:left-16 rtl:right-auto top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-semibold px-3 py-2 z-10"
                  >
                    {lang === 'en' ? 'Clear' : 'مسح'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchPaletteOpen(false)}
                  className="absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              {(paletteAiAnswer || paletteAiLoading) && (
                <div className="border-b border-gray-200">
                  <div className="px-6 py-4 text-[1.9rem] text-indigo-300 font-semibold border-b border-gray-100">
                    {paletteAiLoading ? t.answering : t.askAnother}
                  </div>
                  <div className="px-6 py-4 text-[1.05rem] text-indigo-700 bg-indigo-50/40 border-b border-gray-100">
                    {t.verifyDisclaimer}
                  </div>
                  <div className="p-6 max-h-[48vh] overflow-auto bg-white">
                    {paletteAiLoading ? (
                      <div className="flex items-center gap-3 text-gray-500 text-lg">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t.answering}
                      </div>
                    ) : (
                      <div className="text-gray-800">
                        <h4 className="text-4xl font-bold mb-4">{paletteAiAnswer?.query}</h4>
                        <FormattedAnswer text={paletteAiAnswer?.answer ?? ''} className="text-[1.1rem]" />
                        {paletteAiAnswer && paletteAiAnswer.relatedTopics.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                            {paletteAiAnswer.relatedTopics.map((topic, idx) => (
                              <button
                                key={`${topic}-${idx}`}
                                type="button"
                                onClick={() => handleTopicClick(topic)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-wassel-blue hover:text-white transition-colors border border-gray-200"
                              >
                                {topic}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!paletteAiAnswer && !paletteAiLoading && searchQuery.trim().length === 0 && kbTopics.length > 0 && (
                <div className="border-b border-gray-200 px-4 py-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {lang === 'en' ? 'Browse topics' : 'تصفح المواضيع'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kbTopics.map((topic) => (
                      <button
                        key={topic.code}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(topic.name);
                          setSelectedSuggestionId(null);
                          setSuggestionsOpen(true);
                          setTimeout(() => paletteInputRef.current?.focus(), 0);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        {topic.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!paletteAiAnswer && !paletteAiLoading && !suggestionsOpen && searchQuery.trim().length === 0 && recentSearches.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-4 pt-4 pb-2 text-sm font-bold text-gray-700">
                    {lang === 'en' ? 'Recent searches' : 'عمليات البحث الأخيرة'}
                  </div>
                  {recentSearches.map((query) => (
                    <div
                      key={query}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 group transition-colors"
                    >
                      <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setSearchQuery(query); setSelectedSuggestionId(null); setTimeout(() => paletteInputRef.current?.focus(), 0); }}
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

              {suggestionsOpen && !paletteAiAnswer && !paletteAiLoading && (
                <div className="max-h-80 overflow-auto border-b border-gray-200">
                  {searchQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => { void executeSearch(); }}
                      className={`w-full text-left rtl:text-right px-4 py-4 border-b border-gray-200 transition-colors ${
                        activeSuggestionIndex === 0 ? 'bg-indigo-100' : 'bg-indigo-50 hover:bg-indigo-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-3xl sm:text-[2rem] leading-tight">
                        <Sparkles className="w-6 h-6 text-indigo-500 shrink-0" />
                        <span className="text-gray-600">{t.askAiLabel}</span>
                        <span className="text-blue-600 font-semibold">{searchQuery.trim()}</span>
                      </div>
                    </button>
                  )}

                  {searchQuery.trim().length > 0 && (
                    <div className="px-4 pt-4 pb-2 text-gray-700 font-bold text-sm uppercase tracking-wide">
                      {t.workflowsTitle}
                    </div>
                  )}

                  {suggestionsLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {lang === 'en' ? 'Searching suggestions...' : 'جاري البحث عن اقتراحات...'}
                    </div>
                  )}

                  {!suggestionsLoading && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      {lang === 'en' ? 'No suggestions found.' : 'لا توجد اقتراحات.'}
                    </div>
                  )}

                  {!suggestionsLoading && (() => {
                    const elements: React.ReactNode[] = [];
                    let lastTopic = '';
                    suggestions.forEach((item, index) => {
                      if (item.topicName !== lastTopic) {
                        lastTopic = item.topicName;
                        elements.push(
                          <div key={`topic-${item.topicName}-${index}`} className="px-4 pt-4 pb-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {item.topicName}
                          </div>
                        );
                      }
                      elements.push(
                        <button
                          type="button"
                          key={`${item.questionId}-${index}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { void handleSuggestionSelect(item); }}
                          className={`w-full text-left rtl:text-right px-4 py-3 transition-colors ${
                            index + 1 === activeSuggestionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-base text-gray-900 font-medium line-clamp-2">{item.question}</div>
                        </button>
                      );
                    });
                    return elements;
                  })()}
                </div>
              )}

              <div className="px-4 py-3 bg-gray-50 text-gray-500 text-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white text-gray-500">↓</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white text-gray-500">↑</span>
                  <span>{lang === 'en' ? 'Navigate' : 'تنقل'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 h-6 rounded border border-gray-300 bg-white text-gray-500 text-xs font-semibold">
                    <CornerDownLeft className="w-3 h-3" />
                  </span>
                  <span>{lang === 'en' ? 'Select' : 'اختيار'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 h-6 rounded border border-gray-300 bg-white text-gray-500 text-xs font-semibold">ESC</span>
                  <span>{lang === 'en' ? 'Close' : 'إغلاق'}</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      , document.body)}

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pb-20">
        
        {/* Standard Resources Grid */}
        <div className="mb-16">
          {!selectedResourceGroup && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDisplayGroups
                .filter(group => activeCodes === null || activeCodes.has(group.id))
                .map((group) => {
                  const apiMeta = apiCategoryMap[group.id];
                  const displayTitle = apiMeta
                    ? (lang === 'ar' ? apiMeta.title_ar : (apiMeta.title_en ?? group.title))
                    : group.title;
                  const resolvedImg = resolveGroupImage(group.id);
                  return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleResourceGroupSelect(group.id)}
                  className="bg-white rounded-3xl overflow-hidden text-left rtl:text-right group transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`${sharedResourceCardColor} h-44 relative overflow-hidden flex items-center justify-center`}>
                    {resolvedImg ? (
                      <img
                        src={resolvedImg}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-70">
                          <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/30" />
                          <div className="absolute bottom-4 right-6 w-24 h-24 rounded-full border border-white/40" />
                          <div className="absolute top-10 right-16 w-20 h-2 rounded-full bg-white/40" />
                          <div className="absolute top-16 right-20 w-14 h-2 rounded-full bg-white/30" />
                        </div>
                        <div className="relative w-24 h-24 rounded-3xl bg-white/80 flex items-center justify-center backdrop-blur-sm">
                          <group.icon className="w-10 h-10 opacity-90 shrink-0" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{displayTitle}</h3>
                    <p className="text-gray-600 text-base leading-relaxed mb-4 min-h-[72px]">
                      {groupDescription(group.id)}
                    </p>
                  </div>
                </button>
                  );
                })}
            </div>
          )}

          {selectedResourceGroup && (
            <div className="pt-6 md:pt-8">
              <div
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="mb-5 inline-flex items-center gap-2 text-[15px] text-gray-400 text-left rtl:text-right"
              >
                <button
                  type="button"
                  onClick={() => {
                    clearResourceSelection();
                    if (location.pathname !== resourcesBasePath) {
                      navigate(resourcesBasePath);
                    }
                  }}
                  className="font-medium text-gray-400 hover:text-wassel-blue transition-colors"
                >
                  {t.allCollections}
                </button>
                <span className="text-gray-400">&gt;</span>
                {selectedResourceItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResourceItem(null);
                      navigate(`${resourcesBasePath}/${selectedResourceGroupId}`);
                    }}
                    className="font-medium text-gray-400 hover:text-wassel-blue transition-colors"
                  >
                    {selectedResourceGroup.title}
                  </button>
                ) : (
                  <span className="text-gray-900 font-medium">{selectedResourceGroup.title}</span>
                )}
                {selectedResourceItem && (
                  <>
                    <span className="text-gray-400">&gt;</span>
                    <span className="text-gray-900 font-medium line-clamp-1">{selectedResourceItem}</span>
                  </>
                )}
              </div>

              <div className="mb-8 text-left rtl:text-right">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-3">{selectedResourceGroup.title}</h2>
                {!selectedResourceItem ? (
                  <p className="text-gray-600 text-lg">
                    {lang === 'en'
                      ? 'Choose a topic below to explore detailed information.'
                      : 'اختر موضوعاً من القائمة التالية لاستعراض التفاصيل.'}
                  </p>
                ) : (
                  <div className="flex items-center gap-4">
                    <p className="text-gray-600 text-lg">{t.relatedFaqsSubtitle}</p>
                    <button
                      type="button"
                      onClick={() => {
                        resetSelectedResourceDetails();
                        if (selectedResourceGroupId) {
                          navigate(`${resourcesBasePath}/${selectedResourceGroupId}`);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
                      {t.backToItems}
                    </button>
                  </div>
                )}
              </div>

              {!selectedResourceItem && (
                selectedResourceGroup.id === 'forms-downloads' ? (
                  <div className="space-y-10">
                    {downloadCategories.map((category) => (
                      <div key={category.id}>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 rtl:text-right">{category.title}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {category.files.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              download
                              className={`flex flex-col gap-3 p-5 rounded-2xl border ${category.color} hover:shadow-md transition-all duration-200 group`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/70 shadow-sm shrink-0 ${category.iconColor}`}>
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${category.badgeColor} shrink-0`}>
                                  {file.format}
                                </span>
                              </div>
                              <div className="flex-1 text-left rtl:text-right">
                                <p className="text-[15px] font-semibold text-gray-900 leading-snug mb-1 group-hover:text-wassel-blue transition-colors">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{file.description}</p>
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/5">
                                <span className="text-xs text-gray-400">{file.size}</span>
                                <div className={`flex items-center gap-1 text-xs font-semibold ${category.iconColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                  <Download className="w-3.5 h-3.5" />
                                  {lang === 'ar' ? 'تنزيل' : 'Download'}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(() => {
                      const apiItems = apiSubItems[selectedResourceGroup.id];
                      const displayItems: string[] = apiItems && apiItems.length > 0
                        ? apiItems.map(i => lang === 'en' ? (i.title_en ?? i.title_ar) : i.title_ar)
                        : selectedResourceGroup.items;
                      return displayItems.map((item, index) => (
                      <button
                        type="button"
                        onClick={() => { void handleResourceItemSelect(item, index); }}
                        key={`${selectedResourceGroup.id}-${index}`}
                        className="bg-white rounded-[1.75rem] border border-gray-200 p-7 text-left rtl:text-right min-h-[170px] hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="text-[2rem] leading-tight font-bold text-gray-900 mb-3">{item}</h3>
                        <p className="text-gray-600 text-[1.05rem] leading-relaxed max-w-[30ch]">{itemDescription(item)}</p>
                      </button>
                      ));
                    })()}
                  </div>
                )
              )}

              {selectedResourceItem && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">{t.relatedFaqsTitle}</h3>

                  {relatedFaqsLoading && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 text-gray-600 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.loadingRelatedFaqs}
                    </div>
                  )}

                  {!relatedFaqsLoading && relatedFaqsError && (
                    <div className="bg-white rounded-2xl border border-red-100 p-5 text-red-600">
                      {relatedFaqsError}
                    </div>
                  )}

                  {!relatedFaqsLoading && !relatedFaqsError && relatedFaqs.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 text-gray-600">
                      {t.noRelatedFaqs}
                    </div>
                  )}

                  {!relatedFaqsLoading && !relatedFaqsError && relatedFaqs.length > 0 && (
                    <div className="space-y-3">
                      {relatedFaqs.map((faq) => {
                        const isOpen = openRelatedFaqId === faq.questionId;
                        const answer = relatedFaqAnswers[faq.questionId];
                        const isAnswerLoading = loadingRelatedFaqId === faq.questionId;

                        return (
                          <div key={faq.questionId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => { void handleRelatedFaqToggle(faq); }}
                              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left rtl:text-right hover:bg-gray-50 transition-colors"
                            >
                              <div>
                                <p className="text-xl font-semibold text-gray-900">{faq.question}</p>
                                <p className="text-sm text-gray-500 mt-1">{faq.topicName}</p>
                              </div>
                              {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 mt-1" /> : <ChevronDown className="w-5 h-5 text-gray-400 mt-1" />}
                            </button>

                            {isOpen && (
                              <div className="px-5 pb-5 border-t border-gray-100">
                                {isAnswerLoading ? (
                                  <div className="flex items-center gap-2 text-gray-600 mt-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t.loadingAnswer}
                                  </div>
                                ) : (
                                  <FormattedAnswer text={answer ?? ''} className="mt-4" />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
