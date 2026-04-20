import React, { useState } from 'react';
import { 
    Truck, 
    Plane, 
    FileCheck, 
    Globe, 
    ShoppingBag, 
    CreditCard, 
    FileText, 
    CheckCircle2, 
    ArrowRight,
    Package,
    Phone,
    Mail,
    FileSignature,
    Archive,
    Warehouse,
    Server,
    Layers,
    Box,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    ClipboardCheck,
    Hammer,
    Tag,
    Container
} from 'lucide-react';
import { Language } from '../types';
import { FAQ_DATA } from '../data/faqs';

interface ServiceDetailProps {
  serviceId: string;
  lang: Language;
  onAction: (actionType: string, params?: any) => void;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ serviceId, lang, onAction }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Determine if the service is a corporate service based on ID convention
  const isCorporate = serviceId.startsWith('service-corp-');

  // Define theme classes based on service type
  const themeClasses = isCorporate ? {
      heroBg: 'bg-corp-primary', // #3D3D3D
      heroOverlay: 'from-corp-primary via-corp-primary/80',
      iconBox: 'bg-corp-secondary text-corp-primary', // Yellow bg, Dark text
      labelText: 'text-corp-secondary',
      headingText: 'text-corp-primary',
      primaryBtn: 'bg-corp-secondary text-corp-primary hover:bg-[#E6B800] shadow-lg',
      primaryBtnIcon: 'text-corp-primary',
      faqBg: 'bg-gray-50',
      faqQuestion: 'text-corp-primary',
      stepNumBg: 'bg-corp-secondary text-corp-primary',
      packingCard: 'bg-white border-gray-100 hover:shadow-lg'
  } : {
      heroBg: 'bg-wassel-blue',
      heroOverlay: 'from-wassel-blue via-wassel-blue/80',
      iconBox: 'bg-wassel-yellow text-wassel-blue',
      labelText: 'text-wassel-yellow',
      headingText: 'text-wassel-blue',
      primaryBtn: 'bg-wassel-blue text-white hover:bg-wassel-darkBlue shadow-lg',
      primaryBtnIcon: 'text-wassel-yellow',
      faqBg: 'bg-blue-50/30',
      faqQuestion: 'text-wassel-blue',
      stepNumBg: 'bg-wassel-blue text-wassel-yellow',
      packingCard: 'bg-white border-blue-50 hover:shadow-md'
  };

  const getContent = () => {
      switch(serviceId) {
          // --- INDIVIDUAL SERVICES ---
          case 'service-clearance':
              return {
                  title: lang === 'en' ? 'Customs Clearance' : 'التخليص الجمركي',
                  subtitle: lang === 'en' ? 'Seamless handling of customs procedures.' : 'إنجاز سلس للإجراءات الجمركية.',
                  desc: lang === 'en' 
                    ? 'Our expert team ensures your shipments comply with all regulations, minimizing delays and avoiding penalties. Track your file status or upload required documents directly.'
                    : 'يضمن فريق خبرائنا امتثال شحناتك لجميع اللوائح، مما يقلل من التأخير ويتجنب الغرامات. تتبع حالة ملفك أو ارفع المستندات المطلوبة مباشرة.',
                  icon: FileCheck,
                  heroImage: 'warehouse.png',
                  features: [
                      { title: lang === 'en' ? 'Document Handling' : 'معالجة المستندات', desc: lang === 'en' ? 'We manage all paperwork.' : 'ندير جميع الأوراق.' },
                      { title: lang === 'en' ? 'Duty Calculation' : 'حساب الرسوم', desc: lang === 'en' ? 'Accurate tax estimates.' : 'تقديرات ضريبية دقيقة.' },
                      { title: lang === 'en' ? 'Fast Release' : 'إفراج سريع', desc: lang === 'en' ? 'Minimize holding time.' : 'تقليل وقت الحجز.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Track File' : 'تتبع الملف', icon: Package, type: 'tracking-customs', primary: true },
                      { label: lang === 'en' ? 'Pay Fees' : 'دفع الرسوم', icon: CreditCard, type: 'pay' }
                  ]
              };
          case 'service-pick-pack':
              return {
                  title: lang === 'en' ? 'Pick & Pack' : 'التغليف والتجهيز',
                  subtitle: lang === 'en' ? 'Professional packing for safe transit.' : 'تغليف احترافي لنقل آمن.',
                  desc: lang === 'en'
                    ? 'Moving house or sending a fragile gift? We collect your items, professionally pack them using high-quality materials, and ship them to their destination.'
                    : 'هل تنتقل من منزل أو ترسل هدية قابلة للكسر؟ نقوم بجمع أغراضك، وتغليفها بشكل احترافي باستخدام مواد عالية الجودة، وشحنها إلى وجهتها.',
                  icon: Box,
                  heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Doorstep Collection' : 'استلام من الباب', desc: lang === 'en' ? 'We come to you.' : 'نأتي إليك.' },
                      { title: lang === 'en' ? 'Professional Packing' : 'تغليف احترافي', desc: lang === 'en' ? 'Expert techniques.' : 'تقنيات متخصصة.' },
                      { title: lang === 'en' ? 'Material Supply' : 'توفير المواد', desc: lang === 'en' ? 'Boxes, bubble wrap, etc.' : 'صناديق، فقاعات، إلخ.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Request Service' : 'طلب الخدمة', icon: Truck, type: 'pickup', primary: true }
                  ],
                  packingTypes: [
                      { name: { en: 'Standard Boxes', ar: 'صناديق قياسية' }, desc: { en: 'Various sizes for general items.', ar: 'أحجام مختلفة للعناصر العامة.' }, icon: Box },
                      { name: { en: 'Fragile Packing', ar: 'تغليف القابل للكسر' }, desc: { en: 'Bubble wrap & cushioning.', ar: 'فقاعات هوائية وتبطين.' }, icon: ClipboardCheck },
                      { name: { en: 'Wooden Crating', ar: 'صناديق خشبية' }, desc: { en: 'For art & heavy electronics.', ar: 'للفن والإلكترونيات الثقيلة.' }, icon: Hammer },
                  ],
                  howItWorks: [
                      { title: { en: 'We Collect', ar: 'نحن نستلم' }, desc: { en: 'Driver arrives at your location.', ar: 'يصل السائق إلى موقعك.' } },
                      { title: { en: 'We Pack', ar: 'نحن نغلف' }, desc: { en: 'Items packed securely on-site or at hub.', ar: 'تغليف آمن في الموقع أو المركز.' } },
                      { title: { en: 'We Label', ar: 'نحن نضع الملصقات' }, desc: { en: 'Shipping labels attached.', ar: 'إرفاق ملصقات الشحن.' } },
                      { title: { en: 'We Ship', ar: 'نحن نشحن' }, desc: { en: 'Dispatched to destination.', ar: 'يتم الإرسال إلى الوجهة.' } }
                  ]
              };
          case 'service-express':
              return {
                  title: lang === 'en' ? 'International Express' : 'الشحن الدولي السريع',
                  subtitle: lang === 'en' ? 'Connect with the world faster.' : 'تواصل مع العالم بشكل أسرع.',
                  desc: lang === 'en'
                    ? 'Through our strategic partnerships with global leaders like DHL and FedEx, we offer reliable express shipping to over 220 countries.'
                    : 'من خلال شراكاتنا الاستراتيجية مع رواد عالميين مثل DHL و FedEx، نقدم شحناً سريعاً موثوقاً لأكثر من 220 دولة.',
                  icon: Plane,
                  heroImage: 'airplane.png',
                  features: [
                      { title: lang === 'en' ? 'Global Network' : 'شبكة عالمية', desc: lang === 'en' ? 'Reach 220+ countries.' : 'الوصول لأكثر من 220 دولة.' },
                      { title: lang === 'en' ? 'Real-time Tracking' : 'تتبع فوري', desc: lang === 'en' ? 'Know where your package is.' : 'اعرف مكان طردك.' },
                      { title: lang === 'en' ? 'Express Delivery' : 'توصيل سريع', desc: lang === 'en' ? 'Urgent document handling.' : 'معالجة المستندات العاجلة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Get Quote' : 'احصل على عرض سعر', icon: Globe, type: 'rates-international', primary: true },
                      { label: lang === 'en' ? 'Track Shipment' : 'تتبع الشحنة', icon: Package, type: 'tracking' }
                  ]
              };
          case 'service-domestic':
              return {
                  title: lang === 'en' ? 'Domestic Shipping' : 'الشحن المحلي',
                  subtitle: lang === 'en' ? 'Reliable door-to-door delivery.' : 'توصيل موثوق من الباب للباب.',
                  desc: lang === 'en'
                    ? 'Covering the West Bank and Gaza with a fleet that ensures your packages arrive safely and on time. Cash on Delivery supported.'
                    : 'تغطية الضفة الغربية وقطاع غزة بأسطول يضمن وصول طرودك بأمان وفي الوقت المحدد. ندعم خدمة الدفع عند الاستلام.',
                  icon: Truck,
                  heroImage: 'truck.png',
                  features: [
                      { title: lang === 'en' ? 'Next Day Delivery' : 'توصيل اليوم التالي', desc: lang === 'en' ? 'Fast turnaround.' : 'سرعة في الإنجاز.' },
                      { title: lang === 'en' ? 'Cash on Delivery' : 'الدفع عند الاستلام', desc: lang === 'en' ? 'Secure payment collection.' : 'تحصيل آمن للدفعات.' },
                      { title: lang === 'en' ? 'Wide Coverage' : 'تغطية واسعة', desc: lang === 'en' ? 'All major cities covered.' : 'تغطية جميع المدن الرئيسية.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Request Pickup' : 'طلب استلام', icon: Truck, type: 'pickup', primary: true },
                      { label: lang === 'en' ? 'Calculate Rate' : 'حساب التكلفة', icon: Globe, type: 'rates-domestic' }
                  ]
              };
          case 'service-shop':
              return {
                  title: lang === 'en' ? 'Shop & Ship' : 'تسوق واستلم',
                  subtitle: lang === 'en' ? 'Shop globally, receive locally.' : 'تسوق عالمياً، واستلم محلياً.',
                  desc: lang === 'en'
                    ? 'Get your own shipping addresses in the USA, UK, and UAE. Shop from stores that don’t ship to Palestine, and we’ll bring it to your door.'
                    : 'احصل على عناوين شحن خاصة بك في أمريكا، بريطانيا، والإمارات. تسوق من متاجر لا تشحن لفلسطين، وسنقوم بتوصيلها لبابك.',
                  icon: ShoppingBag,
                  heroImage: 'https://images.unsplash.com/photo-1516937941348-c09645f31e88?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Global Addresses' : 'عناوين عالمية', desc: lang === 'en' ? 'USA, UK, UAE hubs.' : 'مستودعات في أمريكا، بريطانيا، والإمارات.' },
                      { title: lang === 'en' ? 'Consolidation' : 'تجميع الشحنات', desc: lang === 'en' ? 'Save on shipping costs.' : 'وفر في تكاليف الشحن.' },
                      { title: lang === 'en' ? 'Easy Management' : 'إدارة سهلة', desc: lang === 'en' ? 'Manage via dashboard.' : 'إدارة عبر لوحة التحكم.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Sign Up Now' : 'سجل الآن', icon: ShoppingBag, type: 'login', primary: true }
                  ]
              };
          case 'service-idp':
              return {
                  title: lang === 'en' ? 'International Driving Permit' : 'رخصة القيادة الدولية',
                  subtitle: lang === 'en' ? 'Drive anywhere with confidence.' : 'قد سيارتك في أي مكان بثقة.',
                  desc: lang === 'en'
                    ? 'Planning to drive abroad? Get your certified International Driving Permit quickly and easily through Wassel.'
                    : 'تخطط للقيادة في الخارج؟ احصل على رخصة القيادة الدولية المعتمدة بسرعة وسهولة عبر واصل.',
                  icon: CreditCard,
                  heroImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Accepted Globally' : 'مقبولة عالمياً', desc: lang === 'en' ? 'Valid in 150+ countries.' : 'سارية في أكثر من 150 دولة.' },
                      { title: lang === 'en' ? 'Quick Processing' : 'إجراءات سريعة', desc: lang === 'en' ? 'Get it in days.' : 'احصل عليها خلال أيام.' },
                      { title: lang === 'en' ? 'Multiple Years' : 'سنوات متعددة', desc: lang === 'en' ? '1 or 3 year validity.' : 'صلاحية لمدة سنة أو 3 سنوات.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Apply Now' : 'قدم الآن', icon: FileText, type: 'idp-flow', primary: true }
                  ]
              };
          case 'service-jordanian':
              return {
                  title: lang === 'en' ? 'Jordanian Passport Services' : 'خدمات الجوازات الأردنية',
                  subtitle: lang === 'en' ? 'Hassle-free passport logistics.' : 'خدمات لوجستية للجوازات بدون عناء.',
                  desc: lang === 'en'
                    ? 'We handle the secure transport of documents to and from Jordanian authorities for passport issuance and renewal.'
                    : 'نتولى النقل الآمن للمستندات من وإلى السلطات الأردنية لإصدار وتجديد جوازات السفر.',
                  icon: FileText,
                  heroImage: 'https://images.unsplash.com/photo-1544026230-01d006198896?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Secure Transport' : 'نقل آمن', desc: lang === 'en' ? 'Tracked delivery.' : 'توصيل متتبع.' },
                      { title: lang === 'en' ? 'End-to-End' : 'من البداية للنهاية', desc: lang === 'en' ? 'We handle the legwork.' : 'نحن نتولى المهام الشاقة.' },
                      { title: lang === 'en' ? 'Trusted Service' : 'خدمة موثوقة', desc: lang === 'en' ? 'Years of experience.' : 'سنوات من الخبرة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Us' : 'تواصل معنا', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          
          // --- CORPORATE SERVICES ---
          case 'service-corp-daily':
              return {
                  title: lang === 'en' ? 'Daily Mail Services' : 'البريد اليومي',
                  subtitle: lang === 'en' ? 'Consistent and reliable mail exchange.' : 'تبادل بريد منتظم وموثوق.',
                  desc: lang === 'en'
                    ? 'Scheduled daily pickup and delivery routes tailored for your business correspondence. We ensure your documents move efficiently between branches or partners.'
                    : 'رحلات استلام وتوصيل يومية مجدولة مصممة لمراسلات عملك. نضمن نقل مستنداتك بكفاءة بين الفروع أو الشركاء.',
                  icon: Mail,
                  heroImage: 'daily-mail.jpg',
                  features: [
                      { title: lang === 'en' ? 'Scheduled Routes' : 'مسارات مجدولة', desc: lang === 'en' ? 'Fixed timings.' : 'توقيتات ثابتة.' },
                      { title: lang === 'en' ? 'Secure Pouches' : 'حقائب آمنة', desc: lang === 'en' ? 'Tamper-proof transport.' : 'نقل محمي من التلاعب.' },
                      { title: lang === 'en' ? 'Inter-branch' : 'بين الفروع', desc: lang === 'en' ? 'Internal mail systems.' : 'أنظمة بريد داخلية.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-signing':
              return {
                  title: lang === 'en' ? 'Document Signing' : 'توقيع المستندات',
                  subtitle: lang === 'en' ? 'Courier-facilitated legal signing.' : 'توقيع قانوني بمساعدة المندوب.',
                  desc: lang === 'en'
                    ? 'We don’t just deliver; we ensure your documents are signed by the right person. Ideal for contracts, banking forms, and legal notices requiring proof of execution.'
                    : 'لا نكتفي بالتوصيل فحسب؛ بل نضمن توقيع مستنداتك من قبل الشخص المعني. مثالية للعقود، النماذج البنكية، والإشعارات القانونية التي تتطلب إثبات التنفيذ.',
                  icon: FileSignature,
                  heroImage: 'signing.jpg',
                  features: [
                      { title: lang === 'en' ? 'ID Verification' : 'التحقق من الهوية', desc: lang === 'en' ? 'Verify signer identity.' : 'التحقق من هوية الموقع.' },
                      { title: lang === 'en' ? 'Return Service' : 'خدمة الإرجاع', desc: lang === 'en' ? 'Signed docs returned.' : 'إعادة المستندات الموقعة.' },
                      { title: lang === 'en' ? 'Legal Compliance' : 'امتثال قانوني', desc: lang === 'en' ? 'Audit trail provided.' : 'توفير مسار تدقيق.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-bulk':
              return {
                  title: lang === 'en' ? 'Bulk Distribution' : 'التوزيع بالجملة',
                  subtitle: lang === 'en' ? 'Mass delivery for marketing & bills.' : 'توصيل جماعي للتسويق والفواتير.',
                  desc: lang === 'en'
                    ? 'Efficient distribution for high-volume items like magazines, invoices, or promotional materials. We offer targeted delivery zones and detailed reporting.'
                    : 'توزيع فعال للعناصر ذات الحجم الكبير مثل المجلات، الفواتير، أو المواد الترويجية. نقدم مناطق توصيل مستهدفة وتقارير مفصلة.',
                  icon: Layers,
                  heroImage: 'bulk.jpg',
                  features: [
                      { title: lang === 'en' ? 'Zone Targeting' : 'استهداف المناطق', desc: lang === 'en' ? 'Geographic segmentation.' : 'تقسيم جغرافي.' },
                      { title: lang === 'en' ? 'Address Verification' : 'التحقق من العنوان', desc: lang === 'en' ? 'Clean your database.' : 'تنظيف قاعدة بياناتك.' },
                      { title: lang === 'en' ? 'Cost Effective' : 'فعال من حيث التكلفة', desc: lang === 'en' ? 'Volume discounts.' : 'خصومات على الكميات.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-import':
              return {
                  title: lang === 'en' ? 'Import & Export' : 'الإستيراد والتصدير',
                  subtitle: lang === 'en' ? 'Global freight forwarding solutions.' : 'حلول شحن عالمية.',
                  desc: lang === 'en'
                    ? 'Comprehensive freight services by air, sea, or land. We handle customs brokerage, documentation, and final delivery to your warehouse.'
                    : 'خدمات شحن شاملة جواً، بحراً، أو براً. نتولى التخليص الجمركي، التوثيق، والتوصيل النهائي إلى مستودعك.',
                  icon: Globe,
                  heroImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Multi-modal' : 'متعدد الوسائط', desc: lang === 'en' ? 'Air, Sea, Land.' : 'جو، بحر، بر.' },
                      { title: lang === 'en' ? 'Customs Brokerage' : 'تخليص جمركي', desc: lang === 'en' ? 'Expert clearance.' : 'تخليص خبير.' },
                      { title: lang === 'en' ? 'Door-to-Door' : 'من الباب للباب', desc: lang === 'en' ? 'End-to-end service.' : 'خدمة شاملة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Get Quote' : 'طلب عرض سعر', icon: FileText, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-storage':
              return {
                  title: lang === 'en' ? 'Storage Services' : 'خدمات التخزين',
                  subtitle: lang === 'en' ? 'Flexible short & long term storage.' : 'تخزين مرن قصير وطويل المدى.',
                  desc: lang === 'en'
                    ? 'Secure, climate-controlled storage facilities. Whether you need temporary space for seasonal stock or long-term archiving, we have the capacity.'
                    : 'مرافق تخزين آمنة ومتحكم في مناخها للاحتياجات قصيرة المدى. خيارات مساحة مرنة للتعامل مع تقلبات المخزون.',
                  icon: Box,
                  heroImage: 'storage.jpg',
                  features: [
                      { title: lang === 'en' ? '24/7 Security' : 'أمن 24/7', desc: lang === 'en' ? 'Monitored facilities.' : 'مرافق مراقبة.' },
                      { title: lang === 'en' ? 'Climate Control' : 'تحكم بالمناخ', desc: lang === 'en' ? 'For sensitive items.' : 'للمواد الحساسة.' },
                      { title: lang === 'en' ? 'Flexible Terms' : 'شروط مرنة', desc: lang === 'en' ? 'Pay as you use.' : 'ادفع حسب الاستخدام.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Inquire Now' : 'استفسر الآن', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-warehousing':
              return {
                  title: lang === 'en' ? 'Warehouse Management' : 'إدارة المستودعات',
                  subtitle: lang === 'en' ? 'Outsourced fulfillment & logistics.' : 'إدارة وتجهيز الطلبات خارجيًا.',
                  desc: lang === 'en'
                    ? 'Let us be your logistics partner. We handle receiving, inventory management, picking, packing, and shipping so you can focus on sales.'
                    : 'دعنا نكون شريكك اللوجستي. نتولى الاستلام، إدارة المخزون، التجهيز، التغليف، والشحن لتتمكن من التركيز على المبيعات.',
                  icon: Warehouse,
                  heroImage: 'warehouse.png',
                  features: [
                      { title: lang === 'en' ? 'Inventory System' : 'نظام المخزون', desc: lang === 'en' ? 'Real-time tracking.' : 'تتبع فوري.' },
                      { title: lang === 'en' ? 'Pick & Pack' : 'تجهيز وتغليف', desc: lang === 'en' ? 'Efficient fulfillment.' : 'تجهيز فعال.' },
                      { title: lang === 'en' ? 'API Integration' : 'ربط API', desc: lang === 'en' ? 'Connect your store.' : 'اربط متجرك.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Partner with Us' : 'شاركنا', icon: Server, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-freight':
              return {
                  title: lang === 'en' ? 'Heavy Freight' : 'الشحن الثقيل',
                  subtitle: lang === 'en' ? 'Transport for oversized cargo.' : 'نقل البضائع الضخمة.',
                  desc: lang === 'en'
                    ? 'Specialized fleet for heavy and oversized loads. We handle route planning, permits, and secure transport for industrial equipment and machinery.'
                    : 'أسطول متخصص للأحمال الثقيلة والضخمة. نتولى تخطيط المسار، التصاريح، والنقل الآمن للمعدات والآلات الصناعية.',
                  icon: Truck,
                  heroImage: 'truck.png',
                  features: [
                      { title: lang === 'en' ? 'Specialized Fleet' : 'أسطول متخصص', desc: lang === 'en' ? 'Flatbeds & cranes.' : 'شاحنات مسطحة ورافعات.' },
                      { title: lang === 'en' ? 'Route Planning' : 'تخطيط المسار', desc: lang === 'en' ? 'Safe transit.' : 'عبور آمن.' },
                      { title: lang === 'en' ? 'Insurance' : 'تأمين', desc: lang === 'en' ? 'Full coverage.' : 'تغطية شاملة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Get Quote' : 'طلب عرض سعر', icon: FileText, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-pick-pack':
              return {
                  title: lang === 'en' ? 'Professional Packing & Fulfillment' : 'التغليف والتجهيز الاحترافي',
                  subtitle: lang === 'en' ? 'Streamline your logistics operations.' : 'تبسيط عملياتك اللوجستية.',
                  desc: lang === 'en'
                    ? 'Comprehensive fulfillment solutions for businesses. We store, pick, professionally pack, and ship your products directly to customers with custom branding options.'
                    : 'حلول تجهيز شاملة للشركات. نقوم بتخزين، اختيار، وتغليف منتجاتك بشكل احترافي، وشحنها مباشرة للعملاء مع خيارات العلامة التجارية المخصصة.',
                  icon: Box,
                  heroImage: 'https://images.unsplash.com/photo-1566576912906-253c72350d71?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Inventory Mgmt' : 'إدارة المخزون', desc: lang === 'en' ? 'Real-time stock control.' : 'تحكم فوري بالمخزون.' },
                      { title: lang === 'en' ? 'Custom Branding' : 'علامة تجارية مخصصة', desc: lang === 'en' ? 'Your logo on boxes.' : 'شعارك على الصناديق.' },
                      { title: lang === 'en' ? 'Fast Dispatch' : 'إرسال سريع', desc: lang === 'en' ? 'Same-day shipping.' : 'شحن في نفس اليوم.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات', icon: Phone, type: 'contact', primary: true }
                  ],
                  packingTypes: [
                      { name: { en: 'Ecommerce Boxes', ar: 'صناديق التجارة الإلكترونية' }, desc: { en: 'Branded standard boxes.', ar: 'صناديق قياسية بعلامة تجارية.' }, icon: Box },
                      { name: { en: 'Secure Mailers', ar: 'مغلفات آمنة' }, desc: { en: 'Tamper-proof poly bags.', ar: 'أكياس بولي محمية.' }, icon: Tag },
                      { name: { en: 'Bulk Pallets', ar: 'منصات شحن' }, desc: { en: 'Shrink-wrapped for freight.', ar: 'مغلفة للشحن الثقيل.' }, icon: Container },
                  ],
                  howItWorks: [
                      { title: { en: 'Store', ar: 'تخزين' }, desc: { en: 'Stock in our warehouse.', ar: 'تخزين في مستودعاتنا.' } },
                      { title: { en: 'Order', ar: 'طلب' }, desc: { en: 'Receive customer order.', ar: 'استلام طلب العميل.' } },
                      { title: { en: 'Pick & Pack', ar: 'تجهيز وتغليف' }, desc: { en: 'Items collected & branded.', ar: 'جمع وتغليف المنتجات.' } },
                      { title: { en: 'Ship', ar: 'شحن' }, desc: { en: 'Delivered to customer.', ar: 'التوصيل للعميل.' } }
                  ]
              };

          default:
              return null;
      }
  };

  const content = getContent();
  const faqs = FAQ_DATA[serviceId] || [];

  if (!content) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className={`relative h-[400px] flex items-center overflow-hidden ${themeClasses.heroBg}`}>
            {/* Background Image Logic */}
            <div className="absolute inset-0 z-0 opacity-20">
                {/* Fallback for local images that might be missing in preview environment, use generic abstract or color if img fails visually */}
                <img 
                    src={content.heroImage} 
                    alt={content.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <div className={`w-full h-full absolute inset-0 mix-blend-color ${themeClasses.heroBg}`}></div>
            </div>
            <div className={`absolute inset-0 bg-gradient-to-r to-transparent z-10 ${themeClasses.heroOverlay}`}></div>
            
            <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-lg ${themeClasses.iconBox}`}>
                        <content.icon className="w-8 h-8" />
                    </div>
                    <span className={`font-bold uppercase tracking-wider text-sm ${themeClasses.labelText}`}>
                        {lang === 'en' ? 'Service Detail' : 'تفاصيل الخدمة'}
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 animate-slide-up">
                    {content.title}
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl animate-slide-up delay-100">
                    {content.subtitle}
                </p>
            </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-30 mb-20">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 animate-pop delay-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* Description & Features */}
                    <div className="space-y-8">
                        <div>
                            <h3 className={`text-2xl font-bold mb-4 ${themeClasses.headingText}`}>
                                {lang === 'en' ? 'About this Service' : 'عن هذه الخدمة'}
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {content.desc}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {content.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{feature.title}</h4>
                                        <p className="text-sm text-gray-500">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                            {lang === 'en' ? 'Ready to get started?' : 'مستعد للبدء؟'}
                        </h3>
                        <div className="space-y-4">
                            {content.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onAction(action.type)}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:translate-y-[-2px] ${
                                        action.primary 
                                        ? themeClasses.primaryBtn
                                        : 'bg-white text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <action.icon className="w-5 h-5" />
                                        {action.label}
                                    </div>
                                    <ArrowRight className={`w-5 h-5 rtl:rotate-180 ${action.primary ? themeClasses.primaryBtnIcon : 'text-gray-400'}`} />
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-500">
                                {lang === 'en' ? 'Need help? Contact our support.' : 'تحتاج مساعدة؟ تواصل مع الدعم الفني.'}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Packing Available Types (New Section) */}
                {content.packingTypes && (
                    <div className="mt-20 pt-12 border-t border-gray-100">
                        <h3 className={`text-2xl font-bold mb-8 ${themeClasses.headingText}`}>
                            {lang === 'en' ? 'Packing Available Types' : 'أنواع التغليف المتاحة'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {content.packingTypes.map((type, idx) => (
                                <div key={idx} className={`p-6 rounded-xl border ${themeClasses.packingCard} transition-all`}>
                                    <div className={`w-12 h-12 rounded-lg ${themeClasses.iconBox} flex items-center justify-center mb-4`}>
                                        <type.icon className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{lang === 'en' ? type.name.en : type.name.ar}</h4>
                                    <p className="text-sm text-gray-500">{lang === 'en' ? type.desc.en : type.desc.ar}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* How It Works (New Section) */}
                {content.howItWorks && (
                    <div className="mt-20 pt-12 border-t border-gray-100">
                        <h3 className={`text-2xl font-bold mb-10 text-center ${themeClasses.headingText}`}>
                            {lang === 'en' ? 'How Packing Service Works' : 'كيف تعمل خدمة التغليف'}
                        </h3>
                        <div className="relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0"></div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {content.howItWorks.map((step, idx) => (
                                    <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4 border-4 border-white shadow-md ${themeClasses.stepNumBg}`}>
                                            {idx + 1}
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">{lang === 'en' ? step.title.en : step.title.ar}</h4>
                                        <p className="text-sm text-gray-500 max-w-[200px]">{lang === 'en' ? step.desc.en : step.desc.ar}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* FAQ Section */}
                {faqs.length > 0 && (
                    <div className="mt-20 pt-12 border-t border-gray-100">
                        <h3 className={`text-2xl font-bold mb-8 flex items-center gap-2 ${themeClasses.headingText}`}>
                            <HelpCircle className="w-6 h-6" />
                            {lang === 'en' ? 'Frequently Asked Questions' : 'أسئلة شائعة'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {faqs.map((faq, index) => {
                                const isOpen = openFaqIndex === index;
                                return (
                                    <div key={index} className={`rounded-xl border border-gray-100 overflow-hidden transition-all ${isOpen ? 'shadow-md' : 'hover:shadow-sm'}`}>
                                        <button
                                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                            className={`w-full flex justify-between items-start text-left rtl:text-right p-5 ${themeClasses.faqBg} hover:opacity-90 transition-opacity`}
                                        >
                                            <span className={`font-bold text-lg ${themeClasses.faqQuestion}`}>
                                                {lang === 'en' ? faq.q.en : faq.q.ar}
                                            </span>
                                            {isOpen ? <ChevronUp className={`w-5 h-5 mt-1 ${themeClasses.faqQuestion}`} /> : <ChevronDown className={`w-5 h-5 mt-1 ${themeClasses.faqQuestion}`} />}
                                        </button>
                                        <div 
                                            className={`bg-white transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <div className="p-5 pt-2 text-gray-600 leading-relaxed border-t border-gray-100/50">
                                                {lang === 'en' ? faq.a.en : faq.a.ar}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};