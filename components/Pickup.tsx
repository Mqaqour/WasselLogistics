import React, { useState } from 'react';
import { Calendar, Package, MapPin, Smartphone, Check, Send } from 'lucide-react';
import { Language } from '../types';

interface PickupProps {
    lang: Language;
    isPopup?: boolean;
}

const PALESTINIAN_CITIES = [
  { en: 'Ramallah', ar: 'رام الله' },
  { en: 'Gaza', ar: 'غزة' },
  { en: 'Hebron', ar: 'الخليل' },
  { en: 'Nablus', ar: 'نابلس' },
  { en: 'Jenin', ar: 'جنين' },
  { en: 'Tulkarm', ar: 'طولكرم' },
  { en: 'Qalqilya', ar: 'قلقيلية' },
  { en: 'Bethlehem', ar: 'بيت لحم' },
  { en: 'Jericho', ar: 'أريحا' },
  { en: 'Salfit', ar: 'سلفيت' },
  { en: 'Tubas', ar: 'طوباس' },
  { en: 'Jerusalem', ar: 'القدس' }
];

export const Pickup: React.FC<PickupProps> = ({ lang, isPopup = false }) => {
  const [submitted, setSubmitted] = useState(false);
  
  // Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [city, setCity] = useState('');

  const t = {
    title: lang === 'en' ? 'Schedule a Pickup' : 'جدولة استلام',
    subtitle: lang === 'en' ? "We'll come to your door. Fill out the details below." : 'سنأتي إلى باب منزلك. املأ التفاصيل أدناه.',
    contactInfo: lang === 'en' ? 'Contact Information' : 'معلومات الاتصال',
    fullName: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
    phone: lang === 'en' ? 'Mobile Number' : 'رقم الجوال',
    location: lang === 'en' ? 'Pickup Location' : 'موقع الاستلام',
    address: lang === 'en' ? 'Address Details' : 'تفاصيل العنوان',
    city: lang === 'en' ? 'City' : 'المدينة',
    selectCity: lang === 'en' ? 'Select City' : 'اختر المدينة',
    notes: lang === 'en' ? 'Notes (Optional)' : 'ملاحظات (اختياري)',
    packageTime: lang === 'en' ? 'Package & Time' : 'الطرد والوقت',
    pickupDate: lang === 'en' ? 'Pickup Date' : 'تاريخ الاستلام',
    readyTime: lang === 'en' ? 'Ready Time' : 'وقت الجاهزية',
    numPackages: lang === 'en' ? 'Number of Packages' : 'عدد الطرود',
    pkgDescription: lang === 'en' ? 'Package Type / Description' : 'نوع / وصف الطرد',
    pkgDescPlaceholder: lang === 'en' ? 'e.g. Documents, Electronics, Clothes...' : 'مثال: مستندات، إلكترونيات، ملابس...',
    submit: lang === 'en' ? 'Submit Pickup Request' : 'إرسال طلب الاستلام',
    successTitle: lang === 'en' ? 'Pickup Scheduled!' : 'تم جدولة الاستلام!',
    successDesc: lang === 'en' ? 'Your request has been received. Our courier will contact you shortly to confirm the pickup time.' : 'تم استلام طلبك. سيتصل بك المندوب قريباً لتأكيد وقت الاستلام.',
    scheduleAnother: lang === 'en' ? 'Schedule Another' : 'جدولة طلب آخر',
    verify: lang === 'en' ? 'Verify' : 'تحقق',
    sendCode: lang === 'en' ? 'Send Code' : 'إرسال الرمز',
    codeSent: lang === 'en' ? 'Code sent' : 'تم الإرسال',
    enterCode: lang === 'en' ? 'Enter Code' : 'أدخل الرمز',
    verified: lang === 'en' ? 'Verified' : 'تم التحقق',
    verifyError: lang === 'en' ? 'Incorrect code' : 'رمز خاطئ',
    verifySuccess: lang === 'en' ? 'Mobile number verified' : 'تم التحقق من رقم الجوال'
  };

  const handleSendOtp = () => {
    if (phone.length < 9) {
        alert(lang === 'en' ? 'Please enter a valid mobile number' : 'يرجى إدخال رقم جوال صحيح');
        return;
    }
    setIsOtpSent(true);
    // Mock OTP send
    setTimeout(() => alert(lang === 'en' ? 'Your verification code is 1234' : 'رمز التحقق الخاص بك هو 1234'), 500);
  };

  const handleVerifyOtp = () => {
      if (otp === '1234') {
          setIsVerified(true);
          setIsOtpSent(false);
      } else {
          alert(t.verifyError);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
        alert(lang === 'en' ? 'Please verify your mobile number first' : 'يرجى التحقق من رقم الجوال أولاً');
        return;
    }
    // Simulate API call
    setTimeout(() => setSubmitted(true), 800);
  };

  const resetForm = () => {
      setSubmitted(false);
      setIsVerified(false);
      setPhone('');
      setOtp('');
      setIsOtpSent(false);
      setCity('');
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <Package className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-wassel-blue">{t.successTitle}</h2>
        <p className="mt-4 text-lg text-gray-500">{t.successDesc}</p>
        <button 
          onClick={resetForm}
          className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-wassel-blue bg-wassel-yellow hover:bg-wassel-lightYellow font-bold"
        >
          {t.scheduleAnother}
        </button>
      </div>
    );
  }

  return (
    <div className={isPopup ? "w-full p-2" : "max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8"}>
      <div className={`mb-8 ${isPopup ? 'text-center' : ''}`}>
        <h2 className={`font-extrabold text-wassel-blue ${isPopup ? 'text-2xl' : 'text-3xl'}`}>{t.title}</h2>
        <p className="mt-2 text-gray-500 text-sm sm:text-base">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 sm:p-8 space-y-8">
        {/* Contact Info */}
        <div>
            <h3 className="text-lg font-medium text-wassel-blue border-b pb-2 mb-4 flex items-center">
                <Smartphone className="w-5 h-5 rtl:ml-2 ltr:mr-2 text-gray-500" /> {t.contactInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t.fullName}</label>
                    <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t.phone}</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input 
                            type="tel" 
                            required 
                            disabled={isVerified}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rtl:rounded-r-md ltr:rounded-l-md border ${isVerified ? 'border-green-300 bg-green-50 text-green-900' : 'border-gray-300'} focus:ring-wassel-yellow focus:border-wassel-yellow`} 
                        />
                        {isVerified ? (
                            <span className="inline-flex items-center px-3 rtl:rounded-l-md ltr:rounded-r-md border border-l-0 rtl:border-l rtl:border-r-0 border-green-300 bg-green-50 text-green-600 font-bold text-sm">
                                <Check className="w-4 h-4 mr-1 rtl:ml-1" /> {t.verified}
                            </span>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleSendOtp}
                                disabled={isOtpSent || phone.length < 2}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rtl:rounded-l-md ltr:rounded-r-md shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-wassel-yellow"
                            >
                                {isOtpSent ? t.codeSent : t.sendCode}
                            </button>
                        )}
                    </div>
                    
                    {/* OTP Input Section */}
                    {isOtpSent && !isVerified && (
                        <div className="mt-3 flex gap-2 animate-enter">
                            <input 
                                type="text" 
                                placeholder={t.enterCode}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow text-center tracking-widest" 
                            />
                            <button 
                                type="button"
                                onClick={handleVerifyOtp}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-wassel-blue hover:bg-wassel-darkBlue"
                            >
                                {t.verify}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Location Info - Updated Order: City, Address, Notes */}
        <div>
            <h3 className="text-lg font-medium text-wassel-blue border-b pb-2 mb-4 flex items-center">
                <MapPin className="w-5 h-5 rtl:ml-2 ltr:mr-2 text-gray-500" /> {t.location}
            </h3>
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t.city}</label>
                        <select 
                            required 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow bg-white"
                        >
                            <option value="">{t.selectCity}</option>
                            {PALESTINIAN_CITIES.map((c) => (
                                <option key={c.en} value={c.en}>{lang === 'en' ? c.en : c.ar}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t.address}</label>
                        <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t.notes}</label>
                    <textarea rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
            </div>
        </div>

        {/* Package Details */}
        <div>
            <h3 className="text-lg font-medium text-wassel-blue border-b pb-2 mb-4 flex items-center">
                <Calendar className="w-5 h-5 rtl:ml-2 ltr:mr-2 text-gray-500" /> {t.packageTime}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t.pickupDate}</label>
                    <input required type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t.readyTime}</label>
                    <input required type="time" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">{t.numPackages}</label>
                    <input required type="number" min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t.pkgDescription}</label>
                    <input required type="text" placeholder={t.pkgDescPlaceholder} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
            </div>
        </div>

        <div className="pt-4">
            <button
                type="submit"
                disabled={!isVerified}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-wassel-blue hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {t.submit}
            </button>
        </div>
      </form>
    </div>
  );
};