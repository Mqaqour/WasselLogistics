import React, { useState } from 'react';
import { 
  Building, 
  Mail, 
  FileSignature, 
  Archive, 
  Warehouse, 
  Server, 
  Layers,
  Briefcase,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Box,
  Globe,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { Language } from '../../types';
import { Industries } from './Industries';

interface CorporateProps {
  lang: Language;
  initialTab?: 'services'; // Removed industries option
}

interface ServiceCardProps {
  service: any;
  lang: Language;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, lang }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="w-full flex-shrink-0 px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[500px] border border-gray-100">
                {/* Image Section - Left Side (LG: 45%) */}
                <div className="relative w-full lg:w-[45%] h-64 lg:h-auto overflow-hidden bg-gray-100">
                    {service.image && !imgError ? (
                        <img 
                            src={service.image} 
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        // Fallback Gradient
                        <div className="w-full h-full bg-gradient-to-br from-corp-primary to-gray-800 flex items-center justify-center relative overflow-hidden">
                             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                             <service.icon className="w-32 h-32 text-white/20 relative z-10" />
                        </div>
                    )}
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Content Section - Right Side (LG: 55%) */}
                <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative bg-white">
                    <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-corp-secondary/10 text-corp-primary mb-6">
                        <service.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-corp-primary mb-6 leading-tight">
                        {service.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed text-lg sm:text-xl mb-8">
                        {service.desc}
                    </p>
                    
                    {/* Learn More link */}
                    <div className="mt-auto flex items-center text-lg font-bold text-corp-secondary cursor-pointer hover:text-yellow-500 transition-colors">
                        <span>{lang === 'en' ? 'Contact us for details' : 'تواصل معنا للتفاصيل'}</span>
                        <ArrowRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:rotate-180" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Corporate: React.FC<CorporateProps> = ({ lang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const t = {
    title: lang === 'en' ? 'Corporate Solutions' : 'حلول الشركات',
    subtitle: lang === 'en' 
      ? 'Tailored logistics infrastructure for enterprises, banks, and government entities.' 
      : 'بنية تحتية لوجستية مخصصة للمؤسسات والبنوك والجهات الحكومية.',
    contactBtn: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات',
    customersTitle: lang === 'en' ? 'Trusted by Industry Leaders' : 'شركاء النجاح',
    customersSubtitle: lang === 'en' ? 'We are proud to serve top tier companies in the region.' : 'فخورون بخدمة كبرى الشركات في المنطقة.',
    tabServices: lang === 'en' ? 'Our Services' : 'خدماتنا',
    whyUsTitle: lang === 'en' ? 'Why Choose Wassel Corporate?' : 'لماذا تختار واصل للشركات؟',
    whyUsSubtitle: lang === 'en' 
        ? 'Empowering your business with speed, security, and reliability.' 
        : 'تمكين أعمالك بالسرعة والأمان والموثوقية.',
  };

  const services = [
    {
      title: lang === 'en' ? 'Managed Archive Services' : 'خدمات إدارة الأرشيف',
      desc: lang === 'en'
        ? 'Secure off-site document storage and management solutions. We organize, index, and protect your critical business records with rapid physical or digital retrieval.' 
        : 'حلول آمنة لتخزين وإدارة المستندات خارج الموقع. نقوم بتنظيم وفهرسة وحماية سجلات عملك الهامة مع إمكانية الاسترجاع المادي أو الرقمي السريع.',
      icon: Archive,
      image: '/assets/archive.jpg'
    },
    {
      title: lang === 'en' ? 'Daily Mail Services' : 'البريد اليومي',
      desc: lang === 'en'
        ? 'Scheduled daily pickup and delivery routes for regular business correspondence. Keep your business moving with reliable, timed exchanges.' 
        : 'رحلات يومية مجدولة للاستلام والتوصيل لمراسلات الأعمال المنتظمة. حافظ على سير عملك مع تبادلات موثوقة.',
      icon: Mail,
      image: '/assets/daily-mail.jpg'
    },
    {
      title: lang === 'en' ? 'Document Signing' : 'توقيع المستندات',
      desc: lang === 'en'
        ? 'Courier-facilitated document signing where we ensure the recipient signs required paperwork upon delivery. Ideal for contracts and legal notices.' 
        : 'توقيع المستندات بمعاونة المندوب. نضمن توقيع المستلم للأوراق المطلوبة عند الاستلام، مثالية للعقود.',
      icon: FileSignature,
      image: '/assets/signing.jpg'
    },
    {
      title: lang === 'en' ? 'Storage Services' : 'خدمات التخزين',
      desc: lang === 'en'
        ? 'Secure, climate-controlled storage facilities for short-term needs. Flexible space options to handle seasonal inventory fluctuations.' 
        : 'مرافق تخزين آمنة ومتحكم في مناخها للاحتياجات قصيرة المدى. خيارات مساحة مرنة للتعامل مع تقلبات المخزون.',
      icon: Box,
      image: '/assets/storage.jpg'
    },
    {
      title: lang === 'en' ? 'Managed Warehousing' : 'إدارة المستودعات',
      desc: lang === 'en'
        ? 'Full-scale inventory management, order fulfillment, and distribution services. We handle the logistics so you can focus on growing your business.' 
        : 'إدارة مخزون شاملة، وتجهيز الطلبات، وخدمات التوزيع. نتولى نحن الخدمات اللوجستية لتتمكن من التركيز على عملك.',
      icon: Warehouse,
      image: '/assets/warehouse.png'
    },
    {
      title: lang === 'en' ? 'Wassel APIs' : 'واجهة برمجة التطبيقات',
      desc: lang === 'en'
        ? 'Integrate your ERP or e-commerce system directly with Wassel for automated shipping and tracking. Streamline your operations with real-time sync.' 
        : 'ربط نظامك مباشرة مع واصل للشحن والتتبع الآلي. بسّط عملياتك مع مزامنة البيانات في الوقت الفعلي.',
      icon: Server,
      image: '/assets/api.jpg'
    },
    {
      title: lang === 'en' ? 'Bulk Flat Mail' : 'البريد الشامل',
      desc: lang === 'en'
        ? 'Efficient distribution of marketing materials, magazines, and mass communications. Targeted delivery solutions for high-volume dispatch.' 
        : 'توزيع فعال للمواد التسويقية والمراسلات الجماعية. حلول توصيل مستهدفة للإرساليات ضخمة الحجم.',
      icon: Layers,
      image: '/assets/bulk.jpg'
    }
  ];

  const benefits = [
      {
          icon: Globe,
          title: { en: 'Unrivaled Network', ar: 'شبكة لا تضاهى' },
          desc: { en: 'The most extensive delivery network covering every corner of the West Bank, Gaza, and Jerusalem, connected globally.', ar: 'شبكة التوصيل الأكثر شمولاً التي تغطي كل ركن في الضفة الغربية وقطاع غزة والقدس، ومتصلة عالمياً.' }
      },
      {
          icon: ShieldCheck,
          title: { en: 'Secure Logistics', ar: 'خدمات لوجستية آمنة' },
          desc: { en: 'Trusted by banks and ministries for handling sensitive documents and high-value assets with military-grade protocols.', ar: 'موثوق بنا من قبل البنوك والوزارات للتعامل مع المستندات الحساسة والأصول عالية القيمة ببروتوكولات صارمة.' }
      },
      {
          icon: Server,
          title: { en: 'Advanced Tech', ar: 'تكنولوجيا متقدمة' },
          desc: { en: 'Full API integration capabilities, real-time tracking dashboards, and automated proof of delivery.', ar: 'قدرات ربط API كاملة، لوحات تتبع فورية، وإثبات تسليم آلي.' }
      },
      {
          icon: TrendingUp,
          title: { en: 'Scalable Growth', ar: 'نمو قابل للتوسع' },
          desc: { en: 'Flexible infrastructure that adapts to your peak seasons and expanding business requirements instantly.', ar: 'بنية تحتية مرنة تتكيف مع مواسم الذروة ومتطلبات توسع أعمالك فوراً.' }
      }
  ];

  const customers = [
      { name: 'Arab Bank', sector: lang === 'en' ? 'Banking' : 'بنوك' },
      { name: 'Paltel Group', sector: lang === 'en' ? 'Telecom' : 'اتصالات' },
      { name: 'Bank of Palestine', sector: lang === 'en' ? 'Banking' : 'بنوك' },
      { name: 'Ooredoo', sector: lang === 'en' ? 'Telecom' : 'اتصالات' },
      { name: 'Jawwal', sector: lang === 'en' ? 'Telecom' : 'اتصالات' },
      { name: 'Quds Bank', sector: lang === 'en' ? 'Banking' : 'بنوك' },
      { name: 'Ministry of Interior', sector: lang === 'en' ? 'Government' : 'حكومي' },
      { name: 'Cairo Amman Bank', sector: lang === 'en' ? 'Banking' : 'بنوك' },
  ];

  const stats = [
      { value: '220+', label: lang === 'en' ? 'delivery touchpoints' : 'نقطة تغطية' },
      { value: '24/7', label: lang === 'en' ? 'operational visibility' : 'رؤية تشغيلية' },
      { value: 'API', label: lang === 'en' ? 'integration-ready workflows' : 'تكامل جاهز' },
      { value: 'Secure', label: lang === 'en' ? 'enterprise handling' : 'مناولة مؤسسية آمنة' },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % services.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative min-h-screen font-sans">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-250px * ${customers.length})); }
        }
        @keyframes scroll-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(250px * ${customers.length})); }
        }
        .slider-track {
          animation: scroll 40s linear infinite;
          width: calc(250px * ${customers.length * 2});
        }
        html[dir="rtl"] .slider-track {
           animation: scroll-rtl 40s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* --- GLOBAL FIXED BACKGROUND --- */}
      <div className="fixed inset-0 z-0 bg-corp-dark">
         <img 
             src="/assets/corporate-bg.jpg" 
             alt="Corporate Background" 
             className="w-full h-full object-cover object-top"
             onError={(e) => {
                e.currentTarget.style.display = 'none';
             }}
         />
         {/* Increased Transparency Overlay for better Navbar visibility */}
         <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative text-white pt-48 pb-10 sm:pt-64 sm:pb-20 border-b border-white/10">
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-5xl tracking-tight font-extrabold text-corp-secondary sm:text-6xl md:text-7xl leading-tight animate-slide-up mb-6">
                    {t.title}
                </h1>
                <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto animate-slide-up delay-100">
                    {t.subtitle}
                </p>
                
                {/* Services Label removed based on user request */}
            </div>
        </div>

        {/* Content Area */}
        <div className="py-16 sm:py-24 overflow-hidden min-h-[600px]">
            {/* SERVICES CAROUSEL */}
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 animate-enter">
                
                {/* 1. Navigator */}
                <div className="max-w-7xl mx-auto mb-12">
                    <div className="flex overflow-x-auto md:flex-wrap gap-3 pb-4 no-scrollbar items-center md:justify-center px-4">
                        {services.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => goToSlide(i)}
                                className={`
                                    whitespace-nowrap px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-300 border
                                    ${i === currentIndex 
                                        ? 'bg-corp-secondary text-corp-primary border-corp-secondary shadow-lg scale-105 z-10' 
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'}
                                `}
                            >
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Slider Container */}
                <div className="relative max-w-7xl mx-auto group">
                    {/* Controls */}
                    <button title={lang === 'en' ? 'Previous service' : 'الخدمة السابقة'} aria-label={lang === 'en' ? 'Previous service' : 'الخدمة السابقة'} onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 lg:-ml-12 z-20 bg-white/10 hover:bg-corp-secondary hover:text-corp-primary text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-xl hidden md:block">
                        <ChevronLeft className="w-8 h-8 rtl:rotate-180" />
                    </button>
                    <button title={lang === 'en' ? 'Next service' : 'الخدمة التالية'} aria-label={lang === 'en' ? 'Next service' : 'الخدمة التالية'} onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 lg:-mr-12 z-20 bg-white/10 hover:bg-corp-secondary hover:text-corp-primary text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-xl hidden md:block">
                        <ChevronRight className="w-8 h-8 rtl:rotate-180" />
                    </button>

                    {/* Slides */}
                    <div className="overflow-hidden rounded-2xl" dir="ltr">
                        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                            {services.map((service, index) => (
                                <ServiceCard key={index} service={service} lang={lang} />
                            ))}
                        </div>
                    </div>

                    {/* Mobile Controls */}
                    <div className="flex justify-between items-center mt-6 md:hidden px-4">
                        <button title={lang === 'en' ? 'Previous service' : 'الخدمة السابقة'} aria-label={lang === 'en' ? 'Previous service' : 'الخدمة السابقة'} onClick={prevSlide} className="bg-white/10 p-3 rounded-full text-white hover:bg-corp-secondary hover:text-corp-primary transition-colors"><ChevronLeft className="w-6 h-6 rtl:rotate-180" /></button>
                        <div className="flex gap-2">
                            {services.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-corp-secondary' : 'bg-gray-600'}`}></div>))}
                        </div>
                        <button title={lang === 'en' ? 'Next service' : 'الخدمة التالية'} aria-label={lang === 'en' ? 'Next service' : 'الخدمة التالية'} onClick={nextSlide} className="bg-white/10 p-3 rounded-full text-white hover:bg-corp-secondary hover:text-corp-primary transition-colors"><ChevronRight className="w-6 h-6 rtl:rotate-180" /></button>
                    </div>
                </div>
            </div>
        </div>

        {/* Why Us Section */}
        <div className="py-20 relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
                        {t.whyUsTitle}
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        {t.whyUsSubtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((item, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-corp-secondary/20 flex items-center justify-center mb-6 group-hover:bg-corp-secondary transition-colors">
                                <item.icon className="w-8 h-8 text-corp-secondary group-hover:text-corp-primary transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                {lang === 'en' ? item.title.en : item.title.ar}
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {lang === 'en' ? item.desc.en : item.desc.ar}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Industries Section (Embedded) */}
        <div className="relative border-t border-white/10 bg-black/40 backdrop-blur-md">
            <Industries lang={lang} isEmbedded={true} />
        </div>

        {/* Customers Slider Section */}
        <div className="py-20 border-t border-white/10 overflow-hidden relative">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                    {t.customersTitle}
                </h2>
                <p className="mt-4 text-lg text-gray-400">
                    {t.customersSubtitle}
                </p>
            </div>
            
            <div className="relative w-full overflow-hidden">
                <div className="flex slider-track">
                    {/* First Set */}
                    {customers.map((cust, idx) => (
                        <div key={`a-${idx}`} className="w-[250px] flex-shrink-0 flex flex-col items-center justify-center px-4 group cursor-default">
                            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center mb-4 border border-white/20 group-hover:border-corp-secondary group-hover:bg-white transition-all duration-300">
                                <Briefcase className="text-gray-400 group-hover:text-corp-primary w-10 h-10 transition-colors" />
                            </div>
                            <span className="font-bold text-lg text-white group-hover:text-corp-secondary transition-colors">{cust.name}</span>
                            <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">{cust.sector}</span>
                        </div>
                    ))}
                    {/* Duplicate Set for Loop */}
                    {customers.map((cust, idx) => (
                        <div key={`b-${idx}`} className="w-[250px] flex-shrink-0 flex flex-col items-center justify-center px-4 group cursor-default">
                            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center mb-4 border border-white/20 group-hover:border-corp-secondary group-hover:bg-white transition-all duration-300">
                                <Briefcase className="text-gray-400 group-hover:text-corp-primary w-10 h-10 transition-colors" />
                            </div>
                            <span className="font-bold text-lg text-white group-hover:text-corp-secondary transition-colors">{cust.name}</span>
                            <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">{cust.sector}</span>
                        </div>
                    ))}
                </div>
                
                <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-corp-dark to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-corp-dark to-transparent pointer-events-none"></div>
            </div>
        </div>

        {/* Corporate Contact CTA */}
        <div id="contact" className="bg-corp-primary/80 backdrop-blur-sm border-t border-white/10">
            <div className="max-w-2xl mx-auto py-16 px-4 text-center sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">{lang === 'en' ? 'Ready to upgrade your logistics?' : 'مستعد لتطوير خدماتك اللوجستية؟'}</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-gray-300">
                {lang === 'en' 
                ? 'Our corporate team is ready to design a custom solution for your business needs.'
                : 'فريق الشركات لدينا مستعد لتصميم حل مخصص لاحتياجات عملك.'}
            </p>
            <a
                href="mailto:corporate@wassel.com"
                className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-bold rounded-md text-corp-primary bg-corp-secondary hover:bg-yellow-400 sm:w-auto transition-colors"
            >
                {lang === 'en' ? 'Email Corporate Team' : 'راسل فريق الشركات'}
            </a>
            </div>
        </div>
      </div>
    </div>
  );
};