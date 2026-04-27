import React, { useState } from 'react';
import { X, CreditCard, User, Truck, MapPin, CheckCircle, Car } from 'lucide-react';
import { Language } from '../../types';

interface IDPOrderModalProps {
    lang: Language;
    onClose: () => void;
}

export const IDPOrderModal: React.FC<IDPOrderModalProps> = ({ lang, onClose }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        licenseNo: '',
        idNumber: '',
        phone: '',
        deliveryMethod: 'pickup' as 'pickup' | 'delivery',
        city: '',
        address: ''
    });

    const t = {
        title: lang === 'en' ? 'International Driving Permit' : 'رخصة القيادة الدولية',
        step1: lang === 'en' ? 'Personal Details' : 'البيانات الشخصية',
        step2: lang === 'en' ? 'Payment' : 'الدفع',
        fullName: lang === 'en' ? 'Full Name (as in Passport)' : 'الاسم الكامل (كما في الجواز)',
        licenseNo: lang === 'en' ? 'Local License Number' : 'رقم الرخصة المحلية',
        idNumber: lang === 'en' ? 'ID Number' : 'رقم الهوية',
        phone: lang === 'en' ? 'Mobile Number' : 'رقم الموبايل',
        deliveryMethod: lang === 'en' ? 'Receive Method' : 'طريقة الاستلام',
        pickup: lang === 'en' ? 'Pickup from Office' : 'استلام من المكتب',
        delivery: lang === 'en' ? 'Delivery to Address' : 'توصيل للعنوان',
        city: lang === 'en' ? 'City' : 'المدينة',
        address: lang === 'en' ? 'Address Details' : 'تفاصيل العنوان',
        next: lang === 'en' ? 'Proceed to Payment' : 'المتابعة للدفع',
        pay: lang === 'en' ? 'Pay Now' : 'ادفع الآن',
        total: lang === 'en' ? 'Total Fees' : 'مجموع الرسوم',
        successTitle: lang === 'en' ? 'Application Submitted!' : 'تم تقديم الطلب!',
        successDesc: lang === 'en' 
            ? 'Your International Driving Permit is being processed. You will receive a confirmation SMS shortly.' 
            : 'جاري معالجة رخصة القيادة الدولية الخاصة بك. ستتلقى رسالة تأكيد نصية قريباً.',
        close: lang === 'en' ? 'Close' : 'إغلاق',
        cardName: lang === 'en' ? 'Cardholder Name' : 'اسم حامل البطاقة',
        cardNumber: lang === 'en' ? 'Card Number' : 'رقم البطاقة',
        expiry: lang === 'en' ? 'Expiry' : 'الانتهاء',
        cvc: lang === 'en' ? 'CVC' : 'رمز الأمان'
    };

    const FEE = 200; // Mock Fee

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API
        setTimeout(() => {
            setLoading(false);
            setStep(3);
        }, 1500);
    };

    return (
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-wassel-blue p-6 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Car className="w-6 h-6 text-wassel-yellow" />
                    </div>
                    <h2 className="text-xl font-bold">{t.title}</h2>
                </div>
                <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-0"></div>
                    
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= s ? 'bg-wassel-yellow text-wassel-blue' : 'bg-gray-200 text-gray-500'}`}>
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
                    <span>{t.step1}</span>
                    <span>{t.step2}</span>
                    <span>Done</span>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto">
                {step === 1 && (
                    <form onSubmit={handleNext} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                                <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                                <input required type="tel" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.licenseNo}</label>
                                <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" value={formData.licenseNo} onChange={e => setFormData({...formData, licenseNo: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.idNumber}</label>
                                <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">{t.deliveryMethod}</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setFormData({...formData, deliveryMethod: 'pickup'})}
                                    className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${formData.deliveryMethod === 'pickup' ? 'border-wassel-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.deliveryMethod === 'pickup' ? 'border-wassel-blue' : 'border-gray-300'}`}>
                                        {formData.deliveryMethod === 'pickup' && <div className="w-2.5 h-2.5 rounded-full bg-wassel-blue"></div>}
                                    </div>
                                    <User className="text-gray-600" />
                                    <span className="font-medium text-gray-900">{t.pickup}</span>
                                </div>
                                <div 
                                    onClick={() => setFormData({...formData, deliveryMethod: 'delivery'})}
                                    className={`cursor-pointer p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${formData.deliveryMethod === 'delivery' ? 'border-wassel-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.deliveryMethod === 'delivery' ? 'border-wassel-blue' : 'border-gray-300'}`}>
                                        {formData.deliveryMethod === 'delivery' && <div className="w-2.5 h-2.5 rounded-full bg-wassel-blue"></div>}
                                    </div>
                                    <Truck className="text-gray-600" />
                                    <span className="font-medium text-gray-900">{t.delivery}</span>
                                </div>
                            </div>
                        </div>

                        {formData.deliveryMethod === 'delivery' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-enter">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.city}</label>
                                    <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                                    <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-wassel-blue text-white font-bold py-4 rounded-xl shadow-lg hover:bg-wassel-darkBlue transition-colors flex items-center justify-center gap-2">
                            {t.next}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handlePayment} className="space-y-6 animate-enter">
                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center mb-6">
                            <span className="text-gray-600 font-medium">{t.total}</span>
                            <span className="text-2xl font-bold text-wassel-blue">{FEE} ILS</span>
                         </div>

                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.cardName}</label>
                                <input required type="text" placeholder="John Doe" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.cardNumber}</label>
                                <div className="relative">
                                    <input required type="text" placeholder="0000 0000 0000 0000" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border ltr:pl-10 rtl:pr-10" />
                                    <CreditCard className="w-5 h-5 text-gray-400 absolute top-3 ltr:left-3 rtl:right-3" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.expiry}</label>
                                    <input required type="text" placeholder="MM/YY" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.cvc}</label>
                                    <input required type="text" placeholder="123" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-2.5 border" />
                                </div>
                            </div>
                         </div>

                         <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                            {loading ? 'Processing...' : t.pay}
                         </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="text-center py-8 animate-pop">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.successTitle}</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">{t.successDesc}</p>
                        
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-8 max-w-sm mx-auto">
                            <div className="flex justify-between mb-2">
                                <span>Method:</span>
                                <span className="font-bold">{formData.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                            </div>
                            {formData.deliveryMethod === 'delivery' && (
                                <div className="flex justify-between">
                                    <span>City:</span>
                                    <span className="font-bold">{formData.city}</span>
                                </div>
                            )}
                        </div>

                        <button onClick={onClose} className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl shadow hover:bg-gray-800 transition-colors">
                            {t.close}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};