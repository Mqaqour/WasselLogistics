import React from 'react';
import { Truck, Plane, Container, FileText, Globe, ShoppingBag, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react';
import { Language, PageView } from '../../types';
import { AnimatedServiceIcon, AnimatedIconType } from '../icons/AnimatedServiceIcon';

interface ServicesProps {
  lang: Language;
  onNavigate?: (view: PageView) => void;
}

export const Services: React.FC<ServicesProps> = ({ lang, onNavigate }) => {
  const t = {
    title: lang === 'en' ? 'Our Services' : 'خدماتنا',
    subtitle: lang === 'en' ? 'Comprehensive logistics and government document solutions suited for your needs.' : 'حلول لوجستية وخدمات وثائق حكومية شاملة تناسب احتياجاتك.',
    viewDetails: lang === 'en' ? 'View Service Details' : 'عرض تفاصيل الخدمة',
    proofTitle: lang === 'en' ? 'Why customers choose Wassel' : 'لماذا يختار العملاء واصل',
    proofSubtitle: lang === 'en' ? 'Built for speed, confidence, and flexible delivery across Palestine and beyond.' : 'مصممة للسرعة والثقة وخيارات التسليم المرنة داخل فلسطين وخارجها.',
    trackNow: lang === 'en' ? 'Track now' : 'تتبع الآن',
    quoteNow: lang === 'en' ? 'Get a quote' : 'احصل على عرض سعر',
  };

  const services = [
    {
      id: 'domestic',
      title: lang === 'en' ? 'Domestic Delivery Service' : 'خدمة التوصيل المحلي',
      tagline: lang === 'en' ? 'Door-to-Door, Next Day' : 'من الباب للباب، في اليوم التالي',
      desc: lang === 'en' ? 'Fast and reliable door-to-door delivery across the country with cash on delivery options and real-time tracking.' : 'توصيل سريع وموثوق من الباب إلى الباب في جميع أنحاء البلاد مع خيارات الدفع عند الاستلام والتتبع الفوري.',
      icon: Truck,
      anim: 'truck' as AnimatedIconType,
      color: 'bg-blue-900',
      heroImage: 'truck.png',
      view: 'service-domestic' as PageView
    },
    {
      id: 'express',
      title: lang === 'en' ? 'International Express' : 'الشحن الدولي السريع',
      tagline: lang === 'en' ? 'Global Reach, Fast Transit' : 'وصول عالمي، عبور سريع',
      desc: lang === 'en' ? 'Worldwide shipping via FedEx & DHL partnerships. Send documents and parcels to over 220 countries.' : 'شحن لجميع أنحاء العالم عبر شراكاتنا مع فيديكس ودي إتش إل. أرسل المستندات والطرود لأكثر من 220 دولة.',
      icon: Plane,
      anim: 'plane' as AnimatedIconType,
      color: 'bg-yellow-500',
      heroImage: 'airplane.png',
      view: 'service-express' as PageView
    },
    {
      id: 'freight',
      title: lang === 'en' ? 'Cargo, Freight & Trucking' : 'الشحن والبضائع والنقل البري',
      tagline: lang === 'en' ? 'Heavy Lift, Bulk Transport' : 'رفع ثقيل، نقل بضائع',
      desc: lang === 'en' ? 'Heavy load transport and logistics solutions including LTL, FTL, and specialized equipment handling.' : 'نقل الحمولات الثقيلة والحلول اللوجستية بما في ذلك الشحن الجزئي والكلي ومناولة المعدات المتخصصة.',
      icon: Container,
      anim: 'container' as AnimatedIconType,
      color: 'bg-orange-900',
      heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000',
      view: 'service-corp-freight' as PageView
    },
    {
      id: 'passport',
      title: lang === 'en' ? 'Jordanian Passport Services' : 'خدمات الجوازات الأردنية',
      tagline: lang === 'en' ? 'Renewals & Issuance' : 'تجديد وإصدار',
      desc: lang === 'en' ? 'Secure assistance with issuance and renewal of Jordanian passports without the need to travel.' : 'مساعدة آمنة في إصدار وتجديد جوازات السفر الأردنية دون الحاجة للسفر.',
      icon: FileText,
      anim: 'document' as AnimatedIconType,
      color: 'bg-red-900',
      heroImage: 'https://images.unsplash.com/photo-1544026230-01d006198896?auto=format&fit=crop&q=80&w=2000',
      view: 'service-jordanian' as PageView
    },
    {
      id: 'permit',
      title: lang === 'en' ? 'Jordan Permit Service' : 'خدمة التصاريح الأردنية',
      tagline: lang === 'en' ? 'Travel Authorizations' : 'تصاريح السفر',
      desc: lang === 'en' ? 'Processing necessary travel and residency permits for entering and staying in Jordan.' : 'معالجة تصاريح السفر والإقامة اللازمة للدخول والإقامة في الأردن.',
      icon: ShieldCheck,
      anim: 'shield' as AnimatedIconType,
      color: 'bg-slate-800',
      heroImage: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=2000',
      view: 'service-jordanian' as PageView
    },
    {
      id: 'idp',
      title: lang === 'en' ? 'International Driver License' : 'رخصة القيادة الدولية',
      tagline: lang === 'en' ? 'Drive Globally' : 'قيادة عالمية',
      desc: lang === 'en' ? 'Get your certified international driving permit valid in over 150 countries worldwide.' : 'احصل على رخصة القيادة الدولية المعتمدة الصالحة في أكثر من 150 دولة حول العالم.',
      icon: CreditCard,
      anim: 'card' as AnimatedIconType,
      color: 'bg-emerald-800',
      heroImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2000',
      view: 'service-idp' as PageView
    },
    {
      id: 'shop',
      title: lang === 'en' ? 'Shop and Ship Service' : 'خدمة شوب آند شيب',
      tagline: lang === 'en' ? 'Shop Global, Receive Local' : 'تسوق عالمياً، استلم محلياً',
      desc: lang === 'en' ? 'Shop globally from US, UK, and UAE stores and we deliver to your local address.' : 'تسوق عالمياً من متاجر أمريكا، بريطانيا، والإمارات ونحن نقوم بالتوصيل لعنوانك المحلي.',
      icon: ShoppingBag,
      anim: 'bag' as AnimatedIconType,
      color: 'bg-indigo-900',
      heroImage: 'https://images.unsplash.com/photo-1516937941348-c09645f31e88?auto=format&fit=crop&q=80&w=2000',
      view: 'service-shop' as PageView
    },
    {
      id: 'clearance',
      title: lang === 'en' ? 'Customs Clearance Service' : 'خدمة التخليص الجمركي',
      tagline: lang === 'en' ? 'Expert Brokerage' : 'وساطة خبيرة',
      desc: lang === 'en' ? 'Expert handling of customs documentation and clearing to ensure smooth entry of your goods.' : 'تعامل خبير مع وثائق الجمارك والتخليص لضمان دخول سلس لبضائعك.',
      icon: Globe,
      anim: 'globe' as AnimatedIconType,
      color: 'bg-cyan-900',
      heroImage: 'warehouse.png',
      view: 'service-clearance' as PageView
    }
  ];

  const proofPoints = [
    { icon: Globe, value: '220+', label: lang === 'en' ? 'global destinations supported' : 'وجهة مدعومة عالمياً' },
    { icon: Truck, value: 'Fast', label: lang === 'en' ? 'pickup and delivery response' : 'استجابة سريعة للاستلام والتوصيل' },
    { icon: CreditCard, value: 'COD', label: lang === 'en' ? 'and online payment options' : 'وخيارات دفع مرنة' },
    { icon: ShieldCheck, value: 'Secure', label: lang === 'en' ? 'handling for parcels and documents' : 'مناولة آمنة للطرود والوثائق' },
  ];

  return (
    <div className="bg-white py-16">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-wassel-blue sm:text-4xl animate-slide-up">{t.title}</h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto animate-slide-up delay-100">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-12 rounded-3xl border border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50 p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-wassel-blue">{t.proofTitle}</h3>
            <p className="mt-2 text-gray-600">{t.proofSubtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {proofPoints.map((item, index) => (
              <div key={index} className="rounded-2xl bg-white p-4 text-center shadow-sm border border-white/80">
                <item.icon className="mx-auto mb-2 h-6 w-6 text-wassel-blue" />
                <div className="text-lg font-extrabold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
                <div 
                    key={index}
                    onClick={() => onNavigate && onNavigate(service.view)}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full transform hover:-translate-y-2 cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    {/* Image Area */}
                    <div className="relative h-48 overflow-hidden">
                        <img 
                            src={service.heroImage} 
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                                if (e.currentTarget.dataset.fallbackApplied === 'true') {
                                    e.currentTarget.style.display = 'none';
                                    return;
                                }
                                e.currentTarget.dataset.fallbackApplied = 'true';
                                e.currentTarget.src = '/assets/corporate-bg.jpg';
                            }}
                        />
                        <div className={`absolute inset-0 ${service.color} opacity-60 group-hover:opacity-40 transition-opacity`}></div>
                        <div className="absolute -bottom-7 left-6 rtl:left-auto rtl:right-6 z-20">
                            <div className={`relative w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center ring-1 ring-gray-100 ${service.color.replace('bg-', 'text-')}`}>
                                <AnimatedServiceIcon type={service.anim} className="w-9 h-9" />
                                <span className={`absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 w-3 h-3 rounded-full ${service.color} ring-2 ring-white`}></span>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-wassel-blue transition-colors">
                            {service.title}
                        </h3>
                        <p className="text-gray-500 text-sm font-medium mb-4 uppercase tracking-wider">
                            {service.tagline}
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                            {service.desc}
                        </p>
                        
                        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center text-wassel-blue font-bold text-sm group-hover:underline">
                            {t.viewDetails}
                            <ArrowRight className="w-4 h-4 ml-2 rtl:mr-2 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-12 rounded-3xl bg-wassel-blue px-6 py-8 text-white shadow-xl sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold">{lang === 'en' ? 'Ready to ship with confidence?' : 'جاهز للشحن بثقة؟'}</h3>
              <p className="mt-2 text-blue-100">{lang === 'en' ? 'Use tracking, rates, and pickup tools in just one step.' : 'استخدم أدوات التتبع والأسعار والاستلام في خطوة واحدة.'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onNavigate && onNavigate('tracking')} className="rounded-xl bg-white px-4 py-2 font-semibold text-wassel-blue hover:bg-blue-50 transition-colors">
                {t.trackNow}
              </button>
              <button onClick={() => onNavigate && onNavigate('rates')} className="rounded-xl border border-white/30 px-4 py-2 font-semibold text-white hover:bg-white/10 transition-colors">
                {t.quoteNow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};