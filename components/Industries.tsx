import React, { useEffect, useState, useRef } from 'react';
import { 
  Landmark, 
  HeartPulse, 
  ShoppingCart, 
  Building2, 
  Factory, 
  Monitor, 
  Briefcase, 
  Truck, 
  Mail, 
  ShieldCheck, 
  Clock, 
  Globe, 
  Archive, 
  Gift, 
  FileSignature, 
  Database, 
  Box, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Phone, 
  BarChart3, 
  Users,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Language } from '../types';
import { FAQ_DATA } from '../data/faqs';

interface IndustriesProps {
  lang: Language;
  isEmbedded?: boolean;
}

interface Customer {
    en: string;
    ar: string;
    logo?: string;
    domain?: string;
}

const CustomerLogo = ({ customer, lang }: { customer: Customer, lang: Language }) => {
    const [imgError, setImgError] = useState(false);
    const logoUrl = customer.logo || (customer.domain ? `https://logo.clearbit.com/${customer.domain}` : null);

    return (
        <div className="group relative h-24 w-40 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center p-4 transition-all duration-300 cursor-default border border-gray-100 hover:shadow-md">
            {logoUrl && !imgError ? (
                <>
                    <div 
                        className="w-full h-full bg-gray-400 group-hover:bg-wassel-blue transition-colors duration-300"
                        style={{
                            maskImage: `url("${logoUrl}")`,
                            WebkitMaskImage: `url("${logoUrl}")`,
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain'
                        }}
                    />
                    <img 
                        src={logoUrl} 
                        alt={lang === 'en' ? customer.en : customer.ar}
                        className="hidden"
                        onError={() => setImgError(true)}
                    />
                </>
            ) : (
                <div className="text-center">
                    <span className="text-sm font-bold text-gray-500 group-hover:text-wassel-blue transition-colors">
                        {lang === 'en' ? customer.en : customer.ar}
                    </span>
                </div>
            )}
        </div>
    );
};

export const Industries: React.FC<IndustriesProps> = ({ lang, isEmbedded = false }) => {
  const [activeIndustryId, setActiveIndustryId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for hash changes to switch views
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveIndustryId(hash);
        // If embedded, scroll to the container, else scroll to top
        if (isEmbedded && containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }
      } else {
        setActiveIndustryId(null);
        if (!isEmbedded) window.scrollTo(0, 0);
      }
    };

    // Check on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isEmbedded]);

  const t = {
    title: lang === 'en' ? 'Industries We Serve' : 'القطاعات التي نخدمها',
    subtitle: lang === 'en' 
      ? 'Tailored logistics infrastructure designed for the specific needs of every sector.' 
      : 'بنية تحتية لوجستية مصممة خصيصاً لتلبية الاحتياجات المحددة لكل قطاع.',
    overviewBtn: lang === 'en' ? 'Back to All Industries' : 'العودة لجميع القطاعات',
    keyServices: lang === 'en' ? 'Key Services' : 'الخدمات الرئيسية',
    trustedBy: lang === 'en' ? 'Trusted By Leaders' : 'شركاء النجاح',
    challenge: lang === 'en' ? 'The Challenge' : 'التحدي',
    solution: lang === 'en' ? 'Wassel Solution' : 'حلول واصل',
    stat: lang === 'en' ? 'Impact' : 'الأثر',
    contactSpecialist: lang === 'en' ? 'Speak to a Specialist' : 'تحدث مع خبير',
    faqTitle: lang === 'en' ? 'Sector FAQs' : 'أسئلة شائعة حول القطاع'
  };

  const industries = [
    {
      id: 'banking',
      title: lang === 'en' ? 'Banking & Finance' : 'البنوك والتمويل',
      tagline: lang === 'en' ? 'Security, Confidentiality, Speed' : 'أمان، سرية، وسرعة',
      desc: lang === 'en' 
        ? 'A comprehensive suite of secured logistics ensuring safety, confidentiality, and speed for financial institutions. From daily mail runs to secure credit card delivery.' 
        : 'مجموعة شاملة من الخدمات اللوجستية الآمنة لضمان السلامة والسرية والسرعة للمؤسسات المالية. من جولات البريد اليومية إلى توصيل البطاقات البنكية.',
      icon: Landmark,
      color: 'bg-emerald-900', // Deep Green
      accent: 'text-emerald-400',
      heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: '99.9%', label: lang === 'en' ? 'Delivery Accuracy' : 'دقة التوصيل' },
          { val: '24h', label: lang === 'en' ? 'Turnaround Time' : 'وقت الإنجاز' },
          { val: 'ISO', label: lang === 'en' ? 'Certified Security' : 'أمان معتمد' }
      ],
      details: {
          challenge: lang === 'en' ? 'Managing sensitive documents and high-value assets across distributed branches requires military-grade security and tracking.' : 'إدارة المستندات الحساسة والأصول عالية القيمة عبر الفروع الموزعة تتطلب أماناً وتتبعاً عسكري المستوى.',
          solution: lang === 'en' ? 'Dedicated secure fleets with GPS tracking, tamper-proof pouches, and verified handover protocols tailored for banking needs.' : 'أساطيل آمنة مخصصة مع تتبع GPS، حقائب غير قابلة للتلاعب، وبروتوكولات تسليم تم التحقق منها خصيصاً للبنوك.'
      },
      subServices: [
        { en: 'Daily Mail Runs', ar: 'جولات البريد اليومي', icon: Mail, desc: 'Scheduled inter-branch document exchange.' },
        { en: 'Secured Delivery', ar: 'توصيل مؤمن', icon: ShieldCheck, desc: 'Credit cards & checkbooks with ID verification.' },
        { en: 'Document Signing', ar: 'توقيع المستندات', icon: FileSignature, desc: 'Legal contracts signed and returned.' },
        { en: 'Archive Management', ar: 'إدارة الأرشيف', icon: Archive, desc: 'Off-site secure storage and retrieval.' },
        { en: 'Cash Transit', ar: 'نقل الأموال', icon: Truck, desc: 'Secure armored transport coordination.' },
        { en: 'Bulk Mail', ar: 'البريد الشامل', icon: Database, desc: 'Statement distribution to customers.' },
      ],
      customers: [
        { en: 'Arab Bank', ar: 'البنك العربي', logo: 'arabbank.png' },
        { en: 'Bank of Palestine', ar: 'بنك فلسطين', domain: 'bankofpalestine.com' },
        { en: 'Cairo Amman Bank', ar: 'بنك القاهرة عمان', domain: 'cab.jo' },
        { en: 'Quds Bank', ar: 'بنك القدس', domain: 'qudsbank.ps' },
        { en: 'Housing Bank', ar: 'بنك الإسكان', domain: 'hbtf.com' }
      ]
    },
    {
      id: 'healthcare',
      title: lang === 'en' ? 'Healthcare & Pharma' : 'الرعاية الصحية والأدوية',
      tagline: lang === 'en' ? 'Precision, Care, Compliance' : 'دقة، رعاية، وامتثال',
      desc: lang === 'en'
        ? 'Specialized cold-chain and temperature-controlled transport for sensitive medical shipments, lab samples, and pharmaceuticals.' 
        : 'نقل متخصص بسلسلة التبريد والتحكم في درجة الحرارة للشحنات الطبية الحساسة، العينات المخبرية، والمستحضرات الصيدلانية.',
      icon: HeartPulse,
      color: 'bg-cyan-900', // Medical Blue
      accent: 'text-cyan-400',
      heroImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: '2-8°C', label: lang === 'en' ? 'Cold Chain' : 'سلسلة التبريد' },
          { val: '100%', label: lang === 'en' ? 'Compliance' : 'امتثال' },
          { val: 'Urgent', label: lang === 'en' ? 'Priority Handling' : 'أولوية التعامل' }
      ],
      details: {
          challenge: lang === 'en' ? 'Maintaining strict temperature controls and delivery speed for life-saving medications and time-sensitive samples.' : 'الحفاظ على ضوابط صارمة لدرجة الحرارة وسرعة التوصيل للأدوية المنقذة للحياة والعينات الحساسة للوقت.',
          solution: lang === 'en' ? 'Validated thermal packaging and specialized vehicles monitored in real-time to ensure integrity from pickup to delivery.' : 'تغليف حراري معتمد ومركبات متخصصة مراقبة في الوقت الفعلي لضمان السلامة من الاستلام حتى التسليم.'
      },
      subServices: [
        { en: 'Lab Sample Logistics', ar: 'لوجستيات العينات', icon: Box, desc: 'Bio-hazard safe transport.' },
        { en: 'Cold Chain', ar: 'سلسلة التبريد', icon: Monitor, desc: 'Temperature controlled distribution.' },
        { en: 'Pharmacy Supply', ar: 'توزيع الصيدليات', icon: Truck, desc: 'Daily restocking routes.' },
        { en: 'Home Medicine', ar: 'توصيل للمنازل', icon: Truck, desc: 'Patient-direct delivery.' },
      ],
      customers: [
        { en: 'Ministry of Health', ar: 'وزارة الصحة', logo: 'https://cdn-icons-png.flaticon.com/512/2855/2855146.png' },
        { en: 'Birzeit Pharma', ar: 'بيرزيت للأدوية', domain: 'bpc.ps' },
        { en: 'Pharmacare', ar: 'دار الشفاء', domain: 'pharmacare.com' },
        { en: 'Augusta Victoria', ar: 'مستشفى المطلع', domain: 'avh.org' }
      ]
    },
    {
      id: 'ecommerce',
      title: lang === 'en' ? 'E-commerce & Retail' : 'التجارة الإلكترونية والتجزئة',
      tagline: lang === 'en' ? 'Scale, Speed, Satisfaction' : 'توسع، سرعة، ورضا',
      desc: lang === 'en'
        ? 'End-to-end fulfillment solutions designed to scale your online business. From warehousing to last-mile delivery and returns.' 
        : 'حلول شاملة لإدارة الطلبات مصممة لتوسيع نطاق عملك عبر الإنترنت. من التخزين إلى توصيل الميل الأخير والمرتجعات.',
      icon: ShoppingCart,
      color: 'bg-indigo-900',
      accent: 'text-indigo-400',
      heroImage: 'https://images.unsplash.com/photo-1566576912906-253c72350d71?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: 'Next Day', label: lang === 'en' ? 'Delivery' : 'التوصيل' },
          { val: 'COD', label: lang === 'en' ? 'Payment Handling' : 'معالجة الدفع' },
          { val: 'API', label: lang === 'en' ? 'Integration' : 'الربط' }
      ],
      details: {
          challenge: lang === 'en' ? 'Meeting customer demands for fast delivery while managing inventory and returns efficiently.' : 'تلبية طلبات العملاء للتوصيل السريع مع إدارة المخزون والمرتجعات بكفاءة.',
          solution: lang === 'en' ? 'Integrated fulfillment centers with API connectivity for auto-dispatch, tracking, and seamless cash-on-delivery management.' : 'مراكز تلبية متكاملة مع ربط API للإرسال التلقائي، التتبع، وإدارة سلسة للدفع عند الاستلام.'
      },
      subServices: [
        { en: 'Warehousing', ar: 'المستودعات', icon: Archive, desc: 'Pick, pack & ship.' },
        { en: 'Last Mile', ar: 'الميل الأخير', icon: Truck, desc: 'Doorstep delivery.' },
        { en: 'Cash on Delivery', ar: 'الدفع عند الاستلام', icon: Landmark, desc: 'Fast remittance.' },
        { en: 'Returns Mgmt', ar: 'إدارة المرتجعات', icon: CheckCircle2, desc: 'Hassle-free reverse logistics.' },
      ],
      customers: [
        { en: 'Fashion Brands', ar: 'ماركات الأزياء', logo: 'https://cdn-icons-png.flaticon.com/512/3050/3050239.png' },
        { en: 'Online Retailers', ar: 'متاجر التجزئة', logo: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png' },
        { en: 'Tech Stores', ar: 'متاجر التقنية', logo: 'https://cdn-icons-png.flaticon.com/512/689/689392.png' }
      ]
    },
    {
      id: 'govt',
      title: lang === 'en' ? 'Government & Public' : 'القطاع الحكومي والعام',
      tagline: lang === 'en' ? 'Trust, Reach, Reliability' : 'ثقة، وصول، وموثوقية',
      desc: lang === 'en'
        ? 'Secure inter-departmental correspondence and mass distribution for public entities. Helping governments serve citizens better.' 
        : 'مراسلات آمنة بين الإدارات وتوزيع جماعي للهيئات العامة. مساعدة الحكومات على خدمة المواطنين بشكل أفضل.',
      icon: Building2,
      color: 'bg-slate-800',
      accent: 'text-slate-300',
      heroImage: 'https://images.unsplash.com/photo-1523293836414-f04e712e1f3b?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: '1M+', label: lang === 'en' ? 'Docs Delivered' : 'وثيقة تم توصيلها' },
          { val: 'Secure', label: lang === 'en' ? 'Protocols' : 'بروتوكولات' },
          { val: '100%', label: lang === 'en' ? 'Coverage' : 'تغطية' }
      ],
      details: {
          challenge: lang === 'en' ? 'Ensuring the secure and timely delivery of sensitive official documents to every citizen, regardless of location.' : 'ضمان التوصيل الآمن وفي الوقت المناسب للمستندات الرسمية الحساسة لكل مواطن، بغض النظر عن الموقع.',
          solution: lang === 'en' ? 'A nationwide network capable of reaching remote areas with verified delivery protocols for passports, IDs, and licenses.' : 'شبكة وطنية قادرة على الوصول إلى المناطق النائية مع بروتوكولات تسليم تم التحقق منها للجوازات والهويات والرخص.'
      },
      subServices: [
        { en: 'Secure Mail', ar: 'البريد الآمن', icon: ShieldCheck, desc: 'Confidential transport.' },
        { en: 'Passport Delivery', ar: 'توصيل الجوازات', icon: FileSignature, desc: 'Identity verification.' },
        { en: 'Mass Distribution', ar: 'التوزيع الجماعي', icon: Globe, desc: 'Public notices & bills.' },
        { en: 'Digitization', ar: 'الأرشفة الرقمية', icon: Database, desc: 'Document management.' },
      ],
      customers: [
        { en: 'Ministry of Interior', ar: 'وزارة الداخلية', logo: 'https://cdn-icons-png.flaticon.com/512/9318/9318464.png' },
        { en: 'Ministry of Finance', ar: 'وزارة المالية', logo: 'https://cdn-icons-png.flaticon.com/512/2721/2721115.png' },
        { en: 'Municipalities', ar: 'البلديات', logo: 'https://cdn-icons-png.flaticon.com/512/4300/4300058.png' }
      ]
    },
    {
      id: 'manufacturing',
      title: lang === 'en' ? 'Manufacturing' : 'التصنيع',
      tagline: lang === 'en' ? 'Efficiency, Capacity, Flow' : 'كفاءة، سعة، وتدفق',
      desc: lang === 'en'
        ? 'Robust supply chain solutions for raw materials and finished goods. We keep your production lines moving.' 
        : 'حلول قوية لسلسلة التوريد للمواد الخام والبضائع الجاهزة. نحافظ على استمرارية خطوط الإنتاج الخاصة بك.',
      icon: Factory,
      color: 'bg-orange-900',
      accent: 'text-orange-400',
      heroImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: 'LTL/FTL', label: lang === 'en' ? 'Freight' : 'شحن' },
          { val: 'JIT', label: lang === 'en' ? 'Delivery' : 'توصيل' },
          { val: 'Global', label: lang === 'en' ? 'Sourcing' : 'توديد' }
      ],
      details: {
          challenge: lang === 'en' ? 'Coordinating the influx of raw materials and the outflow of finished products to avoid bottlenecks.' : 'تنسيق تدفق المواد الخام وخروج المنتجات الجاهزة لتجنب الاختناقات.',
          solution: lang === 'en' ? 'Heavy freight capability combined with warehouse staging areas to support Just-In-Time manufacturing processes.' : 'قدرة شحن ثقيل مدمجة مع مناطق تخزين في المستودعات لدعم عمليات التصنيع في الوقت المناسب.'
      },
      subServices: [
        { en: 'Raw Materials', ar: 'المواد الخام', icon: Truck, desc: 'Bulk transport.' },
        { en: 'Spare Parts', ar: 'قطع الغيار', icon: Box, desc: 'Urgent logistics.' },
        { en: 'Heavy Freight', ar: 'الشحن الثقيل', icon: Truck, desc: 'Machinery transport.' },
        { en: 'Export Logistics', ar: 'لوجستيات التصدير', icon: Globe, desc: 'International shipping.' },
      ],
      customers: [
        { en: 'Auto Importers', ar: 'مستوردي السيارات', logo: 'https://cdn-icons-png.flaticon.com/512/2962/2962303.png' },
        { en: 'Food Factories', ar: 'مصانع الأغذية', logo: 'https://cdn-icons-png.flaticon.com/512/3014/3014520.png' },
        { en: 'Furniture Makers', ar: 'صناع الأثاث', logo: 'https://cdn-icons-png.flaticon.com/512/2603/2603741.png' }
      ]
    },
    {
      id: 'tech',
      title: lang === 'en' ? 'Tech & Telecom' : 'التكنولوجيا والاتصالات',
      tagline: lang === 'en' ? 'Innovation, Reach, Support' : 'ابتكار، وصول، ودعم',
      desc: lang === 'en'
        ? 'Secure handling of high-value electronics and SIM card distribution. Supporting infrastructure rollout and maintenance.' 
        : 'مناولة آمنة للإلكترونيات عالية القيمة وتوزيع بطاقات SIM. دعم نشر البنية التحتية والصيانة.',
      icon: Monitor,
      color: 'bg-violet-900',
      accent: 'text-violet-400',
      heroImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: 'High Value', label: lang === 'en' ? 'Security' : 'أمان' },
          { val: 'Mass', label: lang === 'en' ? 'Distribution' : 'توزيع' },
          { val: 'Tech', label: lang === 'en' ? 'Support' : 'دعم' }
      ],
      details: {
          challenge: lang === 'en' ? 'Distributing high-value, fragile electronic equipment and mass consumer items like SIM cards securely.' : 'توزيع معدات إلكترونية عالية القيمة وسهلة الكسر وسلع استهلاكية ضخمة مثل بطاقات SIM بأمان.',
          solution: lang === 'en' ? 'Specialized handling for electronics, secure storage for high-value stock, and mass distribution networks for telecom products.' : 'مناولة متخصصة للإلكترونيات، تخزين آمن للمخزون عالي القيمة، وشبكات توزيع ضخمة لمنتجات الاتصالات.'
      },
      subServices: [
        { en: 'SIM Distribution', ar: 'توزيع الشرائح', icon: Box, desc: 'Mass market reach.' },
        { en: 'Device Delivery', ar: 'توصيل الأجهزة', icon: Box, desc: 'Secure handover.' },
        { en: 'Contract Mgmt', ar: 'إدارة العقود', icon: FileSignature, desc: 'Customer onboarding.' },
        { en: 'Reverse Logistics', ar: 'اللوجستيات العكسية', icon: ArrowLeft, desc: 'Repair & returns.' },
      ],
      customers: [
        { en: 'Paltel Group', ar: 'مجموعة الاتصالات', domain: 'paltel.ps' },
        { en: 'Jawwal', ar: 'جوال', domain: 'jawwal.ps' },
        { en: 'Ooredoo', ar: 'أوريدو', domain: 'ooredoo.ps' }
      ]
    },
    {
      id: 'legal',
      title: lang === 'en' ? 'Legal' : 'الخدمات القانونية',
      tagline: lang === 'en' ? 'Confidentiality, Accuracy, Trust' : 'سرية، دقة، وثقة',
      desc: lang === 'en'
        ? 'Specialized courier services for law firms and courts, ensuring secure document transport and signature verification.' 
        : 'خدمات بريد متخصصة لمكاتب المحاماة والمحاكم، لضمان النقل الآمن للمستندات والتحقق من التوقيع.',
      icon: Briefcase,
      color: 'bg-slate-900',
      accent: 'text-amber-400',
      heroImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: '100%', label: lang === 'en' ? 'Confidential' : 'سري' },
          { val: 'Express', label: lang === 'en' ? 'Urgent Filing' : 'تقديم عاجل' },
          { val: 'Signed', label: lang === 'en' ? 'Verification' : 'تحقق' }
      ],
      details: {
          challenge: lang === 'en' ? 'Strict deadlines for court filings and the need for absolute confidentiality in document handling.' : 'مواعيد نهائية صارمة لتقديم المحكمة والحاجة إلى سرية مطلقة في التعامل مع المستندات.',
          solution: lang === 'en' ? 'Priority express lanes for legal documents with dedicated couriers trained in confidentiality and signature collection.' : 'مسارات سريعة ذات أولوية للمستندات القانونية مع سعاة مخصصين مدربين على السرية وجمع التوقيعات.'
      },
      subServices: [
        { en: 'Court Filing', ar: 'إيداع المحكمة', icon: Building2, desc: 'Deadline delivery.' },
        { en: 'Legal Notices', ar: 'الإشعارات القانونية', icon: Mail, desc: 'Proof of delivery.' },
        { en: 'Confidential Docs', ar: 'مستندات سرية', icon: ShieldCheck, desc: 'Sealed transport.' },
      ],
      customers: [
        { en: 'Law Firms', ar: 'مكاتب المحاماة', logo: 'https://cdn-icons-png.flaticon.com/512/2493/2493081.png' },
        { en: 'Notary Public', ar: 'كاتب العدل', logo: 'https://cdn-icons-png.flaticon.com/512/8227/8227278.png' }
      ]
    },
    {
      id: 'aviation',
      title: lang === 'en' ? 'Aviation' : 'الطيران',
      tagline: lang === 'en' ? 'Critical, Fast, Global' : 'حرج، سريع، وعالمي',
      desc: lang === 'en'
        ? 'AOG (Aircraft on Ground) support and critical parts logistics to keep fleets flying.' 
        : 'دعم AOG (الطائرات على الأرض) ولوجستيات قطع الغيار الحرجة للحفاظ على طيران الأساطيل.',
      icon: Globe, // Using Globe as proxy for aviation
      color: 'bg-sky-900',
      accent: 'text-sky-400',
      heroImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: '24/7', label: lang === 'en' ? 'AOG Desk' : 'مكتب AOG' },
          { val: 'Fast', label: lang === 'en' ? 'Clearance' : 'تخليص' },
          { val: 'Global', label: lang === 'en' ? 'Network' : 'شبكة' }
      ],
      details: {
          challenge: lang === 'en' ? 'Every minute an aircraft is grounded costs thousands. Parts must be delivered instantly, crossing borders without delay.' : 'كل دقيقة تتوقف فيها الطائرة تكلف الآلاف. يجب تسليم القطع فوراً، عابرة للحدود دون تأخير.',
          solution: lang === 'en' ? 'Dedicated AOG team for rapid customs clearance and immediate dispatch of critical aerospace components.' : 'فريق AOG مخصص للتخليص الجمركي السريع والإرسال الفوري لمكونات الطيران الحرجة.'
      },
      subServices: [
        { en: 'AOG Services', ar: 'خدمات AOG', icon: Clock, desc: 'Urgent parts delivery.' },
        { en: 'Dangerous Goods', ar: 'بضائع خطرة', icon: Box, desc: 'Certified handling.' },
        { en: 'Engine Transport', ar: 'نقل المحركات', icon: Truck, desc: 'Heavy lift logistics.' },
      ],
      customers: [
        { en: 'Airlines', ar: 'شركات الطيران', logo: 'https://cdn-icons-png.flaticon.com/512/984/984233.png' },
        { en: 'MROs', ar: 'مراكز الصيانة', logo: 'https://cdn-icons-png.flaticon.com/512/3203/3203923.png' }
      ]
    },
    {
      id: 'education',
      title: lang === 'en' ? 'Education' : 'التعليم',
      tagline: lang === 'en' ? 'Knowledge, Delivered' : 'المعرفة، تصل إليك',
      desc: lang === 'en'
        ? 'Logistics for universities and schools, including textbook distribution and exam paper security.' 
        : 'خدمات لوجستية للجامعات والمدارس، بما في ذلك توزيع الكتب المدرسية وتأمين أوراق الامتحانات.',
      icon: Building2,
      color: 'bg-amber-900',
      accent: 'text-amber-400',
      heroImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2000',
      stats: [
          { val: 'Secure', label: lang === 'en' ? 'Exams' : 'امتحانات' },
          { val: 'Bulk', label: lang === 'en' ? 'Books' : 'كتب' },
          { val: 'Campus', label: lang === 'en' ? 'Services' : 'خدمات' }
      ],
      details: {
          challenge: lang === 'en' ? 'Distributing customized educational materials to thousands of students and ensuring the integrity of examinations.' : 'توزيع المواد التعليمية المخصصة لآلاف الطلاب وضمان نزاهة الامتحانات.',
          solution: lang === 'en' ? 'Mass distribution capabilities for books and highly secure, tracked transport for confidential exam papers.' : 'قدرات توزيع جماعية للكتب ونقل آمن ومتتبع لأوراق الامتحانات السرية.'
      },
      subServices: [
        { en: 'Book Distribution', ar: 'توزيع الكتب', icon: Box, desc: 'Student home delivery.' },
        { en: 'Exam Security', ar: 'أمن الامتحانات', icon: ShieldCheck, desc: 'Confidential transit.' },
        { en: 'Campus Mail', ar: 'بريد الحرم الجامعي', icon: Mail, desc: 'Internal logistics.' },
      ],
      customers: [
        { en: 'Universities', ar: 'الجامعات', logo: 'https://cdn-icons-png.flaticon.com/512/2997/2997257.png' },
        { en: 'Schools', ar: 'المدارس', logo: 'https://cdn-icons-png.flaticon.com/512/1903/1903172.png' }
      ]
    }
  ];

  const activeIndustry = industries.find(ind => ind.id === activeIndustryId);
  const faqs = activeIndustryId ? FAQ_DATA[activeIndustryId] : [];

  // --- DETAIL VIEW ---
  if (activeIndustry) {
      return (
          <div className="bg-white min-h-screen animate-enter" ref={containerRef}>
              {/* Hero Banner */}
              <div className="relative min-h-[60vh] overflow-hidden">
                  <div className="absolute inset-0">
                      <img src={activeIndustry.heroImage} alt={activeIndustry.title} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 opacity-90 ${activeIndustry.color} mix-blend-multiply`}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  </div>
                  
                  <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col pt-32 md:pt-40 pb-12">
                        <button 
                            onClick={() => { window.location.hash = ''; setActiveIndustryId(null); }}
                            className="w-fit flex items-center text-white hover:text-wassel-yellow transition-colors font-medium bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mb-6 self-start"
                        >
                            <ArrowLeft className="w-5 h-5 rtl:rotate-180 ltr:mr-2 rtl:ml-2" />
                            {t.overviewBtn}
                        </button>

                        <div className="flex items-center gap-3 mb-8 animate-slide-up">
                            <div className={`p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 ${activeIndustry.accent}`}>
                                <activeIndustry.icon className="w-8 h-8" />
                            </div>
                            <span className={`text-lg font-bold uppercase tracking-wider ${activeIndustry.accent}`}>
                                {lang === 'en' ? 'Industry Solution' : 'حلول القطاع'}
                            </span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight animate-slide-up delay-100 max-w-4xl">
                            {activeIndustry.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-200 max-w-2xl font-light animate-slide-up delay-200">
                            {activeIndustry.tagline}
                        </p>
                  </div>
              </div>

              {/* Stats Bar */}
              <div className="bg-white border-b border-gray-100 relative z-20 -mt-16 mx-4 sm:mx-8 lg:mx-auto max-w-7xl rounded-2xl shadow-xl p-8 flex flex-col md:flex-row justify-around gap-8 animate-slide-up delay-300">
                  {activeIndustry.stats.map((stat, i) => (
                      <div key={i} className="text-center">
                          <div className={`text-4xl font-extrabold mb-1 ${activeIndustry.color.replace('bg-', 'text-')}`}>
                              {stat.val}
                          </div>
                          <div className="text-gray-500 font-medium text-sm uppercase tracking-wide">
                              {stat.label}
                          </div>
                      </div>
                  ))}
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                  {/* Challenge & Solution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24 items-center">
                      <div className="space-y-6">
                          <h3 className="text-3xl font-bold text-gray-900">{t.challenge}</h3>
                          <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-red-200 pl-6 rtl:pl-0 rtl:border-l-0 rtl:border-r-4 rtl:pr-6">
                              {activeIndustry.details.challenge}
                          </p>
                      </div>
                      <div className="space-y-6">
                          <h3 className="text-3xl font-bold text-gray-900">{t.solution}</h3>
                          <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-green-200 pl-6 rtl:pl-0 rtl:border-l-0 rtl:border-r-4 rtl:pr-6">
                              {activeIndustry.details.solution}
                          </p>
                      </div>
                  </div>

                  {/* Sub Services Grid */}
                  <div className="mb-24">
                      <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{t.keyServices}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {activeIndustry.subServices.map((service, i) => (
                              <div key={i} className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                                  <div className={`w-14 h-14 rounded-xl ${activeIndustry.color} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                                      <service.icon className="w-7 h-7" />
                                  </div>
                                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-wassel-blue transition-colors">
                                      {lang === 'en' ? service.en : service.ar}
                                  </h4>
                                  <p className="text-gray-500">
                                      {service.desc}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Clients */}
                  <div className="mb-24 bg-gray-50 rounded-3xl p-12 text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-10">{t.trustedBy}</h2>
                      <div className="flex flex-wrap justify-center gap-8">
                          {activeIndustry.customers.map((cust, i) => (
                              <CustomerLogo key={i} customer={cust} lang={lang} />
                          ))}
                      </div>
                  </div>

                  {/* FAQ Section */}
                  {faqs && faqs.length > 0 && (
                      <div className="mb-24">
                          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                              <HelpCircle className="w-8 h-8 text-wassel-blue" />
                              {t.faqTitle}
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {faqs.map((faq, index) => {
                                  const isOpen = openFaqIndex === index;
                                  return (
                                      <div key={index} className="rounded-xl border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                                          <button
                                              onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                              className="w-full flex justify-between items-start text-left rtl:text-right p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                                          >
                                              <span className="font-bold text-lg text-wassel-blue">
                                                  {lang === 'en' ? faq.q.en : faq.q.ar}
                                              </span>
                                              {isOpen ? <ChevronUp className="w-5 h-5 mt-1 text-gray-500" /> : <ChevronDown className="w-5 h-5 mt-1 text-gray-500" />}
                                          </button>
                                          <div 
                                              className={`bg-white transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                          >
                                              <div className="p-5 pt-2 text-gray-600 leading-relaxed border-t border-gray-100">
                                                  {lang === 'en' ? faq.a.en : faq.a.ar}
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {/* CTA */}
                  <div className={`${activeIndustry.color} rounded-3xl p-12 text-center text-white relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      <div className="relative z-10">
                          <h2 className="text-3xl md:text-4xl font-bold mb-6">
                              {lang === 'en' ? 'Ready to optimize your logistics?' : 'مستعد لتحسين عملياتك اللوجستية؟'}
                          </h2>
                          <button className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-3 mx-auto">
                              {t.contactSpecialist}
                              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- OVERVIEW VIEW ---
  return (
    <div className={`min-h-screen ${isEmbedded ? 'bg-transparent' : 'bg-gray-50'}`} ref={containerRef}>
      {/* Header - Only if NOT embedded */}
      {!isEmbedded && (
          <div className="relative bg-wassel-blue pt-48 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10"></div>
             <div className="relative max-w-7xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl animate-slide-up">
                    {t.title}
                </h1>
                <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto animate-slide-up delay-100">
                    {t.subtitle}
                </p>
             </div>
          </div>
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isEmbedded ? 'py-0 pb-16' : 'py-16'}`}>
        {isEmbedded && (
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
                    {t.title}
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    {t.subtitle}
                </p>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
                <a 
                    key={index} 
                    href={`#${industry.id}`}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full transform hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    {/* Image Area */}
                    <div className="relative h-48 overflow-hidden">
                        <img 
                            src={industry.heroImage} 
                            alt={industry.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className={`absolute inset-0 ${industry.color} opacity-60 group-hover:opacity-40 transition-opacity`}></div>
                        <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 text-white">
                                <industry.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-wassel-blue transition-colors">
                            {industry.title}
                        </h3>
                        <p className="text-gray-500 text-sm font-medium mb-4 uppercase tracking-wider">
                            {industry.tagline}
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                            {industry.desc}
                        </p>
                        
                        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center text-wassel-blue font-bold text-sm group-hover:underline">
                            {lang === 'en' ? 'View Sector Solutions' : 'عرض حلول القطاع'}
                            <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </div>
                </a>
            ))}
        </div>
      </div>
    </div>
  );
};