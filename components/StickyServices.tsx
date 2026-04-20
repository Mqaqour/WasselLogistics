import React, { useState } from 'react';
import { Truck, Plane, Globe, ShoppingBag, ArrowRight, Calculator, Package, Search, CreditCard, FileText } from 'lucide-react';
import { Language } from '../types';

interface StickyServicesProps {
  lang: Language;
  onNavigate: (view: string) => void;
}

export const StickyServices: React.FC<StickyServicesProps> = ({ lang, onNavigate }) => {
  const [customsId, setCustomsId] = useState('');

  const t = {
    title: lang === 'en' ? 'Our Services' : 'خدماتنا',
    subtitle: lang === 'en' ? 'Comprehensive logistics solutions designed for you.' : 'حلول لوجستية شاملة مصممة خصيصاً لك.',
    domesticRate: lang === 'en' ? 'Domestic Rates' : 'أسعار المحلي',
    requestPickup: lang === 'en' ? 'Request Pickup' : 'طلب استلام',
    getRates: lang === 'en' ? 'Get Rates Info' : 'عرض الأسعار',
    orderNow: lang === 'en' ? 'Order Now' : 'اطلب الآن',
    applyNow: lang === 'en' ? 'Apply Now' : 'قدم الآن',
    customsLabel: lang === 'en' ? 'File Number' : 'رقم الملف',
    getData: lang === 'en' ? 'Get Data' : 'جلب البيانات',
    placeholder: lang === 'en' ? 'Enter file no...' : 'أدخل رقم الملف...',
  };

  const services = [
    {
      key: 'domestic',
      title: lang === 'en' ? 'Domestic Delivery' : 'التوصيل المحلي',
      desc: lang === 'en' ? 'Fast, reliable door-to-door delivery across the West Bank and Gaza.' : 'توصيل سريع وموثوق من الباب إلى الباب في جميع أنحاء الضفة الغربية وقطاع غزة.',
      icon: Truck,
      color: 'bg-wassel-blue', 
      image: 'truck.png'
    },
    {
      key: 'international',
      title: lang === 'en' ? 'International Express' : 'الشحن الدولي السريع',
      desc: lang === 'en' ? 'Connect with the world through our strategic partnerships with FedEx and DHL.' : 'تواصل مع العالم من خلال شراكاتنا الاستراتيجية مع FedEx و DHL.',
      icon: Plane,
      color: 'bg-yellow-500',
      image: 'airplane.png'
    },
    {
      key: 'shop',
      title: lang === 'en' ? 'Shop & Ship' : 'تسوق واستلم',
      desc: lang === 'en' ? 'Shop from international stores that don’t ship to Palestine using our global addresses.' : 'تسوق من متاجر عالمية لا تشحن لفلسطين باستخدام عناويننا العالمية.',
      icon: ShoppingBag,
      color: 'bg-indigo-900',
      image: 'https://images.unsplash.com/photo-1516937941348-c09645f31e88?auto=format&fit=crop&q=80&w=2000'
    },
    {
      key: 'idp',
      title: lang === 'en' ? 'Intl. Driving Permit' : 'رخصة القيادة الدولية',
      desc: lang === 'en' ? 'Get your certified international driving permit valid in over 150 countries.' : 'احصل على رخصة القيادة الدولية المعتمدة الصالحة في أكثر من 150 دولة.',
      icon: CreditCard,
      color: 'bg-emerald-800',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2000'
    },
    {
      key: 'jordanian',
      title: lang === 'en' ? 'Jordanian Passports' : 'خدمات الجوازات',
      desc: lang === 'en' ? 'Professional assistance for issuing and renewing Jordanian passports.' : 'مساعدة احترافية لإصدار وتجديد جوازات السفر الأردنية.',
      icon: FileText,
      color: 'bg-slate-800',
      image: 'https://images.unsplash.com/photo-1544026230-01d006198896?auto=format&fit=crop&q=80&w=2000'
    },
    {
      key: 'customs',
      title: lang === 'en' ? 'Customs Clearance' : 'التخليص الجمركي',
      desc: lang === 'en' ? 'Expert handling of complex customs procedures to ensure quick clearance.' : 'تعامل خبير مع الإجراءات الجمركية لضمان التخليص السريع.',
      icon: Globe,
      color: 'bg-cyan-900',
      image: 'warehouse.png'
    }
  ];

  return (
    <div className="bg-gray-50 py-24 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-96 bg-wassel-blue skew-y-3 origin-top-left transform -translate-y-24 z-0"></div>

      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-lg font-bold text-wassel-yellow uppercase tracking-wider mb-2 animate-slide-up">
            {t.title}
          </h2>
          <p className="text-4xl sm:text-5xl font-extrabold text-white animate-slide-up delay-100">
            {t.subtitle}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => (
                <div 
                    key={service.key}
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full transform hover:-translate-y-2 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    {/* Image Area */}
                    <div className="relative h-56 overflow-hidden shrink-0">
                        <img 
                            src={service.image} 
                            alt={service.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        {/* Overlay */}
                        <div className={`absolute inset-0 ${service.color} opacity-80 group-hover:opacity-70 transition-opacity`}></div>
                        
                        {/* Floating Icon */}
                        <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/30 text-white shadow-lg">
                            <service.icon className="w-8 h-8" />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-wassel-blue transition-colors">
                            {service.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-8 flex-1">
                            {service.desc}
                        </p>

                        {/* Action Area */}
                        <div className="mt-auto pt-6 border-t border-gray-100">
                            
                            {/* Domestic Actions */}
                            {service.key === 'domestic' && (
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={() => onNavigate('rates-domestic')}
                                        className="w-full flex items-center justify-between bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-xl font-bold transition-colors shadow-sm"
                                    >
                                        <span className="flex items-center gap-2"><Calculator className="w-4 h-4" /> {t.domesticRate}</span>
                                        <ArrowRight className="w-4 h-4 rtl:rotate-180 text-gray-400" />
                                    </button>
                                    <button 
                                        onClick={() => onNavigate('pickup')}
                                        className="w-full flex items-center justify-center gap-2 bg-wassel-yellow text-wassel-blue px-4 py-3 rounded-xl font-bold hover:bg-wassel-lightYellow transition-colors shadow-md"
                                    >
                                        <Truck className="w-5 h-5" />
                                        {t.requestPickup}
                                    </button>
                                </div>
                            )}

                            {/* International Actions */}
                            {service.key === 'international' && (
                                <button 
                                    onClick={() => onNavigate('rates-international')}
                                    className="w-full flex items-center justify-center gap-2 bg-wassel-blue text-white px-4 py-3 rounded-xl font-bold hover:bg-wassel-darkBlue transition-colors shadow-md"
                                >
                                    <Globe className="w-5 h-5" />
                                    {t.getRates}
                                </button>
                            )}

                            {/* Shop & Ship Actions */}
                            {service.key === 'shop' && (
                                <button 
                                    onClick={() => onNavigate('services')} // Navigate to full service page to see stores/details then order
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    {t.orderNow}
                                </button>
                            )}

                            {/* IDP Actions */}
                            {service.key === 'idp' && (
                                <button 
                                    onClick={() => onNavigate('idp-flow')}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
                                >
                                    <CreditCard className="w-5 h-5" />
                                    {t.applyNow}
                                </button>
                            )}

                            {/* Jordanian Passport Actions */}
                            {service.key === 'jordanian' && (
                                <button 
                                    onClick={() => onNavigate('contact')}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-md"
                                >
                                    <FileText className="w-5 h-5" />
                                    {t.applyNow}
                                </button>
                            )}

                            {/* Customs Actions */}
                            {service.key === 'customs' && (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder={t.placeholder}
                                            value={customsId}
                                            onChange={(e) => setCustomsId(e.target.value)}
                                            className="w-full border-gray-300 rounded-lg py-2.5 pl-3 rtl:pr-3 text-sm focus:ring-wassel-blue focus:border-wassel-blue bg-gray-50"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => onNavigate('tracking-customs')}
                                        className="w-full flex items-center justify-center gap-2 bg-cyan-700 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-cyan-800 transition-colors shadow-md text-sm"
                                    >
                                        <Search className="w-4 h-4" />
                                        {t.getData}
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};