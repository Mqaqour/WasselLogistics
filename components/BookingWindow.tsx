import React, { useState } from 'react';
import { Package, User, MapPin, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { RateResult, Language } from '../types';

interface BookingWindowProps {
    lang: Language;
    initialRate: RateResult & { weight: number; origin: string; destination: string };
}

export const BookingWindow: React.FC<BookingWindowProps> = ({ lang, initialRate }) => {
    const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'success'>('details');
    const [bookingData, setBookingData] = useState({
        senderName: '',
        senderPhone: '',
        senderAddress: '',
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        contentDesc: '',
        declaredValue: ''
    });
    const [processingPayment, setProcessingPayment] = useState(false);
    const [generatedTrackingId, setGeneratedTrackingId] = useState('');

    const t = {
        bookingTitle: lang === 'en' ? 'Complete Your Booking' : 'إكمال الحجز',
        senderDetails: lang === 'en' ? 'Sender Details' : 'بيانات المرسل',
        receiverDetails: lang === 'en' ? 'Receiver Details' : 'بيانات المستلم',
        packageDetails: lang === 'en' ? 'Package Details' : 'تفاصيل الطرد',
        fullName: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
        phone: lang === 'en' ? 'Phone Number' : 'رقم الهاتف',
        address: lang === 'en' ? 'Full Address' : 'العنوان الكامل',
        contents: lang === 'en' ? 'Content Description' : 'وصف المحتوى',
        value: lang === 'en' ? 'Declared Value (ILS)' : 'القيمة المصرح بها (شيكل)',
        continuePayment: lang === 'en' ? 'Continue to Payment' : 'المتابعة للدفع',
        paymentDetails: lang === 'en' ? 'Payment Details' : 'تفاصيل الدفع',
        totalAmount: lang === 'en' ? 'Total Amount' : 'المبلغ الإجمالي',
        cardNumber: lang === 'en' ? 'Card Number' : 'رقم البطاقة',
        expiry: lang === 'en' ? 'Expiry' : 'الانتهاء',
        cvc: lang === 'en' ? 'CVC' : 'رمز الأمان',
        payNow: lang === 'en' ? 'Pay & Book' : 'دفع وحجز',
        bookingSuccess: lang === 'en' ? 'Booking Confirmed!' : 'تم تأكيد الحجز!',
        trackingNum: lang === 'en' ? 'Your Tracking Number:' : 'رقم التتبع الخاص بك:',
        successDesc: lang === 'en' ? 'A courier has been notified. You can track your shipment using the number above.' : 'تم إشعار المندوب. يمكنك تتبع شحنتك باستخدام الرقم أعلاه.',
        close: lang === 'en' ? 'Close Window' : 'إغلاق النافذة',
        back: lang === 'en' ? 'Back' : 'رجوع',
        fillAll: lang === 'en' ? 'Please fill all required fields' : 'يرجى تعبئة جميع الحقول المطلوبة'
    };

    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingStep('payment');
    };

    const processPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessingPayment(true);
        setTimeout(() => {
            setGeneratedTrackingId(`WSL-${Math.floor(10000000 + Math.random() * 90000000)}`);
            setProcessingPayment(false);
            setBookingStep('success');
        }, 1500);
    };

    const closeWindow = () => {
        window.close();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans text-wassel-blue" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-enter">
                {/* Header */}
                <div className="bg-wassel-blue px-8 py-6 flex justify-between items-center text-white">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Package className="w-8 h-8 text-wassel-yellow" />
                        {t.bookingTitle}
                    </h3>
                </div>

                {/* Content */}
                <div className="p-8">
                    
                    {/* Booking Steps Indicator */}
                    <div className="flex justify-between mb-10 relative px-8">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10"></div>
                        {['details', 'payment', 'success'].map((s, i) => {
                            const isActive = bookingStep === s;
                            const isPast = (bookingStep === 'payment' && s === 'details') || (bookingStep === 'success' && s !== 'success');
                            const stepNum = i + 1;
                            return (
                                <div key={s} className={`flex flex-col items-center gap-1 bg-white px-2`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isActive || isPast ? 'bg-wassel-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {isPast ? <CheckCircle className="w-6 h-6" /> : stepNum}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Selected Rate Summary */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-8 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="font-bold text-wassel-blue text-lg">{initialRate.provider}</p>
                            <p className="text-sm text-gray-600">{initialRate.service} - {initialRate.weight} kg</p>
                        </div>
                        <div className="text-right rtl:text-left">
                            <p className="font-bold text-2xl text-green-700">{initialRate.price.toFixed(2)} {initialRate.currency}</p>
                            <p className="text-sm text-gray-500">{initialRate.deliveryDate}</p>
                        </div>
                    </div>

                    {/* Step 1: Details Form */}
                    {bookingStep === 'details' && (
                        <form onSubmit={handleBookingSubmit} className="space-y-8 animate-enter">
                            
                            {/* Sender */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2 text-lg">
                                    <User className="w-5 h-5 text-gray-500" /> {t.senderDetails} ({initialRate.origin})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                                        <input required type="text" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.senderName} onChange={e => setBookingData({...bookingData, senderName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                                        <input required type="tel" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.senderPhone} onChange={e => setBookingData({...bookingData, senderPhone: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                                        <input required type="text" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.senderAddress} onChange={e => setBookingData({...bookingData, senderAddress: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Receiver */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2 text-lg">
                                    <MapPin className="w-5 h-5 text-gray-500" /> {t.receiverDetails} ({initialRate.destination})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                                        <input required type="text" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.receiverName} onChange={e => setBookingData({...bookingData, receiverName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                                        <input required type="tel" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.receiverPhone} onChange={e => setBookingData({...bookingData, receiverPhone: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                                        <input required type="text" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.receiverAddress} onChange={e => setBookingData({...bookingData, receiverAddress: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Package */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2 text-lg">
                                    <Package className="w-5 h-5 text-gray-500" /> {t.packageDetails}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.contents}</label>
                                        <input required type="text" placeholder="e.g. Clothes, Documents" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.contentDesc} onChange={e => setBookingData({...bookingData, contentDesc: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.value}</label>
                                        <input required type="number" min="0" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" value={bookingData.declaredValue} onChange={e => setBookingData({...bookingData, declaredValue: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button type="submit" className="bg-wassel-blue text-white px-8 py-4 rounded-xl font-bold hover:bg-wassel-darkBlue transition-colors flex items-center gap-3 shadow-lg text-lg">
                                    {t.continuePayment} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Payment */}
                    {bookingStep === 'payment' && (
                        <div className="animate-enter">
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 mb-8 text-center">
                                <p className="text-gray-500 text-sm mb-2 uppercase tracking-wide font-bold">{t.totalAmount}</p>
                                <p className="text-4xl font-extrabold text-green-600">{initialRate.price.toFixed(2)} {initialRate.currency}</p>
                            </div>

                            <form onSubmit={processPayment} className="space-y-8">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-lg">
                                    <CreditCard className="w-5 h-5 text-gray-500" /> {t.paymentDetails}
                                </h4>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.cardNumber}</label>
                                        <div className="relative">
                                            <input required type="text" placeholder="0000 0000 0000 0000" className="w-full border-gray-300 rounded-md p-3 border pl-10 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                                            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.expiry}</label>
                                            <input required type="text" placeholder="MM/YY" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.cvc}</label>
                                            <input required type="text" placeholder="123" className="w-full border-gray-300 rounded-md p-3 border focus:ring-wassel-yellow focus:border-wassel-yellow" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-between items-center">
                                    <button type="button" onClick={() => setBookingStep('details')} className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                                        <ArrowLeft className="w-5 h-5 rtl:rotate-180" /> {t.back}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={processingPayment}
                                        className="bg-green-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg disabled:opacity-70 flex items-center gap-2 text-lg"
                                    >
                                        {processingPayment ? 'Processing...' : t.payNow}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {bookingStep === 'success' && (
                        <div className="text-center py-12 animate-pop">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.bookingSuccess}</h3>
                            <p className="text-gray-500 mb-10 max-w-md mx-auto text-lg">{t.successDesc}</p>
                            
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 mb-10 max-w-md mx-auto">
                                <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide font-bold">{t.trackingNum}</p>
                                <p className="text-4xl font-extrabold text-wassel-blue tracking-wider">{generatedTrackingId}</p>
                            </div>

                            <button onClick={closeWindow} className="bg-wassel-blue text-white px-12 py-4 rounded-xl font-bold hover:bg-wassel-darkBlue transition-colors shadow-md text-lg">
                                {t.close}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};