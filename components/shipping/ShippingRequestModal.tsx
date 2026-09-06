import React, { useEffect, useState } from 'react';
import { X, Send, CheckCircle2, Loader2, Check } from 'lucide-react';
import { Language, RateResult } from '../../types';

export interface ShippingRequestDetails {
  requestType: 'international' | 'domestic';
  isDocument: boolean;
  weight: number;
  pkgLength?: number;
  pkgWidth?: number;
  pkgHeight?: number;
  origin?: { country?: string; city?: string; zip?: string };
  destination?: { country?: string; city?: string; zip?: string };
  rate: RateResult;
}

interface ShippingRequestModalProps {
  lang: Language;
  details: ShippingRequestDetails;
  onClose: () => void;
}

const SMS_PROXY_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/sms/send-verification`;

const normalizePhone = (value: string): string => value.replace(/\s+/g, '');

export const ShippingRequestModal: React.FC<ShippingRequestModalProps> = ({ lang, details, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contents, setContents] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Mobile verification
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpVerificationError, setOtpVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const t = {
    title: lang === 'en' ? 'Request This Shipment' : 'طلب هذه الشحنة',
    subtitle: lang === 'en'
      ? 'Our customer service team will reach out to confirm and process your shipment.'
      : 'سيتواصل معك فريق خدمة العملاء لتأكيد ومعالجة شحنتك.',
    name: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
    phone: lang === 'en' ? 'Phone Number' : 'رقم الهاتف',
    email: lang === 'en' ? 'Email (optional)' : 'البريد الإلكتروني (اختياري)',
    contents: lang === 'en' ? 'Shipment Contents' : 'محتوى الشحنة',
    contentsPlaceholder: lang === 'en' ? 'e.g., Clothes, documents, electronics...' : 'مثال: ملابس، مستندات، أجهزة إلكترونية...',
    addressDetails: lang === 'en' ? 'Address Details' : 'تفاصيل العنوان',
    addressDetailsPlaceholder: lang === 'en' ? 'Street, building, floor, nearest landmark...' : 'الشارع، المبنى، الطابق، أقرب معلم...',
    notes: lang === 'en' ? 'Notes (optional)' : 'الملاحظات (اختياري)',
    submit: lang === 'en' ? 'Send Request' : 'إرسال الطلب',
    submitting: lang === 'en' ? 'Sending...' : 'جاري الإرسال...',
    successTitle: lang === 'en' ? 'Request Sent!' : 'تم إرسال الطلب!',
    successBody: lang === 'en'
      ? 'Our team has received your shipping request and will contact you shortly.'
      : 'استلم فريقنا طلب الشحن الخاص بك وسيتواصل معك قريباً.',
    close: lang === 'en' ? 'Close' : 'إغلاق',
    errorGeneric: lang === 'en' ? 'Could not send your request. Please try again.' : 'تعذر إرسال طلبك. يرجى المحاولة مرة أخرى.',
    verify: lang === 'en' ? 'Verify' : 'تحقق',
    sendCode: lang === 'en' ? 'Send Code' : 'إرسال الرمز',
    sendingCode: lang === 'en' ? 'Sending...' : 'جاري الإرسال...',
    resendIn: lang === 'en' ? 'Resend in' : 'إعادة الإرسال خلال',
    codeSent: lang === 'en' ? 'Code sent' : 'تم الإرسال',
    enterCode: lang === 'en' ? 'Enter Code' : 'أدخل الرمز',
    verified: lang === 'en' ? 'Verified' : 'تم التحقق',
    verifyError: lang === 'en' ? 'Incorrect code' : 'رمز خاطئ',
    confirmPhoneTitle: lang === 'en' ? 'Confirm Mobile Number' : 'تأكيد رقم الجوال',
    confirmPhoneDesc: lang === 'en' ? 'We will send a verification code to this number:' : 'سنرسل رمز التحقق إلى هذا الرقم:',
    confirmSend: lang === 'en' ? 'Confirm & Send' : 'تأكيد وإرسال',
    cancel: lang === 'en' ? 'Cancel' : 'إلغاء',
    smsSendError: lang === 'en' ? 'Could not send verification code. Please try again.' : 'تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى.',
    verifyFirst: lang === 'en' ? 'Please verify your mobile number first' : 'يرجى التحقق من رقم الجوال أولاً',
    invalidPhone: lang === 'en' ? 'Please enter a valid mobile number' : 'يرجى إدخال رقم جوال صحيح',
  };

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const buildOtpMessage = (code: string) => {
    if (lang === 'en') {
      return `Wassel verification code: ${code}. It expires in 5 minutes.`;
    }
    return `رمز التحقق من واصل: ${code} .صالح لمدة 5 دقائق`;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setOtp('');
    setGeneratedOtp('');
    setIsOtpSent(false);
    setIsVerified(false);
    setShowOtpModal(false);
    setOtpVerificationError('');
  };

  const handlePhoneAction = () => {
    if (isOtpSent) {
      setShowOtpModal(true);
      return;
    }
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 9) {
      setError(t.invalidPhone);
      return;
    }
    if (otpCooldown > 0) return;
    setError('');
    setShowPhoneConfirm(true);
  };

  const confirmAndSendOtp = async () => {
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 9) return;

    const code = `${Math.floor(1000 + Math.random() * 9000)}`;
    setIsSendingOtp(true);
    setOtp('');
    setOtpVerificationError('');

    try {
      const response = await fetch(SMS_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: normalizedPhone, msg: buildOtpMessage(code) }),
      });

      if (!response.ok) throw new Error(`SMS request failed with status ${response.status}`);

      setGeneratedOtp(code);
      setIsOtpSent(true);
      setOtpCooldown(60);
      setShowPhoneConfirm(false);
      setShowOtpModal(true);
    } catch {
      setError(t.smsSendError);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.trim() === generatedOtp) {
      setIsVerified(true);
      setIsOtpSent(false);
      setShowOtpModal(false);
      setOtpVerificationError('');
    } else {
      setOtpVerificationError(t.verifyError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      setError(t.verifyFirst);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const backendUrl = import.meta.env.VITE_CHAT_BACKEND_URL?.trim() ?? '';
      const response = await fetch(`${backendUrl}/api/shipping-request/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: details.requestType,
          customerName: name,
          customerPhone: normalizePhone(phone),
          customerEmail: email || undefined,
          isDocument: details.isDocument,
          weight: details.weight,
          pkgLength: details.pkgLength,
          pkgWidth: details.pkgWidth,
          pkgHeight: details.pkgHeight,
          origin: details.origin,
          destination: details.destination,
          rate: details.rate,
          shipmentContents: contents,
          addressDetails: details.requestType === 'domestic' ? addressDetails : undefined,
          notes: details.requestType === 'domestic' ? (notes || undefined) : undefined,
          language: lang,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setSubmitted(true);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/50"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-wassel-blue px-5 py-4 text-white">
          <h3 className="text-lg font-bold">{submitted ? t.successTitle : t.title}</h3>
          <button onClick={onClose} aria-label={t.close} className="-m-2 p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700">{t.successBody}</p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-2.5 px-4 rounded-md bg-wassel-blue text-white font-bold hover:bg-wassel-darkBlue transition-colors"
              >
                {t.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500">{t.subtitle}</p>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.name}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.phone}</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="tel"
                    required
                    disabled={isVerified}
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rtl:rounded-r-md ltr:rounded-l-md border ${isVerified ? 'border-green-300 bg-green-50 text-green-900' : 'border-gray-300'} focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow`}
                  />
                  {isVerified ? (
                    <span className="inline-flex items-center px-3 rtl:rounded-l-md ltr:rounded-r-md border border-l-0 rtl:border-l rtl:border-r-0 border-green-300 bg-green-50 text-green-600 font-bold text-sm">
                      <Check className="w-4 h-4 mr-1 rtl:ml-1" /> {t.verified}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePhoneAction}
                      disabled={isSendingOtp || (!isOtpSent && otpCooldown > 0) || phone.length < 2}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rtl:rounded-l-md ltr:rounded-r-md shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-wassel-yellow whitespace-nowrap"
                    >
                      {isSendingOtp
                        ? t.sendingCode
                        : (isOtpSent ? t.enterCode : (otpCooldown > 0 ? `${t.resendIn} ${otpCooldown}s` : t.sendCode))}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.contents}</label>
                <textarea
                  required
                  rows={2}
                  placeholder={t.contentsPlaceholder}
                  value={contents}
                  onChange={(e) => setContents(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow resize-none"
                />
              </div>

              {details.requestType === 'domestic' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.addressDetails}</label>
                    <textarea
                      required
                      rows={2}
                      placeholder={t.addressDetailsPlaceholder}
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.notes}</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow resize-none"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !isVerified}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-wassel-blue text-white font-bold hover:bg-wassel-darkBlue transition-colors disabled:opacity-70"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t.submitting}</>
                ) : (
                  <><Send className="w-4 h-4" />{t.submit}</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {showPhoneConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
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

      {showOtpModal && isOtpSent && !isVerified && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOtpModal(false)}></div>
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
            <h3 className="text-xl font-bold text-wassel-blue">{t.enterCode}</h3>
            <p className="mt-3 text-gray-600">{t.codeSent}</p>
            <p className="mt-2 text-lg font-bold text-gray-900" dir="ltr">{normalizePhone(phone)}</p>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder={t.enterCode}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setOtpVerificationError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && otp.trim().length > 0) {
                  handleVerifyOtp();
                }
              }}
              className="mt-5 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow text-center tracking-widest text-lg font-semibold"
            />

            {otpVerificationError && (
              <p className="mt-2 text-sm font-medium text-red-600">{otpVerificationError}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otp.trim().length === 0}
                className="flex-1 rounded-md bg-wassel-blue px-4 py-2 text-sm font-semibold text-white hover:bg-wassel-darkBlue disabled:opacity-60"
              >
                {t.verify}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
