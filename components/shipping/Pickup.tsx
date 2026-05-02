import React, { useEffect, useState } from 'react';
import { Calendar, Package, MapPin, Smartphone, Check, Send } from 'lucide-react';
import { Language } from '../../types';

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
    const SMS_PROXY_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || 'http://localhost:3001'}/api/sms/send-verification`;
    const PICKUP_REQUEST_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || 'http://localhost:3001'}/api/pickup/request`;

  const [submitted, setSubmitted] = useState(false);
  
  // Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
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
        sendingCode: lang === 'en' ? 'Sending...' : 'جاري الإرسال...',
        resendIn: lang === 'en' ? 'Resend in' : 'إعادة الإرسال خلال',
    codeSent: lang === 'en' ? 'Code sent' : 'تم الإرسال',
    enterCode: lang === 'en' ? 'Enter Code' : 'أدخل الرمز',
    verified: lang === 'en' ? 'Verified' : 'تم التحقق',
    verifyError: lang === 'en' ? 'Incorrect code' : 'رمز خاطئ',
        verifySuccess: lang === 'en' ? 'Mobile number verified' : 'تم التحقق من رقم الجوال',
        confirmPhoneTitle: lang === 'en' ? 'Confirm Mobile Number' : 'تأكيد رقم الجوال',
        confirmPhoneDesc: lang === 'en' ? 'We will send a verification code to this number:' : 'سنرسل رمز التحقق إلى هذا الرقم:',
        confirmSend: lang === 'en' ? 'Confirm & Send' : 'تأكيد وإرسال',
        cancel: lang === 'en' ? 'Cancel' : 'إلغاء',
        smsSentSuccess: lang === 'en' ? 'Verification code sent successfully' : 'تم إرسال رمز التحقق بنجاح',
          smsSendError: lang === 'en' ? 'Could not send verification code. Please try again.' : 'تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى.',
          submitError: lang === 'en' ? 'Could not submit pickup request. Please try again.' : 'تعذر إرسال طلب الاستلام. يرجى المحاولة مرة أخرى.',
          submitting: lang === 'en' ? 'Submitting...' : 'جاري الإرسال...'
  };

    useEffect(() => {
        if (otpCooldown <= 0) return;
        const timer = window.setInterval(() => {
            setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [otpCooldown]);

    const normalizePhone = (value: string): string => value.replace(/\s+/g, '');

    const buildOtpMessage = (code: string) => {
        if (lang === 'en') {
            return `Wassel verification code: ${code}. It expires in 5 minutes.`;
        }
        return `رمز التحقق من واصل: ${code} .صالح لمدة 5 دقائق`;
    };

  const handleSendOtp = () => {
        const normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.length < 9) {
        alert(lang === 'en' ? 'Please enter a valid mobile number' : 'يرجى إدخال رقم جوال صحيح');
        return;
    }
        if (otpCooldown > 0) {
            return;
        }
        setShowPhoneConfirm(true);
  };

    const confirmAndSendOtp = async () => {
        const normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.length < 9) return;

        const code = `${Math.floor(1000 + Math.random() * 9000)}`;
        setIsSendingOtp(true);

        try {
            const response = await fetch(SMS_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: normalizedPhone,
                    msg: buildOtpMessage(code),
                }),
            });

            if (!response.ok) {
                throw new Error(`SMS request failed with status ${response.status}`);
            }

            setGeneratedOtp(code);
            setIsOtpSent(true);
            setOtpCooldown(60);
            setShowPhoneConfirm(false);
            alert(t.smsSentSuccess);
        } catch (error) {
            console.error('Failed to send verification SMS:', error);
            alert(t.smsSendError);
        } finally {
            setIsSendingOtp(false);
        }
    };

  const handleVerifyOtp = () => {
            if (otp.trim() === generatedOtp) {
          setIsVerified(true);
          setIsOtpSent(false);
      } else {
          alert(t.verifyError);
      }
  };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isVerified) {
        alert(lang === 'en' ? 'Please verify your mobile number first' : 'يرجى التحقق من رقم الجوال أولاً');
        return;
    }

        const formData = new FormData(e.currentTarget);
        const payload = {
            fullName: String(formData.get('fullName') || '').trim(),
            phone: normalizePhone(phone),
            city: String(formData.get('city') || '').trim(),
            address: String(formData.get('address') || '').trim(),
            notes: String(formData.get('notes') || '').trim(),
            pickupDate: String(formData.get('pickupDate') || '').trim(),
            readyTime: String(formData.get('readyTime') || '').trim(),
            numPackages: String(formData.get('numPackages') || '').trim(),
            packageDescription: String(formData.get('packageDescription') || '').trim(),
        };

        setIsSubmittingRequest(true);
        try {
            const response = await fetch(PICKUP_REQUEST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Pickup request failed with status ${response.status}`);
            }

            setSubmitted(true);
        } catch (error) {
            console.error('Failed to submit pickup request:', error);
            alert(t.submitError);
        } finally {
            setIsSubmittingRequest(false);
        }
  };

  const resetForm = () => {
      setSubmitted(false);
      setIsVerified(false);
      setPhone('');
      setOtp('');
      setGeneratedOtp('');
      setIsOtpSent(false);
      setOtpCooldown(0);
      setShowPhoneConfirm(false);
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
                    <input name="fullName" title={t.fullName} required type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t.phone}</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input 
                            title={t.phone}
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
                                disabled={isSendingOtp || isOtpSent || otpCooldown > 0 || phone.length < 2}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rtl:rounded-l-md ltr:rounded-r-md shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-wassel-yellow"
                            >
                                {isSendingOtp
                                  ? t.sendingCode
                                  : (isOtpSent ? t.codeSent : (otpCooldown > 0 ? `${t.resendIn} ${otpCooldown}s` : t.sendCode))}
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
                            name="city"
                            title={t.city}
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
                        <input name="address" title={t.address} required type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t.notes}</label>
                    <textarea name="notes" title={t.notes} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
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
                    <input name="pickupDate" title={t.pickupDate} required type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t.readyTime}</label>
                    <input name="readyTime" title={t.readyTime} required type="time" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">{t.numPackages}</label>
                    <input name="numPackages" title={t.numPackages} required type="number" min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t.pkgDescription}</label>
                    <input name="packageDescription" required type="text" placeholder={t.pkgDescPlaceholder} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                </div>
            </div>
        </div>

        <div className="pt-4">
            <button
                type="submit"
                disabled={!isVerified || isSubmittingRequest}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-wassel-blue hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmittingRequest ? t.submitting : t.submit}
            </button>
        </div>
      </form>

            {showPhoneConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="absolute inset-0 bg-black/50" onClick={() => !isSendingOtp && setShowPhoneConfirm(false)}></div>
                    <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-wassel-blue">{t.confirmPhoneTitle}</h3>
                        <p className="mt-3 text-gray-600">{t.confirmPhoneDesc}</p>
                        <p className="mt-2 text-lg font-bold text-gray-900" dir="ltr">{normalizePhone(phone)}</p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPhoneConfirm(false)}
                                disabled={isSendingOtp}
                                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={confirmAndSendOtp}
                                disabled={isSendingOtp}
                                className="flex-1 rounded-md bg-wassel-blue px-4 py-2 text-sm font-semibold text-white hover:bg-wassel-darkBlue disabled:opacity-60"
                            >
                                {isSendingOtp ? t.sendingCode : t.confirmSend}
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </div>
  );
};