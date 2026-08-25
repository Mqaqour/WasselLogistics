import React, { useState, useEffect } from 'react';
import { CheckCircle, Send, ShieldCheck, Loader2 } from 'lucide-react';

const BRAND_LOGO = `${import.meta.env.BASE_URL}assets/Wassel logo-01.png`;
const SMS_PROXY_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/sms/send-verification`;

const RegisterNewAppWestBank: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setInterval(() => setOtpCooldown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const normalizePhone = (v: string) => v.replace(/\s+/g, '');

  const handleSendOtp = () => {
    if (normalizePhone(mobileNo).length < 9) {
      setError('يرجى إدخال رقم جوال صحيح');
      return;
    }
    setError('');
    setShowConfirm(true);
  };

  const confirmAndSendOtp = async () => {
    setShowConfirm(false);
    const code = `${Math.floor(1000 + Math.random() * 9000)}`;
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch(SMS_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalizePhone(mobileNo),
          msg: `رمز التحقق من واصل: ${code} .صالح لمدة 5 دقائق`,
        }),
      });
      if (!res.ok) throw new Error('SMS failed');
      setGeneratedOtp(code);
      setIsOtpSent(true);
      setOtpCooldown(60);
    } catch {
      setOtpError('تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === generatedOtp) {
      setIsVerified(true);
      setIsOtpSent(false);
      setOtpError('');
    } else {
      setOtpError('رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isVerified) { setError('يرجى التحقق من رقم الجوال أولاً'); return; }
    if (!/^9000\d{6}$/.test(referenceNo)) { setError('رقم المرجع يجب أن يبدأ بـ 9000 ويتكون من 10 أرقام فقط.'); return; }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header + Hero */}
      <div className="bg-wassel-blue pb-16 pt-8 px-4 text-center text-white">
        <div className="max-w-2xl mx-auto">
          <img src={BRAND_LOGO} alt="Wassel Logistics" className="h-16 md:h-20 mx-auto mb-8 brightness-0 invert" />
          <h1 className="text-2xl md:text-3xl font-extrabold leading-relaxed">
            قم بتسجيل بيانات بطاقة المراجعة
          </h1>
          <p className="text-wassel-yellow mt-3 text-lg font-medium">
            وسنقوم باطلاعك عن حالة البطاقة أولاً بأول
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-lg w-full mx-auto px-4 -mt-8 relative z-10 pb-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2 className="text-xl font-extrabold text-wassel-blue">تم التسجيل بنجاح!</h2>
              <p className="text-gray-500">سنقوم بالتواصل معك عند أي تحديث على حالة بطاقتك.</p>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 w-full text-right space-y-2">
                <p className="text-sm text-gray-500">الاسم الرباعي: <span className="font-bold text-gray-800">{fullName}</span></p>
                <p className="text-sm text-gray-500">رقم الجوال: <span className="font-bold text-gray-800">{mobileNo}</span></p>
                <p className="text-sm text-gray-500">رقم المرجع: <span className="font-bold text-gray-800">{referenceNo}</span></p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الرباعي
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="الاسم الأول والثاني والثالث والرابع"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border text-right"
                />
              </div>

              {/* Mobile Number + OTP */}
              <div>
                <label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الجوال
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    id="mobileNo"
                    value={mobileNo}
                    onChange={(e) => { setMobileNo(e.target.value); setIsVerified(false); setIsOtpSent(false); setEnteredOtp(''); }}
                    required
                    disabled={isVerified}
                    placeholder="05XXXXXXXX"
                    className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border text-right disabled:bg-gray-50"
                  />
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || otpCooldown > 0}
                      className="shrink-0 bg-wassel-blue text-white text-sm font-bold px-4 rounded-lg hover:bg-wassel-darkBlue transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isSendingOtp ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
                      ) : otpCooldown > 0 ? (
                        `إعادة الإرسال (${otpCooldown})`
                      ) : isOtpSent ? (
                        'إعادة الإرسال'
                      ) : (
                        'إرسال الرمز'
                      )}
                    </button>
                  )}
                  {isVerified && (
                    <div className="shrink-0 flex items-center gap-1 text-green-600 font-bold text-sm px-2">
                      <ShieldCheck className="w-5 h-5" /> تم التحقق
                    </div>
                  )}
                </div>
              </div>

              {/* OTP entry */}
              {isOtpSent && !isVerified && (
                <div className="animate-enter">
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    رمز التحقق المرسل إلى جوالك
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="otp"
                      value={enteredOtp}
                      onChange={(e) => { setEnteredOtp(e.target.value); setOtpError(''); }}
                      maxLength={4}
                      placeholder="XXXX"
                      className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border text-center tracking-widest text-lg font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="shrink-0 bg-green-600 text-white text-sm font-bold px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      تحقق
                    </button>
                  </div>
                  {otpError && <p className="text-red-600 text-sm mt-1">{otpError}</p>}
                </div>
              )}

              <div>
                <label htmlFor="referenceNo" className="block text-sm font-medium text-gray-700 mb-1">
                  رقم المرجع (Reference No)
                </label>
                <input
                  type="text"
                  id="referenceNo"
                  value={referenceNo}
                  onChange={(e) => { setReferenceNo(e.target.value); setError(''); }}
                  required
                  placeholder="9000XXXXXX"
                  maxLength={10}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border text-right"
                />
                <p className="text-xs text-gray-400 mt-1">يبدأ بـ 9000 ويتكون من 10 أرقام</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              {/* Declaration */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed space-y-3">
                <p>
                  أقر بأنني قد فوّضت شركة البريد الأردني ووكيلها شركة واصل تفويضاً قانونياً صريحاً، وذلك لغرض الاستعلام أو التجديد أو إصدار جواز السفر الخاص بي، وأتعهد بالالتزام بدفع كافة الرسوم المترتبة على هذا الشأن عند طلبها.
                </p>
                <p>
                  كما أقرّ بأن جميع البيانات والمعلومات المقدّمة صحيحة ودقيقة وعلى مسؤوليتي الكاملة.
                </p>
                <label className="flex items-start gap-3 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-wassel-blue shrink-0"
                  />
                  <span className="font-medium text-wassel-blue">أوافق على الإقرار أعلاه</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!agreed}
                className="w-full bg-wassel-blue text-white font-bold py-4 rounded-xl shadow-lg hover:bg-wassel-darkBlue transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 rotate-180" />
                تسجيل البيانات
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto text-center pb-8 text-gray-400 text-xs">
        © {new Date().getFullYear()} واصل للخدمات اللوجستية. جميع الحقوق محفوظة.
      </div>
      {/* Phone Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4" dir="rtl">
            <ShieldCheck className="w-12 h-12 text-wassel-blue mx-auto" />
            <h3 className="text-lg font-extrabold text-gray-900">تأكيد رقم الجوال</h3>
            <p className="text-gray-500 text-sm">سنرسل رمز التحقق إلى هذا الرقم:</p>
            <p dir="ltr" className="text-xl font-bold text-wassel-blue">{normalizePhone(mobileNo)}</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirmAndSendOtp}
                className="flex-1 bg-wassel-blue text-white font-bold py-3 rounded-xl hover:bg-wassel-darkBlue transition-colors"
              >تأكيد وإرسال</button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterNewAppWestBank;