import React, { useState } from 'react';
import { Truck, Plane, FileCheck, ShoppingBag, Package, MapPin, CheckCircle, Smartphone, Globe, CreditCard, User } from 'lucide-react';
import { Language } from '../types';

interface ServiceFlowProps {
  lang: Language;
}

export const ServiceFlow: React.FC<ServiceFlowProps> = ({ lang }) => {
  const [activeService, setActiveService] = useState<'domestic' | 'international' | 'clearance' | 'shop'>('domestic');

  const t = {
    title: lang === 'en' ? 'How We Serve You' : 'كيف نخدمك',
    subtitle: lang === 'en' ? 'Select a service to see how it works' : 'اختر خدمة لمعرفة آلية العمل',
    services: {
      domestic: lang === 'en' ? 'Domestic Shipping' : 'الشحن المحلي',
      international: lang === 'en' ? 'International Express' : 'الشحن الدولي',
      clearance: lang === 'en' ? 'Parcel Clearance' : 'تخليص الطرود',
      shop: lang === 'en' ? 'Shop & Ship' : 'تسوق واستلم',
    },
    steps: lang === 'en' ? 'Simple Steps' : 'خطوات بسيطة'
  };

  const flowData = {
    domestic: [
      { 
        icon: Smartphone, 
        title: { en: 'Request Pickup', ar: 'اطلب الاستلام' }, 
        desc: { en: 'Schedule via App or Web', ar: 'جدول عبر التطبيق أو الموقع' } 
      },
      { 
        icon: Truck, 
        title: { en: 'We Collect', ar: 'نحن نستلم' }, 
        desc: { en: 'Driver arrives at your door', ar: 'المندوب يصل لبابك' } 
      },
      { 
        icon: CheckCircle, 
        title: { en: 'Next Day Delivery', ar: 'توصيل في اليوم التالي' }, 
        desc: { en: 'Safe delivery to destination', ar: 'توصيل آمن للوجهة' } 
      }
    ],
    international: [
      { 
        icon: Globe, 
        title: { en: 'Book Online', ar: 'احجز عبر الإنترنت' }, 
        desc: { en: 'Compare rates (DHL/FedEx)', ar: 'قارن الأسعار (DHL/FedEx)' } 
      },
      { 
        icon: Package, 
        title: { en: 'Drop or Pickup', ar: 'تسليم أو استلام' }, 
        desc: { en: 'Hand over your shipment', ar: 'سلم شحنتك' } 
      },
      { 
        icon: Plane, 
        title: { en: 'Global Tracking', ar: 'تتبع عالمي' }, 
        desc: { en: 'Real-time updates until delivery', ar: 'تحديثات لحظية حتى التوصيل' } 
      }
    ],
    clearance: [
      { 
        icon: FileCheck, 
        title: { en: 'Upload Docs', ar: 'ارفع المستندات' }, 
        desc: { en: 'Invoice & ID via Dashboard', ar: 'الفاتورة والهوية عبر لوحة التحكم' } 
      },
      { 
        icon: User, 
        title: { en: 'Expert Processing', ar: 'معالجة الخبراء' }, 
        desc: { en: 'We handle customs formalities', ar: 'نتولى الإجراءات الجمركية' } 
      },
      { 
        icon: Truck, 
        title: { en: 'Door Delivery', ar: 'توصيل للباب' }, 
        desc: { en: 'Receive cleared goods at home', ar: 'استلم بضائعك المخلصة في منزلك' } 
      }
    ],
    shop: [
      { 
        icon: MapPin, 
        title: { en: 'Get Address', ar: 'احصل على عنوان' }, 
        desc: { en: 'Use our global warehouse addresses', ar: 'استخدم عناوين مستودعاتنا العالمية' } 
      },
      { 
        icon: ShoppingBag, 
        title: { en: 'Shop Globally', ar: 'تسوق عالمياً' }, 
        desc: { en: 'Buy from Amazon, eBay, etc.', ar: 'اشترِ من أمازون، إيباي، إلخ' } 
      },
      { 
        icon: Package, 
        title: { en: 'We Consolidate', ar: 'نحن نجمع' }, 
        desc: { en: 'Combine items & save on shipping', ar: 'جمّع المشتريات ووفر في الشحن' } 
      }
    ]
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-3xl font-extrabold text-wassel-blue sm:text-4xl">{t.title}</h2>
          <p className="mt-4 text-xl text-gray-500">{t.subtitle}</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-slide-up delay-100">
          {(Object.keys(t.services) as Array<keyof typeof t.services>).map((key) => (
            <button
              key={key}
              onClick={() => setActiveService(key)}
              className={`px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 ${
                activeService === key
                  ? 'bg-wassel-blue text-white shadow-lg ring-2 ring-offset-2 ring-wassel-blue'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {t.services[key]}
            </button>
          ))}
        </div>

        {/* Interactive Flow Display */}
        <div className="relative bg-white rounded-2xl shadow-xl p-8 sm:p-12 overflow-hidden border border-gray-100 animate-pop">
           <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-y-1/2 -translate-x-1/2"></div>
           
           <div className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-1 bg-gray-100 z-0">
                      <div className="h-full bg-wassel-yellow w-full origin-left animate-[grow_1s_ease-out_forwards]"></div>
                  </div>

                  {flowData[activeService].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center group z-10 animate-slide-up" style={{ animationDelay: `${idx * 200}ms` }}>
                          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-wassel-yellow shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                              <step.icon className="w-8 h-8 text-wassel-blue" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{lang === 'en' ? step.title.en : step.title.ar}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed">{lang === 'en' ? step.desc.en : step.desc.ar}</p>
                          <span className="mt-4 text-xs font-bold text-wassel-yellow bg-wassel-blue/5 px-3 py-1 rounded-full">
                              {lang === 'en' ? `Step ${idx + 1}` : `خطوة ${idx + 1}`}
                          </span>
                      </div>
                  ))}
              </div>
           </div>
        </div>

        <style>{`
            @keyframes grow {
                from { transform: scaleX(0); }
                to { transform: scaleX(1); }
            }
        `}</style>
      </div>
    </div>
  );
};