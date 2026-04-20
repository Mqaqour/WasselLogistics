import React from 'react';
import { Truck, Plane, Container, FileText, Globe, ShoppingBag, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react';
import { Language, PageView } from '../types';

interface ServicesProps {
  lang: Language;
  onNavigate?: (view: PageView) => void;
}

export const Services: React.FC<ServicesProps> = ({ lang, onNavigate }) => {
  const t = {
    title: lang === 'en' ? 'Our Services' : 'خدماتنا',
    subtitle: lang === 'en' ? 'Comprehensive logistics and government document solutions suited for your needs.' : 'حلول لوجستية وخدمات وثائق حكومية شاملة تناسب احتياجاتك.',
    viewDetails: lang === 'en' ? 'View Service Details' : 'عرض تفاصيل الخدمة',
  };

  const services = [
    {
      id: 'domestic',
      title: lang === 'en' ? 'Domestic Delivery Service' : 'خدمة التوصيل المحلي',
      tagline: lang === 'en' ? 'Door-to-Door, Next Day' : 'من الباب للباب، في اليوم التالي',
      desc: lang === 'en' ? 'Fast and reliable door-to-door delivery across the country with cash on delivery options and real-time tracking.' : 'توصيل سريع وموثوق من الباب إلى الباب في جميع أنحاء البلاد مع خيارات الدفع عند الاستلام والتتبع الفوري.',
      icon: Truck,
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
      color: 'bg-cyan-900',
      heroImage: 'warehouse.png',
      view: 'service-clearance' as PageView
    }
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
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className={`absolute inset-0 ${service.color} opacity-60 group-hover:opacity-40 transition-opacity`}></div>
                        <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 text-white">
                                <service.icon className="w-6 h-6" />
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
      </div>
    </div>
  );
};