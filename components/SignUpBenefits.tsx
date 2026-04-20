import React from 'react';
import { Tag, LayoutDashboard, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface SignUpBenefitsProps {
  lang: Language;
  onSignUp: () => void;
}

export const SignUpBenefits: React.FC<SignUpBenefitsProps> = ({ lang, onSignUp }) => {
  const t = {
    title: lang === 'en' ? 'Why Create a Wassel Account?' : 'لماذا تنشئ حساباً مع واصل؟',
    subtitle: lang === 'en' ? 'Unlock exclusive features tailored for your personal shipping needs.' : 'اكتشف ميزات حصرية مصممة لاحتياجات الشحن الشخصية الخاصة بك.',
    btn: lang === 'en' ? 'Create Free Account' : 'أنشئ حساباً مجانياً',
  };

  const benefits = [
    {
      icon: Tag,
      title: lang === 'en' ? 'Get Specific Prices' : 'احصل على أسعار خاصة',
      desc: lang === 'en' 
        ? 'Access exclusive rates and discounts available only to registered members for domestic and international shipping.' 
        : 'استمتع بأسعار وخصومات حصرية متاحة فقط للأعضاء المسجلين للشحن المحلي والدولي.'
    },
    {
      icon: LayoutDashboard,
      title: lang === 'en' ? 'Easily Manage Shipments' : 'إدارة سهلة للشحنات',
      desc: lang === 'en' 
        ? 'A unified dashboard to track all your packages, view history, and manage addresses in one place.' 
        : 'لوحة تحكم موحدة لتتبع جميع طرودك، عرض السجل، وإدارة العناوين في مكان واحد.'
    },
    {
      icon: Bell,
      title: lang === 'en' ? 'Instant Notifications' : 'إشعارات فورية',
      desc: lang === 'en' 
        ? 'Get notified directly via SMS or Email for any status change, delivery update, or action required.' 
        : 'احصل على إشعارات مباشرة عبر الرسائل النصية أو البريد الإلكتروني لأي تغيير في الحالة أو تحديث التوصيل.'
    }
  ];

  return (
    <div className="py-20 bg-wassel-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="mb-12 lg:mb-0 animate-slide-up">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6 leading-tight">
                    {t.title}
                </h2>
                <p className="text-lg text-gray-200 mb-8">
                    {t.subtitle}
                </p>
                <div className="space-y-8">
                    {benefits.map((item, idx) => (
                        <div key={idx} className="flex">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-wassel-yellow text-wassel-blue shadow-lg">
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="rtl:mr-4 ltr:ml-4">
                                <h3 className="text-lg leading-6 font-bold text-white">{item.title}</h3>
                                <p className="mt-2 text-base text-gray-300 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-10">
                    <button 
                        onClick={onSignUp}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-md shadow-sm text-wassel-blue bg-wassel-yellow hover:bg-wassel-lightYellow transition-transform hover:-translate-y-1"
                    >
                        {t.btn}
                        <ArrowRight className="rtl:mr-2 ltr:ml-2 h-5 w-5 rtl:rotate-180" />
                    </button>
                </div>
            </div>

            {/* Right Visual */}
            <div className="relative animate-slide-in-right delay-200">
                 {/* Abstract visual representation of dashboard/app */}
                 <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-gray-200">
                     <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-wassel-yellow rounded-full opacity-20 filter blur-2xl"></div>
                     <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-wassel-blue rounded-full opacity-10 filter blur-2xl"></div>

                     {/* Mock UI Elements */}
                     <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between border-l-4 border-wassel-blue">
                         <div>
                             <div className="h-2 w-24 bg-gray-200 rounded mb-2"></div>
                             <div className="h-2 w-16 bg-gray-100 rounded"></div>
                         </div>
                         <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                             <Tag className="w-4 h-4 text-wassel-blue" />
                         </div>
                     </div>
                     <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between border-l-4 border-wassel-yellow">
                         <div>
                             <div className="h-2 w-32 bg-gray-200 rounded mb-2"></div>
                             <div className="h-2 w-20 bg-gray-100 rounded"></div>
                         </div>
                         <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center">
                             <Bell className="w-4 h-4 text-yellow-600" />
                         </div>
                     </div>
                     
                     <div className="bg-slate-900 rounded-lg shadow-lg p-6 text-white mt-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                         <h3 className="font-bold text-lg mb-4 text-wassel-yellow border-b border-white/10 pb-3">{t.title}</h3>
                         <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                 <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                 <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                 <div className="w-3 h-3 rounded-full bg-green-400"></div>
                             </div>
                         </div>
                         <div className="space-y-3">
                             <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                             <div className="h-2 w-1/2 bg-white/20 rounded"></div>
                             <div className="h-2 w-full bg-white/20 rounded"></div>
                         </div>
                         <div className="mt-6 flex justify-between items-center">
                             <div className="flex items-center text-wassel-yellow text-sm font-bold">
                                 <CheckCircle2 className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> Verified Member
                             </div>
                             <div className="text-2xl font-bold">20% OFF</div>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};