import React from 'react';
import { Tag, LayoutDashboard, Bell, ArrowRight, Handshake, Award, Cpu } from 'lucide-react';
import { Language } from '../../types';

interface SignUpBenefitsProps {
  lang: Language;
  onSignUp: () => void;
}

export const SignUpBenefits: React.FC<SignUpBenefitsProps> = ({ lang, onSignUp }) => {
  const t = {
    title: lang === 'en' ? 'Why Work With Wassel?' : 'لماذا أتعامل مع واصل؟',
    subtitle: lang === 'en' ? 'Strategic partnerships, deep expertise, and modern technology — all working for your shipments.' : 'علاقات استراتيجية، خبرة كبيرة، وتكنولوجيا متقدمة — جميعها تعمل لخدمة شحناتك.',
    btn: lang === 'en' ? 'Create Free Account' : 'أنشئ حساباً مجانياً',
  };

  const benefits = [
    {
      icon: Handshake,
      title: lang === 'en' ? 'Strategic Partnerships' : 'علاقات استراتيجية',
      desc: lang === 'en'
        ? 'A wide network of strategic partners across the region and worldwide that ensures fast, reliable, and cost-effective delivery.'
        : 'شبكة واسعة من الشركاء الاستراتيجيين محلياً ودولياً تضمن وصول شحناتك بسرعة وموثوقية وأسعار تنافسية.'
    },
    {
      icon: Award,
      title: lang === 'en' ? 'Extensive Expertise' : 'خبرة كبيرة',
      desc: lang === 'en'
        ? 'Years of accumulated experience in logistics, customs clearance, and supply chain management across diverse industries.'
        : 'سنوات من الخبرة المتراكمة في الخدمات اللوجستية والتخليص الجمركي وإدارة سلاسل التوريد في مختلف القطاعات.'
    },
    {
      icon: Cpu,
      title: lang === 'en' ? 'Advanced Technology' : 'تكنولوجيا متقدمة',
      desc: lang === 'en'
        ? 'Smart digital platforms, real-time tracking, and integrated systems built in-house to give you full visibility and control.'
        : 'منصات رقمية ذكية، تتبع لحظي، وأنظمة متكاملة مطوّرة داخلياً تمنحك رؤية كاملة وتحكماً تاماً بشحناتك.'
    },
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
    <div className="py-24 bg-wassel-blue">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center max-w-4xl mx-auto mb-16 animate-slide-up">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                {t.title}
            </h2>
            <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed">
                {t.subtitle}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {benefits.map((item, idx) => (
                <div
                    key={idx}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 lg:p-10 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${idx * 80}ms` }}
                >
                    <div className="flex items-center justify-center h-20 w-20 rounded-xl bg-wassel-yellow text-wassel-blue shadow-lg mb-6">
                        <item.icon className="h-10 w-10" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-snug">{item.title}</h3>
                    <p className="text-lg text-gray-300 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>

        <div className="mt-16 text-center animate-slide-up">
            <button
                onClick={onSignUp}
                className="inline-flex items-center px-10 py-5 border border-transparent text-xl font-bold rounded-md shadow-lg text-wassel-blue bg-wassel-yellow hover:bg-wassel-lightYellow transition-transform hover:-translate-y-1"
            >
                {t.btn}
                <ArrowRight className="rtl:mr-3 ltr:ml-3 h-6 w-6 rtl:rotate-180" />
            </button>
        </div>
      </div>
    </div>
  );
};