import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Book, FileText, Box, AlertCircle, HelpCircle, ChevronRight, Download, Globe, Loader2, ArrowRight, Lightbulb, ChevronDown, ChevronUp, Package, Bell, Calculator, Building2 } from 'lucide-react';
import { Language } from '../../types';
import { FAQ_DATA } from '../../data/faqs';
import { suggestKbQuestions, getKbQuestionAnswer, getRelatedKbQuestions, QuestionSuggestionItem, RelatedQuestionItem } from '../../services/questionsKbService';
import { FormattedAnswer } from '../FormattedAnswer';
import { AssistantSearchPalette } from '../shared/AssistantSearchPalette';

interface ResourcesProps {
  lang: Language;
  onTrack?: (trackingId: string) => void;
  /** Opens one of the shared tool popups: 'tracking' | 'rates' | 'quote' | 'notify' | 'open-account'. */
  onAction?: (action: string) => void;
}

export const Resources: React.FC<ResourcesProps> = ({ lang, onTrack, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [selectedResourceGroupId, setSelectedResourceGroupId] = useState<string | null>(null);

  // Hero mouse-parallax: the two ambient blobs and a cursor-following glow are moved
  // by directly mutating their DOM style on mousemove (no React state/re-render) so the
  // effect stays cheap. Disabled for prefers-reduced-motion, and naturally inert on touch
  // devices since no mousemove fires there.
  const heroBlob1Ref = useRef<HTMLDivElement>(null);
  const heroBlob2Ref = useRef<HTMLDivElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotionRef = useRef(false);
  useEffect(() => {
    prefersReducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotionRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const offsetX = (x / rect.width - 0.5) * 2;   // -1..1
    const offsetY = (y / rect.height - 0.5) * 2;  // -1..1

    if (heroBlob1Ref.current) {
      heroBlob1Ref.current.style.transform = `translate3d(${offsetX * 18}px, ${offsetY * 18}px, 0)`;
    }
    if (heroBlob2Ref.current) {
      heroBlob2Ref.current.style.transform = `translate3d(${offsetX * -14}px, ${offsetY * -14}px, 0)`;
    }
    if (heroGlowRef.current) {
      heroGlowRef.current.style.transform = `translate3d(${x - 220}px, ${y - 220}px, 0)`;
      heroGlowRef.current.style.opacity = '1';
    }
  };
  const handleHeroMouseLeave = () => {
    if (heroBlob1Ref.current) heroBlob1Ref.current.style.transform = '';
    if (heroBlob2Ref.current) heroBlob2Ref.current.style.transform = '';
    if (heroGlowRef.current) heroGlowRef.current.style.opacity = '0';
  };
  // Guided navigation (FedEx-style drill-down) shown before a category is opened.
  const [guidedCategoryId, setGuidedCategoryId] = useState<string | null>(null);
  const [guidedSection, setGuidedSection] = useState<string | null>(null);
  const [selectedResourceItem, setSelectedResourceItem] = useState<string | null>(null);
  const [relatedFaqs, setRelatedFaqs] = useState<QuestionSuggestionItem[]>([]);
  const [relatedFaqsLoading, setRelatedFaqsLoading] = useState(false);
  const [relatedFaqsError, setRelatedFaqsError] = useState<string | null>(null);
  const [openRelatedFaqId, setOpenRelatedFaqId] = useState<number | null>(null);
  const [relatedFaqAnswers, setRelatedFaqAnswers] = useState<Record<number, string>>({});
  const [loadingRelatedFaqId, setLoadingRelatedFaqId] = useState<number | null>(null);

  // Selected KB question detail view (/{locale}/resources/question/{id}/{slug})
  const [selectedQuestion, setSelectedQuestion] = useState<{ questionId: number; question: string; answer: string; topicName: string } | null>(null);
  const [selectedQuestionLoading, setSelectedQuestionLoading] = useState(false);
  const [selectedQuestionError, setSelectedQuestionError] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<RelatedQuestionItem[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);

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
    description_ar: string | null; description_en: string | null; question_id: number | null;
    section_ar: string | null; section_en: string | null;
  }>>>({});
  // Load resource categories/sub-items once on mount (or when language changes)
  useEffect(() => {
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
  }, []);
  const [activeFaqTab, setActiveFaqTab] = useState<'general' | 'services' | 'corporate' | 'industries'>('general');
  const [openFaqIndex, setOpenFaqIndex] = useState<string | null>(null);

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
    viewMore: lang === 'en' ? 'View details' : 'عرض التفاصيل',
    relatedTopics: lang === 'en' ? 'Related Topics:' : 'مواضيع ذات صلة:',
    palettePlaceholder: lang === 'en' ? 'Search docs or ask AI a question' : 'ابحث في المصادر أو اسأل الذكاء الاصطناعي',
    workflowsTitle: lang === 'en' ? 'Suggestions' : 'اقتراحات',
    askAiLabel: lang === 'en' ? 'Ask AI:' : 'اسأل AI:',
    verifyDisclaimer: lang === 'en' ? 'Answers are generated with AI which can make mistakes. Verify responses.' : 'يتم توليد الإجابات بالذكاء الاصطناعي وقد تحتوي على أخطاء. يرجى التحقق.',
    askAnother: lang === 'en' ? 'Ask another question...' : 'اسأل سؤالا آخر...',
    answering: lang === 'en' ? 'Answering...' : 'جاري الإجابة...',
    backToSearch: lang === 'en' ? 'Back to search' : 'العودة للبحث',
    allCollections: lang === 'en' ? 'All Collections' : 'كل الأقسام',
    guidedBackToTopics: lang === 'en' ? 'Back to main topics' : 'العودة للمواضيع الرئيسية',
    guidedBackToCategory: lang === 'en' ? 'Back' : 'رجوع',
    guidedViewAll: lang === 'en' ? 'View all' : 'عرض الكل',
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
    backToTopics: lang === 'en' ? 'Back to search' : 'العودة للبحث',
    loadingQuestion: lang === 'en' ? 'Loading question...' : 'جاري تحميل السؤال...',
    questionNotFound: lang === 'en' ? "We couldn't find this question." : 'تعذر العثور على هذا السؤال.',
    youMightAskNext: lang === 'en' ? 'You might ask next' : 'قد تسأل بعد ذلك',
    noFollowUpQuestions: lang === 'en' ? 'No follow-up questions found for this topic yet.' : 'لا توجد أسئلة متابعة لهذا الموضوع حالياً.',
    loadingFollowUps: lang === 'en' ? 'Loading follow-up questions...' : 'جاري تحميل أسئلة المتابعة...',
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
    setGuidedCategoryId(null);
    setGuidedSection(null);
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

  // Generic filler used only when a sub-item has no admin-entered description yet
  // (real descriptions now live in resource_sub_items.description_ar/description_en).
  const fallbackItemDescription = (item: string) =>
    lang === 'en' ? `Everything you need to know about ${item}.` : `كل ما تحتاج معرفته حول ${item}.`;

  const resolveQueryLanguage = (input: string): 'ar' | 'en' => {
    if (/[\u0600-\u06FF]/.test(input)) return 'ar';
    if (/[A-Za-z]/.test(input)) return 'en';
    return lang === 'ar' ? 'ar' : 'en';
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


  // Question detail route: /{locale}/resources/question/{id}/{slug?}
  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const routeRootIndex = segments[0] === 'ar' || segments[0] === 'en' ? 1 : 0;
    if (segments[routeRootIndex] !== 'resources' || segments[routeRootIndex + 1] !== 'question') {
      if (selectedQuestion || selectedQuestionLoading) {
        setSelectedQuestion(null);
        setSelectedQuestionError(null);
        setFollowUpQuestions([]);
      }
      return;
    }

    const questionId = parseInt(segments[routeRootIndex + 2] ?? '', 10);
    if (isNaN(questionId) || questionId <= 0) {
      navigate(resourcesBasePath, { replace: true });
      return;
    }

    if (selectedQuestion?.questionId === questionId) return;

    let cancelled = false;
    const queryLanguage = lang === 'ar' ? 'ar' : 'en';

    setSelectedQuestionLoading(true);
    setSelectedQuestionError(null);
    setSelectedQuestion(null);
    setFollowUpQuestions([]);

    getKbQuestionAnswer(questionId, queryLanguage)
      .then((response) => {
        if (cancelled) return;
        setSelectedQuestion({
          questionId: response.questionId,
          question: response.question,
          answer: response.answer,
          topicName: response.topicName,
        });
        setFollowUpLoading(true);
        return getRelatedKbQuestions(questionId, queryLanguage)
          .then((related) => { if (!cancelled) setFollowUpQuestions(related); })
          .catch(() => { if (!cancelled) setFollowUpQuestions([]); })
          .finally(() => { if (!cancelled) setFollowUpLoading(false); });
      })
      .catch(() => {
        if (!cancelled) setSelectedQuestionError(t.questionNotFound);
      })
      .finally(() => {
        if (!cancelled) setSelectedQuestionLoading(false);
      });

    return () => { cancelled = true; };
    // Deliberately excludes selectedQuestion/selectedQuestionLoading: this effect sets
    // both, so including them re-triggers itself mid-fetch — the resulting cleanup marks
    // the in-flight request "cancelled" right as it resolves, and the `!cancelled` guards
    // in .then()/.finally() then permanently skip clearing the loading state, leaving the
    // page stuck on "جاري تحميل السؤال..." even though the answer arrived successfully.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, lang, navigate, resourcesBasePath, t.questionNotFound]);

  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const routeRootIndex = segments[0] === 'ar' || segments[0] === 'en' ? 1 : 0;
    if (segments[routeRootIndex] !== 'resources' || segments[routeRootIndex + 1] === 'question') return;

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
    <div className="bg-[#F6F8FB] min-h-screen">
      {/* Hero Search Section */}
      <div
        className="bg-wassel-blue relative overflow-hidden pb-20 pt-36 md:pt-52"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* Subtle background shapes — lean toward the cursor on mousemove */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div ref={heroBlob1Ref} className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl transition-transform duration-300 ease-out will-change-transform"></div>
            <div ref={heroBlob2Ref} className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-wassel-yellow/10 rounded-full blur-3xl transition-transform duration-300 ease-out will-change-transform"></div>
            {/* Soft glow that trails the pointer */}
            <div
              ref={heroGlowRef}
              className="absolute top-0 left-0 w-[440px] h-[440px] rounded-full bg-wassel-yellow/10 blur-[110px] opacity-0 transition-opacity duration-300 will-change-transform"
            ></div>
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
                  {t.searchPlaceholder}
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

      {/* Quick Tools — landing view only; hidden while a KB question or resource detail is open
          so its negative top margin doesn't collide with the detail breadcrumb. */}
      {onAction && !selectedQuestion && !selectedQuestionLoading && !selectedQuestionError && !selectedResourceGroup && (
        <div className="max-w-5xl mx-auto px-4 relative z-40 -mt-10 mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: 'tracking', icon: Package, label: lang === 'en' ? 'Track a shipment' : 'تتبّع شحنة' },
              { id: 'notify', icon: Bell, label: lang === 'en' ? 'Notify me on arrival' : 'أبلغني عند الوصول' },
              { id: 'rates', icon: Calculator, label: lang === 'en' ? 'Get instant rates' : 'أسعار فورية' },
              { id: 'quote', icon: FileText, label: lang === 'en' ? 'Request a quote' : 'طلب عرض سعر' },
              { id: 'open-account', icon: Building2, label: lang === 'en' ? 'Open a business account' : 'فتح حساب تجاري' },
            ].map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => onAction(tool.id)}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-wassel-blue/30 transition-all p-4 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-wassel-blue/5 text-wassel-blue group-hover:bg-wassel-blue group-hover:text-white transition-colors">
                  <tool.icon className="w-5 h-5" />
                </span>
                <span className="text-sm font-semibold text-gray-800 leading-tight">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Palette Modal */}
      {isSearchPaletteOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#12214f]/40 backdrop-blur-sm px-4 pt-16" onClick={() => setIsSearchPaletteOpen(false)}>
          <div className="max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <AssistantSearchPalette
              lang={lang}
              onClose={() => setIsSearchPaletteOpen(false)}
              onInterceptQuery={(query) => {
                const trackingId = isTrackingQuery(query);
                if (trackingId && onTrack) {
                  onTrack(trackingId);
                  return true;
                }
                return false;
              }}
              onSelectSuggestion={(item) => {
                setIsSearchPaletteOpen(false);
                navigate(`${resourcesBasePath}/question/${item.questionId}/${encodeURIComponent(toSlug(item.question))}`);
              }}
            />
          </div>
        </div>
      , document.body)}

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pb-20">

        {/* KB Question Detail View */}
        {(selectedQuestion || selectedQuestionLoading || selectedQuestionError) && (
          <div className="mb-16 -mt-16 md:-mt-20 relative z-20">
            <div
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 text-left rtl:text-right bg-white rounded-full border border-gray-100 px-4 py-2 shadow-sm"
            >
              <button
                type="button"
                onClick={() => navigate(resourcesBasePath)}
                className="font-medium text-gray-400 hover:text-wassel-blue transition-colors"
              >
                {t.allCollections}
              </button>
              {selectedQuestion && (
                <>
                  <span className="text-gray-400">&gt;</span>
                  <span className="text-gray-900 font-medium line-clamp-1">{selectedQuestion.question}</span>
                </>
              )}
            </div>

            {selectedQuestionLoading && (
              <div className="bg-white rounded-[1.75rem] ring-1 ring-gray-100 shadow-sm p-6 text-gray-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.loadingQuestion}
              </div>
            )}

            {!selectedQuestionLoading && selectedQuestionError && (
              <div className="bg-white rounded-[1.75rem] ring-1 ring-red-100 shadow-sm p-6 text-red-600">
                {selectedQuestionError}
              </div>
            )}

            {!selectedQuestionLoading && selectedQuestion && (
              <>
                <div className="mb-8 text-left rtl:text-right bg-white rounded-[1.75rem] ring-1 ring-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_1px_rgba(15,23,42,0.03)] p-6 md:p-10">
                  <p className="text-sm font-bold text-wassel-blue uppercase tracking-wide mb-3">{selectedQuestion.topicName}</p>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 text-balance">{selectedQuestion.question}</h2>
                  <FormattedAnswer text={selectedQuestion.answer} className="text-lg text-gray-700" />
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">{t.youMightAskNext}</h3>

                  {followUpLoading && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 text-gray-600 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.loadingFollowUps}
                    </div>
                  )}

                  {!followUpLoading && followUpQuestions.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 text-gray-600">
                      {t.noFollowUpQuestions}
                    </div>
                  )}

                  {!followUpLoading && followUpQuestions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {followUpQuestions.map((q) => (
                        <button
                          key={q.questionId}
                          type="button"
                          onClick={() => navigate(`${resourcesBasePath}/question/${q.questionId}/${encodeURIComponent(toSlug(q.question))}`)}
                          className="group text-left rtl:text-right bg-white rounded-2xl ring-1 ring-gray-100 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:ring-wassel-blue/20 hover:shadow-[0_12px_28px_-14px_rgba(0,43,73,0.25)] hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <p className="text-[15px] font-semibold text-gray-900 group-hover:text-wassel-blue transition-colors">{q.question}</p>
                          <p className="text-sm text-gray-500 mt-1">{q.topicName}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Standard Resources Grid */}
        <div className={`mb-16 -mt-16 md:-mt-20 relative z-20 ${(selectedQuestion || selectedQuestionLoading || selectedQuestionError) ? 'hidden' : ''}`}>
          {!selectedResourceGroup && (() => {
            const categories = allDisplayGroups.filter(group => activeCodes === null || activeCodes.has(group.id));
            const activeCategory = guidedCategoryId ? categories.find(g => g.id === guidedCategoryId) ?? null : null;
            const categoryApiItems = activeCategory ? (apiSubItems[activeCategory.id] ?? []) : [];
            const categoryTitle = activeCategory
              ? (apiCategoryMap[activeCategory.id]
                  ? (lang === 'ar' ? apiCategoryMap[activeCategory.id].title_ar : (apiCategoryMap[activeCategory.id].title_en ?? activeCategory.title))
                  : activeCategory.title)
              : '';

            const sectionOf = (i: typeof categoryApiItems[number]) => lang === 'en' ? (i.section_en ?? i.section_ar) : i.section_ar;
            const hasSections = categoryApiItems.some(i => sectionOf(i));

            const sectionLabels: string[] = [];
            if (hasSections) {
              for (const item of categoryApiItems) {
                const label = sectionOf(item);
                if (label && !sectionLabels.includes(label)) sectionLabels.push(label);
              }
            }

            // Flat categories (no sections) fall back to the static item list when the API has none yet.
            const flatItems = categoryApiItems.length > 0
              ? categoryApiItems
              : (activeCategory?.items ?? []).map((title, i) => ({ title_ar: title, title_en: title, question_id: null as number | null, __fallbackIndex: i }));

            const itemsInSection = guidedSection
              ? categoryApiItems.filter(i => sectionOf(i) === guidedSection)
              : [];

            const openItem = (titleAr: string, titleEn: string | null, questionId: number | null, index: number) => {
              const title = lang === 'en' ? (titleEn ?? titleAr) : titleAr;
              if (questionId) {
                navigate(`${resourcesBasePath}/question/${questionId}/${encodeURIComponent(toSlug(title))}`);
                return;
              }
              if (!activeCategory) return;
              setSelectedResourceGroupId(activeCategory.id);
              void handleResourceItemSelect(title, index, false);
              navigate(toResourceItemPath(activeCategory.id, title, index));
            };

            const level: 0 | 1 | 2 = !activeCategory ? 0 : (hasSections && !guidedSection) ? 1 : 2;

            return (
              <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="bg-white rounded-[1.75rem] ring-1 ring-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-24px_rgba(0,43,73,0.16)] overflow-hidden">
                <div className="px-5 md:px-6 pt-5 pb-4 border-b border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-wassel-blue/60">{t.categoriesTitle}</p>
                </div>
                <div className="flex flex-col md:flex-row md:divide-x md:divide-gray-100 rtl:md:divide-x-reverse">

                  {/* Panel 0 — main topics */}
                  <div className={`md:w-1/3 md:shrink-0 ${level === 0 ? 'block' : 'hidden md:block'}`}>
                    <ul className="divide-y divide-gray-50">
                      {categories.map(group => {
                        const apiMeta = apiCategoryMap[group.id];
                        const displayTitle = apiMeta
                          ? (lang === 'ar' ? apiMeta.title_ar : (apiMeta.title_en ?? group.title))
                          : group.title;
                        const isActive = group.id === guidedCategoryId;
                        return (
                          <li key={group.id}>
                            <button
                              type="button"
                              onClick={() => { setGuidedCategoryId(group.id); setGuidedSection(null); }}
                              className={`relative w-full flex items-center gap-3 px-5 py-4 text-start transition-colors ${isActive ? 'bg-wassel-blue/5' : 'hover:bg-gray-50'}`}
                            >
                              {isActive && (
                                <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 w-[3px] bg-wassel-yellow" />
                              )}
                              <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${isActive ? 'bg-gradient-to-br from-wassel-blue to-[#00518a] text-white shadow-md shadow-wassel-blue/20' : 'bg-gray-100 text-gray-500'}`}>
                                <group.icon className="w-4 h-4" />
                              </span>
                              <span className={`flex-1 text-[15px] font-semibold ${isActive ? 'text-wassel-blue' : 'text-gray-800'}`}>{displayTitle}</span>
                              <ChevronRight className={`w-4 h-4 shrink-0 rtl:rotate-180 ${isActive ? 'text-wassel-blue' : 'text-gray-300'}`} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Panel 1 — sections, or items directly for flat categories */}
                  {activeCategory && (
                    <div className={`md:w-1/3 md:shrink-0 ${level === 1 ? 'block' : 'hidden md:block'}`}>
                      <button
                        type="button"
                        onClick={() => setGuidedCategoryId(null)}
                        className="md:hidden w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-500 border-b border-gray-50 bg-gray-50/60"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
                        {t.guidedBackToTopics}
                      </button>
                      <h4 className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-wassel-blue/60">{categoryTitle}</h4>
                      <ul className="divide-y divide-gray-50">
                        {hasSections
                          ? sectionLabels.map(label => (
                              <li key={label}>
                                <button
                                  type="button"
                                  onClick={() => setGuidedSection(label)}
                                  className={`relative w-full flex items-center gap-3 px-5 py-3.5 text-start transition-colors ${guidedSection === label ? 'bg-wassel-blue/5 text-wassel-blue' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                  {guidedSection === label && (
                                    <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 w-[3px] bg-wassel-yellow" />
                                  )}
                                  <span className="flex-1 text-sm font-medium">{label}</span>
                                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 rtl:rotate-180 ${guidedSection === label ? 'text-wassel-blue' : 'text-gray-300'}`} />
                                </button>
                              </li>
                            ))
                          : flatItems.map((item, index) => (
                              <li key={('id' in item ? item.id : index)}>
                                <button
                                  type="button"
                                  onClick={() => openItem(item.title_ar, item.title_en, item.question_id, index)}
                                  className="w-full flex items-center gap-3 px-5 py-3.5 text-start text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <span className="flex-1 text-sm font-medium">{lang === 'en' ? (item.title_en ?? item.title_ar) : item.title_ar}</span>
                                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-300 rtl:rotate-180" />
                                </button>
                              </li>
                            ))
                        }
                        <li>
                          <button
                            type="button"
                            onClick={() => handleResourceGroupSelect(activeCategory.id)}
                            className="w-full px-5 py-3.5 text-start text-xs font-bold uppercase tracking-wide text-wassel-blue hover:bg-wassel-blue/5 transition-colors"
                          >
                            {t.guidedViewAll}
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Panel 2 — items within the selected section */}
                  {activeCategory && hasSections && guidedSection && (
                    <div className={`md:w-1/3 md:shrink-0 ${level === 2 ? 'block' : 'hidden md:block'}`}>
                      <button
                        type="button"
                        onClick={() => setGuidedSection(null)}
                        className="md:hidden w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-500 border-b border-gray-50 bg-gray-50/60"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
                        {t.guidedBackToCategory}
                      </button>
                      <h4 className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-wassel-blue/60">{guidedSection}</h4>
                      <ul className="divide-y divide-gray-50">
                        {itemsInSection.map((item, index) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => openItem(item.title_ar, item.title_en, item.question_id, index)}
                              className="w-full flex items-center gap-3 px-5 py-3.5 text-start text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <span className="flex-1 text-sm font-medium">{lang === 'en' ? (item.title_en ?? item.title_ar) : item.title_ar}</span>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-300 rtl:rotate-180" />
                            </button>
                          </li>
                        ))}
                        <li>
                          <button
                            type="button"
                            onClick={() => handleResourceGroupSelect(activeCategory.id)}
                            className="w-full px-5 py-3.5 text-start text-xs font-bold uppercase tracking-wide text-wassel-blue hover:bg-wassel-blue/5 transition-colors"
                          >
                            {t.guidedViewAll}
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {selectedResourceGroup && (
            <div className="pt-6 md:pt-8">
              <div
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 text-left rtl:text-right bg-white rounded-full border border-gray-100 px-4 py-2 shadow-sm"
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
                  <div className="space-y-10">
                    {(() => {
                      const apiItems = apiSubItems[selectedResourceGroup.id];
                      const displayItems: Array<{ title: string; description: string | null; questionId: number | null; section: string | null }> = apiItems && apiItems.length > 0
                        ? apiItems.map(i => ({
                            title: lang === 'en' ? (i.title_en ?? i.title_ar) : i.title_ar,
                            description: lang === 'en' ? i.description_en : i.description_ar,
                            questionId: i.question_id,
                            section: lang === 'en' ? (i.section_en ?? i.section_ar) : i.section_ar,
                          }))
                        : selectedResourceGroup.items.map(title => ({ title, description: null, questionId: null, section: null }));
                      const GroupIcon = selectedResourceGroup.icon;

                      // Group consecutive items sharing a section label — sub-items are
                      // already ordered so each section's cards stay contiguous.
                      const sections: Array<{ label: string | null; items: typeof displayItems }> = [];
                      for (const item of displayItems) {
                        const last = sections[sections.length - 1];
                        if (last && last.label === item.section) last.items.push(item);
                        else sections.push({ label: item.section, items: [item] });
                      }

                      let globalIndex = 0;
                      return sections.map((section, sectionIdx) => (
                        <div key={`${selectedResourceGroup.id}-section-${sectionIdx}`}>
                          {section.label && (
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{section.label}</h3>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map(({ title, description, questionId }) => {
                              const index = globalIndex++;
                              return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (questionId) {
                                    navigate(`${resourcesBasePath}/question/${questionId}/${encodeURIComponent(toSlug(title))}`);
                                  } else {
                                    void handleResourceItemSelect(title, index);
                                  }
                                }}
                                key={`${selectedResourceGroup.id}-${index}`}
                                className="group relative flex flex-col items-start gap-4 overflow-hidden bg-white rounded-[1.75rem] p-6 text-left rtl:text-right ring-1 ring-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_1px_rgba(15,23,42,0.03)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_40px_-16px_rgba(0,43,73,0.22)] hover:ring-wassel-blue/10"
                              >
                                <div className="pointer-events-none absolute -top-8 -right-8 rtl:-right-auto rtl:-left-8 w-32 h-32 rounded-full bg-gradient-to-br from-wassel-yellow/20 to-transparent blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-wassel-blue to-[#00518a] text-white shadow-md shadow-wassel-blue/20 transition-transform duration-300 ease-out group-hover:scale-110">
                                  <GroupIcon className="w-5 h-5" />
                                </div>

                                <div className="relative">
                                  <h4 className="text-lg font-bold text-gray-900 mb-1.5 leading-snug tracking-tight">{title}</h4>
                                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{description || fallbackItemDescription(title)}</p>
                                </div>

                                <div className="relative flex items-center gap-1 text-xs font-bold text-wassel-blue">
                                  <span className="opacity-0 -translate-x-1 rtl:translate-x-1 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0">
                                    {t.viewMore}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 transition-transform duration-300 ease-out group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                                </div>
                              </button>
                              );
                            })}
                          </div>
                        </div>
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