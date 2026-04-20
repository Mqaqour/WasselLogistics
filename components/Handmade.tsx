import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Truck, Globe, Heart, ShoppingBag, Gift, ArrowRight, UserPlus, Upload, X, CheckCircle, Image as ImageIcon, Star, ShieldCheck, DollarSign } from 'lucide-react';
import { Language } from '../types';

interface HandmadeProps {
  lang: Language;
}

export const Handmade: React.FC<HandmadeProps> = ({ lang }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
      name: '',
      craft: '',
      phone: '',
      email: '',
      description: ''
  });

  const t = {
    title: lang === 'en' ? 'Wassel Handmade' : 'واصل هاند ميد',
    subtitle: lang === 'en' ? 'Empowering local artisans to ship their creations worldwide.' : 'نمكن الحرفيين المحليين من شحن إبداعاتهم إلى جميع أنحاء العالم.',
    heroBtn: lang === 'en' ? 'Join Handmade Program' : 'انضم لبرنامج هاند ميد',
    whyTitle: lang === 'en' ? 'Why Choose Wassel Handmade?' : 'لماذا تختار واصل هاند ميد؟',
    
    features: [
      {
        icon: Globe,
        title: lang === 'en' ? 'Global Reach' : 'وصول عالمي',
        desc: lang === 'en' ? 'Expand your market beyond borders. We handle international logistics for you.' : 'وسع سوقك خارج الحدود. نحن نتولى الخدمات اللوجستية الدولية نيابة عنك.'
      },
      {
        icon: Heart,
        title: lang === 'en' ? 'Care for Crafts' : 'عناية فائقة',
        desc: lang === 'en' ? 'Specialized handling and packaging options for fragile and unique items.' : 'خيارات مناولة وتغليف متخصصة للقطع الهشة والفريدة من نوعها.'
      },
      {
        icon: Truck,
        title: lang === 'en' ? 'Discounted Rates' : 'أسعار مخفضة',
        desc: lang === 'en' ? 'Exclusive shipping rates tailored for small businesses and artisans.' : 'أسعار شحن حصرية مصممة للشركات الصغيرة والحرفيين.'
      }
    ],

    stepsTitle: lang === 'en' ? 'How It Works' : 'كيف يعمل البرنامج',
    steps: [
      {
        icon: UserPlus,
        title: lang === 'en' ? 'Open Account' : 'افتح حساب',
        desc: lang === 'en' ? 'Open your account to get started.' : 'افتح حسابك للبدء.'
      },
      {
        icon: Upload,
        title: lang === 'en' ? 'Add Products' : 'أضف المنتجات',
        desc: lang === 'en' ? 'Add your products to our 3,000,000 user portal.' : 'أضف منتجاتك إلى بوابتنا التي تضم 3 مليون مستخدم.'
      },
      {
        icon: ShoppingBag,
        title: lang === 'en' ? 'We Sell' : 'نحن نبيع',
        desc: lang === 'en' ? 'We handle the sales process for you.' : 'نحن نتولى عملية البيع نيابة عنك.'
      },
      {
        icon: Truck,
        title: lang === 'en' ? 'We Ship' : 'نحن نشحن',
        desc: lang === 'en' ? 'We pick up, pack, and deliver worldwide.' : 'نحن نستلم، نغلف، ونشحن لجميع أنحاء العالم.'
      }
    ],

    // Modal Translations
    modalHeaderTitle: lang === 'en' ? 'Turn Your Passion Into Profit' : 'حول شغفك إلى أرباح',
    modalHeaderSub: lang === 'en' ? 'Join 10,000+ artisans selling globally with Wassel.' : 'انضم إلى أكثر من 10,000 حرفي يبيعون عالمياً مع واصل.',
    labelName: lang === 'en' ? 'Artist / Brand Name' : 'اسم الفنان / العلامة التجارية',
    labelCraft: lang === 'en' ? 'Type of Craft' : 'نوع الحرفة',
    labelPhone: lang === 'en' ? 'Mobile Number' : 'رقم الموبايل',
    labelEmail: lang === 'en' ? 'Email Address' : 'البريد الإلكتروني',
    labelDesc: lang === 'en' ? 'Tell us about your work' : 'أخبرنا عن أعمالك',
    labelSample: lang === 'en' ? 'Upload Work Sample' : 'رفع عينة عمل',
    uploadPlaceholder: lang === 'en' ? 'Drag & drop or click to upload photo' : 'اسحب وأفلت أو انقر لرفع صورة',
    btnSubmit: lang === 'en' ? 'Start Selling Globally' : 'ابدأ البيع عالمياً',
    submitting: lang === 'en' ? 'Processing...' : 'جاري المعالجة...',
    successTitle: lang === 'en' ? 'Welcome to the Community!' : 'مرحباً بك في المجتمع!',
    successMsg: lang === 'en' ? 'Your application has been received. Our curator team is reviewing your portfolio and will contact you within 24 hours.' : 'تم استلام طلبك. يقوم فريقنا بمراجعة ملفك وسيتواصل معك خلال 24 ساعة.',
    btnClose: lang === 'en' ? 'Close Window' : 'إغلاق النافذة',
    
    benefits: [
        { text: lang === 'en' ? 'Global Shipping' : 'شحن عالمي', icon: Globe },
        { text: lang === 'en' ? 'Secure Payments' : 'دفع آمن', icon: ShieldCheck },
        { text: lang === 'en' ? '$0 Upfront Cost' : 'بدون تكلفة مقدمة', icon: DollarSign },
    ]
  };

  const handleJoinClick = () => {
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      // Reset form after closing
      setTimeout(() => {
          setIsSuccess(false);
          setFormData({ name: '', craft: '', phone: '', email: '', description: '' });
      }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      // Simulate API call
      setTimeout(() => {
          setIsSubmitting(false);
          setIsSuccess(true);
      }, 1500);
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Hero Section */}
      <div className="relative h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
            <img 
                src="bgHandmade.jpg" 
                alt="Handmade Crafts" 
                className="w-full h-full object-cover"
            />
            {/* Color Overlay - Transparent Orange/Amber Theme */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 to-amber-900/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
            <span className="inline-block py-1 px-3 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-200 text-xs font-bold tracking-wider uppercase mb-4 animate-slide-up backdrop-blur-sm">
                {lang === 'en' ? 'New Service' : 'خدمة جديدة'}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight animate-slide-up delay-100 drop-shadow-lg">
                {t.title}
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up delay-200 drop-shadow-md">
                {t.subtitle}
            </p>
            <button 
                onClick={handleJoinClick}
                className="bg-white text-orange-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-all transform hover:-translate-y-1 shadow-lg flex items-center gap-3 mx-auto animate-slide-up delay-300"
            >
                {t.heroBtn}
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-wassel-blue">{t.whyTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {t.features.map((feature, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 group">
                      <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-wassel-blue group-hover:bg-wassel-yellow group-hover:text-wassel-blue transition-colors">
                          <feature.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                  </div>
              ))}
          </div>
      </div>

      {/* Steps Section */}
      <div className="bg-wassel-blue text-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold">{t.stepsTitle}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                  {/* Connector Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-white/20"></div>

                  {t.steps.map((step, i) => (
                      <div key={i} className="relative z-10 text-center">
                          <div className="w-24 h-24 mx-auto bg-wassel-blue border-4 border-white/20 rounded-full flex items-center justify-center mb-6 shadow-xl relative">
                              <span className="absolute -top-2 -right-2 w-8 h-8 bg-wassel-yellow text-wassel-blue font-bold rounded-full flex items-center justify-center border-2 border-wassel-blue z-20">
                                  {i + 1}
                              </span>
                              <step.icon className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                          <p className="text-gray-300 max-w-xs mx-auto">{step.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Enhanced Registration Modal - Using Portal */}
      {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-wassel-blue/90 backdrop-blur-md animate-enter">
              {/* Modal Container: Full width/height on mobile, large max-width on desktop to fit screen */}
              <div className="bg-white w-full h-full md:h-auto md:max-h-[95vh] md:max-w-6xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative transform transition-all">
                  
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 md:p-10 text-white relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      
                      <button onClick={closeModal} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-20">
                          <X className="w-6 h-6" />
                      </button>

                      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left rtl:md:text-right">
                          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg text-orange-600 shrink-0 rotate-3">
                              <Star className="w-10 h-10 fill-current" />
                          </div>
                          <div>
                              <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">{t.modalHeaderTitle}</h3>
                              <p className="text-orange-100 text-lg max-w-xl">{t.modalHeaderSub}</p>
                              
                              {/* Mini Benefits Bar */}
                              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                                  {t.benefits.map((b, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
                                          <b.icon className="w-3 h-3 text-wassel-yellow" />
                                          {b.text}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 md:p-10 overflow-y-auto relative z-10 bg-white flex-1">
                      {!isSuccess ? (
                          <form onSubmit={handleSubmit} className="space-y-8 h-full flex flex-col">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-6">
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelName}</label>
                                          <input 
                                            required 
                                            type="text" 
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent p-4 transition-all text-gray-900"
                                            placeholder="e.g. Art by Sara"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelCraft}</label>
                                          <select 
                                            required 
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent p-4 transition-all text-gray-900"
                                            value={formData.craft}
                                            onChange={(e) => setFormData({...formData, craft: e.target.value})}
                                          >
                                              <option value="">Select Craft...</option>
                                              <option value="Pottery">Pottery & Ceramics</option>
                                              <option value="Textiles">Textiles & Embroidery</option>
                                              <option value="Jewelry">Jewelry</option>
                                              <option value="Woodwork">Woodwork</option>
                                              <option value="Other">Other</option>
                                          </select>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelPhone}</label>
                                              <input 
                                                required 
                                                type="tel" 
                                                className="w-full bg-gray-50 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent p-4 transition-all text-gray-900"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelEmail}</label>
                                              <input 
                                                required 
                                                type="email" 
                                                className="w-full bg-gray-50 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent p-4 transition-all text-gray-900"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                              />
                                          </div>
                                      </div>
                                  </div>

                                  <div className="space-y-6 flex flex-col">
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelDesc}</label>
                                          <textarea 
                                            rows={3}
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent p-4 transition-all text-gray-900"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                          />
                                      </div>

                                      <div className="flex-1 flex flex-col">
                                          <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelSample}</label>
                                          <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer group min-h-[150px]">
                                              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                                                  <ImageIcon className="w-7 h-7 text-gray-400 group-hover:text-orange-500" />
                                              </div>
                                              <span className="text-sm font-medium group-hover:text-orange-600">{t.uploadPlaceholder}</span>
                                              <span className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <div className="pt-4 mt-auto">
                                  <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xl py-5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-3"
                                  >
                                      {isSubmitting ? t.submitting : t.btnSubmit}
                                      {!isSubmitting && <ArrowRight className="w-6 h-6 rtl:rotate-180" />}
                                  </button>
                              </div>
                          </form>
                      ) : (
                          <div className="text-center py-20 animate-pop flex flex-col items-center justify-center h-full">
                              <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border-4 border-green-50">
                                  <CheckCircle className="w-16 h-16" />
                              </div>
                              <h3 className="text-4xl font-extrabold text-gray-900 mb-6">{t.successTitle}</h3>
                              <p className="text-gray-600 mb-12 max-w-md mx-auto leading-relaxed text-xl">
                                  {t.successMsg}
                              </p>
                              <button 
                                onClick={closeModal}
                                className="w-full max-w-md bg-gray-900 text-white font-bold py-5 rounded-xl hover:bg-gray-800 transition-colors shadow-lg text-lg"
                              >
                                  {t.btnClose}
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};