import React, { useState, useEffect } from 'react';
import { Search, MapPin, Truck, CheckCircle, Clock, Bell, AlertTriangle, FileText, CreditCard, Package, MessageCircle, X, Send, Globe, Scale, Tag, ArrowRight, DollarSign } from 'lucide-react';
import { TrackingEvent, Language } from '../types';

interface TrackingProps {
    lang: Language;
    onNavigateToPayment: (ref: string, service: string, billDetails?: { label: string; amount: number }[]) => void;
    initialTrackingId?: string;
    isPopup?: boolean;
    mode?: 'standard' | 'customs';
    onContact?: () => void;
}

interface ActionRequired {
    type: 'documents' | 'fees' | 'cod' | 'downpayment';
    title: string;
    description: string;
    buttonText: string;
    service: string;
}

interface ShipmentInfo {
    category: string; // Document vs Non-document
    serviceType: string; // Local, International, etc.
    origin: string;
    destination: string;
    weight: string;
}

export const Tracking: React.FC<TrackingProps> = ({ lang, onNavigateToPayment, initialTrackingId, isPopup = false, mode = 'standard', onContact }) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId || '');
  const [trackingResult, setTrackingResult] = useState<TrackingEvent[] | null>(null);
  const [shipmentInfo, setShipmentInfo] = useState<ShipmentInfo | null>(null);
  const [requiredAction, setRequiredAction] = useState<ActionRequired | null>(null);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notified, setNotified] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pendingBillDetails, setPendingBillDetails] = useState<{ label: string; amount: number }[] | undefined>(undefined);

  // Contact Form State
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const t = {
      title: mode === 'customs' 
        ? (lang === 'en' ? 'Add your clearance file number' : 'أدخل رقم ملف التخليص')
        : (lang === 'en' ? 'Track Your Shipment' : 'تتبع شحنتك'),
      subtitle: mode === 'customs'
        ? (lang === 'en' ? 'Enter your clearance file number to see exactly where your package is or If anything required from your side.' : 'أدخل رقم ملف التخليص لمعرفة مكان شحنتك بدقة أو إذا كان هناك أي إجراء مطلوب من جانبك.')
        : (lang === 'en' ? 'Enter your tracking number to see exactly where your package is.' : 'أدخل رقم التتبع لمعرفة مكان شحنتك بدقة.'),
      placeholder: lang === 'en' ? 'e.g., WSL-123456780 (Try ending with 0 for no data)' : 'مثال: WSL-123456780 (جرب النهاية 0 لعدم توفر بيانات)',
      trackBtn: lang === 'en' ? 'Track' : 'تتبع',
      trackingIdLabel: lang === 'en' ? 'Tracking ID:' : 'رقم التتبع:',
      shipmentType: lang === 'en' ? 'Standard International Shipping' : 'شحن دولي قياسي',
      getUpdates: lang === 'en' ? 'Get Updates' : 'تلقي التحديثات',
      updatesTitle: lang === 'en' ? 'Get Shipment Updates' : 'احصل على تحديثات الشحنة',
      updatesDesc: lang === 'en' ? 'Receive an email notification as soon as this shipment arrives at a Wassel facility or changes status.' : 'استلم إشعار عبر البريد الإلكتروني بمجرد وصول الشحنة إلى مرافق واصل أو تغيير حالتها.',
      emailLabel: lang === 'en' ? 'Email Address' : 'البريد الإلكتروني',
      emailPlaceholder: lang === 'en' ? 'you@example.com' : 'you@example.com',
      notifyMe: lang === 'en' ? 'Notify Me' : 'أبلغني',
      subscribed: lang === 'en' ? 'Subscribed!' : 'تم الاشتراك!',
      cancel: lang === 'en' ? 'Cancel' : 'إلغاء',
      contactSupport: lang === 'en' ? 'Contact Us About This' : 'تواصل معنا بخصوص هذا',
      
      // Shipment Info Labels
      infoOrigin: lang === 'en' ? 'From' : 'من',
      infoDest: lang === 'en' ? 'To' : 'إلى',
      infoWeight: lang === 'en' ? 'Weight' : 'الوزن',
      infoCategory: lang === 'en' ? 'Type' : 'النوع',
      infoService: lang === 'en' ? 'Service' : 'الخدمة',

      // Contact Form
      inquiryTitle: lang === 'en' ? 'Inquire About Shipment' : 'استفسار بخصوص الشحنة',
      nameLabel: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
      phoneLabel: lang === 'en' ? 'Mobile Number' : 'رقم الجوال',
      messageLabel: lang === 'en' ? 'Message' : 'الرسالة',
      sendMessage: lang === 'en' ? 'Send Message' : 'إرسال الرسالة',
      messageSent: lang === 'en' ? 'Message Sent Successfully!' : 'تم إرسال الرسالة بنجاح!',
      successDesc: lang === 'en' ? 'Thank you. We will contact you shortly.' : 'شكراً لك. سنقوم بالتواصل معك قريباً.',
      close: lang === 'en' ? 'Close' : 'إغلاق',

      // Action Alerts
      actionTitle: lang === 'en' ? 'Action Required' : 'إجراء مطلوب',
      docRequired: lang === 'en' ? 'Customs Documents Missing' : 'مستندات جمركية مفقودة',
      docDesc: lang === 'en' ? 'Please upload the required documents to proceed with customs clearance.' : 'يرجى رفع المستندات المطلوبة للمتابعة في التخليص الجمركي.',
      uploadBtn: lang === 'en' ? 'Upload Documents' : 'رفع المستندات',
      
      feesRequired: lang === 'en' ? 'Customs Fees Pending' : 'رسوم جمركية معلقة',
      feesDesc: lang === 'en' ? 'Customs fees have been assessed for this shipment. Please pay to release.' : 'تم تحديد رسوم جمركية لهذه الشحنة. يرجى الدفع للإفراج عنها.',
      payFeesBtn: lang === 'en' ? 'Pay Customs Fees' : 'دفع الرسوم الجمركية',

      // Combined Action
      customsFullReq: lang === 'en' ? 'Customs Action Required' : 'إجراء جمركي مطلوب',
      customsFullDesc: lang === 'en' ? 'Documents and customs fees are required to release this shipment.' : 'المستندات والرسوم الجمركية مطلوبة للإفراج عن هذه الشحنة.',
      
      codRequired: lang === 'en' ? 'Cash on Delivery Payment' : 'دفع عند الاستلام',
      codDesc: lang === 'en' ? 'This shipment requires COD payment. You can pay online now or upon delivery.' : 'تتطلب هذه الشحنة الدفع عند الاستلام. يمكنك الدفع عبر الإنترنت الآن أو عند الاستلام.',
      payCodBtn: lang === 'en' ? 'Pay COD Online' : 'دفع المبلغ الآن',

      // Down Payment
      downPaymentReq: lang === 'en' ? 'Down Payment Required' : 'مطلوب دفعة مقدمة',
      downPaymentDesc: lang === 'en' ? 'A down payment is required to proceed with clearance services for this international shipment.' : 'مطلوب دفعة مقدمة للمضي قدماً في خدمات التخليص لهذه الشحنة الدولية.',
      payDownBtn: lang === 'en' ? 'View & Pay Down Payment' : 'عرض ودفع الدفعة المقدمة',

      // No Data
      noData: lang === 'en' ? 'No Data Available' : 'لا تتوفر بيانات',
      noDataDesc: lang === 'en' ? 'We could not find any tracking information for this number yet. You can subscribe to get notified as soon as it appears in our system.' : 'لم نتمكن من العثور على أي معلومات تتبع لهذا الرقم بعد. يمكنك الاشتراك ليتم إعلامك بمجرد ظهورها في نظامنا.',

      status: {
          delivered: lang === 'en' ? 'Delivered' : 'تم التوصيل',
          outForDelivery: lang === 'en' ? 'Out for Delivery' : 'خرج للتوصيل',
          arrived: lang === 'en' ? 'Arrived at Facility' : 'وصل إلى المنشأة',
          inTransit: lang === 'en' ? 'In Transit' : 'في الطريق',
          pickedUp: lang === 'en' ? 'Picked Up' : 'تم الاستلام',
          onHold: lang === 'en' ? 'On Hold' : 'معلقة'
      },
      desc: {
          delivered: lang === 'en' ? 'Package delivered to recipient.' : 'تم تسليم الطرد للمستلم.',
          outForDelivery: lang === 'en' ? 'Courier is on the way.' : 'المندوب في الطريق إليك.',
          arrived: lang === 'en' ? 'Shipment arrived at Wassel facility.' : 'وصلت الشحنة إلى مرفق واصل.',
          inTransit: lang === 'en' ? 'Departed from origin facility.' : 'غادرت الشحنة منشأة المصدر.',
          pickedUp: lang === 'en' ? 'Shipment collected from sender.' : 'تم استلام الشحنة من المرسل.',
          onHoldDocs: lang === 'en' ? 'Shipment held: Awaiting customer documents.' : 'الشحنة معلقة: بانتظار مستندات العميل.',
          onHoldFees: lang === 'en' ? 'Shipment held: Awaiting customs payment.' : 'الشحنة معلقة: بانتظار دفع الرسوم الجمركية.',
          onHoldCOD: lang === 'en' ? 'Payment required before final delivery.' : 'الدفع مطلوب قبل التوصيل النهائي.',
          onHoldDP: lang === 'en' ? 'Shipment held: Awaiting down payment.' : 'الشحنة معلقة: بانتظار الدفعة المقدمة.'
      }
  };

  const executeTracking = (id: string) => {
    setTrackingResult(null); 
    setShipmentInfo(null);
    setRequiredAction(null);
    setNotFound(false);
    setPendingBillDetails(undefined);
    
    // Simulate tracking data logic with slight delay for effect
    setTimeout(() => {
        let action: ActionRequired | null = null;
        let latestEvent: TrackingEvent | null = null;
        let info: ShipmentInfo | null = null;
        let bill: { label: string; amount: number }[] | undefined = undefined;

        // Mock Logic based on ID ending
        if (id.trim().endsWith('0')) {
            // NO DATA FOUND CASE
            setNotFound(true);
        } else {
            // Base Mock Info (Default International)
            info = {
                category: lang === 'en' ? 'Non-Document' : 'غير مستند (طرد)',
                serviceType: lang === 'en' ? 'International' : 'دولي',
                origin: lang === 'en' ? 'Dubai - UAE' : 'دبي - الإمارات',
                destination: lang === 'en' ? 'Ramallah - Palestine' : 'رام الله - فلسطين',
                weight: '2.5 kg'
            };

            if (id.endsWith('1')) {
                // Documents Only (Customs)
                action = {
                    type: 'documents',
                    title: t.docRequired,
                    description: t.docDesc,
                    buttonText: t.uploadBtn,
                    service: 'customs'
                };
                latestEvent = { status: t.status.onHold, location: lang === 'en' ? 'Customs, Jordan' : 'الجمارك، الأردن', timestamp: 'Oct 24, 2023 - 09:00', description: t.desc.onHoldDocs, icon: 'alert' };
                // Override info for Document
                info.category = lang === 'en' ? 'Document' : 'مستند';
                info.weight = '0.5 kg';
                info.origin = lang === 'en' ? 'London - UK' : 'لندن - المملكة المتحدة';

            } else if (id.endsWith('2')) {
                // Fees Only
                 action = {
                    type: 'fees',
                    title: t.feesRequired,
                    description: t.feesDesc,
                    buttonText: t.payFeesBtn,
                    service: 'customs'
                };
                latestEvent = { status: t.status.onHold, location: lang === 'en' ? 'Customs, Jordan' : 'الجمارك، الأردن', timestamp: 'Oct 24, 2023 - 10:30', description: t.desc.onHoldFees, icon: 'alert' };
            } else if (id.endsWith('3')) {
                // COD - Local
                 action = {
                    type: 'cod',
                    title: t.codRequired,
                    description: t.codDesc,
                    buttonText: t.payCodBtn,
                    service: 'cod'
                };
                latestEvent = { status: t.status.outForDelivery, location: lang === 'en' ? 'Amman, Jordan' : 'عمان، الأردن', timestamp: 'Oct 24, 2023 - 08:00', description: t.desc.onHoldCOD, icon: 'truck' };
                // Override for Local
                info.serviceType = lang === 'en' ? 'Local' : 'محلي';
                info.origin = lang === 'en' ? 'Nablus' : 'نابلس';
                info.destination = lang === 'en' ? 'Hebron' : 'الخليل';
                info.weight = '1.2 kg';

            } else if (id.endsWith('4')) {
                // Both Documents and Fees
                 action = {
                    type: 'documents', // Initial step is documents
                    title: t.customsFullReq,
                    description: t.customsFullDesc,
                    buttonText: t.uploadBtn,
                    service: 'customs'
                };
                latestEvent = { status: t.status.onHold, location: lang === 'en' ? 'Customs, Jordan' : 'الجمارك، الأردن', timestamp: 'Oct 24, 2023 - 11:15', description: t.desc.onHoldDocs, icon: 'alert' };
            } else if (id.endsWith('5')) {
                // Jordanian Passport
                latestEvent = { status: t.status.inTransit, location: lang === 'en' ? 'Amman, Jordan' : 'عمان، الأردن', timestamp: 'Oct 22, 2023 - 10:00', description: t.desc.inTransit, icon: 'truck' };
                info = {
                    category: lang === 'en' ? 'Document' : 'مستند',
                    serviceType: lang === 'en' ? 'Jordanian Passport' : 'جواز سفر أردني',
                    origin: lang === 'en' ? 'Amman - Jordan' : 'عمان - الأردن',
                    destination: lang === 'en' ? 'Jerusalem' : 'القدس',
                    weight: '0.2 kg'
                };
            } else if (id.endsWith('6')) {
                // International Driving License
                latestEvent = { status: t.status.delivered, location: lang === 'en' ? 'Paris, France' : 'باريس، فرنسا', timestamp: 'Oct 22, 2023 - 10:00', description: t.desc.delivered, icon: 'check' };
                info = {
                    category: lang === 'en' ? 'Document' : 'مستند',
                    serviceType: lang === 'en' ? 'Intl. Driving License' : 'رخصة قيادة دولية',
                    origin: lang === 'en' ? 'Ramallah' : 'رام الله',
                    destination: lang === 'en' ? 'Paris - France' : 'باريس - فرنسا',
                    weight: '0.1 kg'
                };
            } else if (id.endsWith('7')) {
                // Down Payment Required (International Shipment)
                action = {
                    type: 'downpayment',
                    title: t.downPaymentReq,
                    description: t.downPaymentDesc,
                    buttonText: t.payDownBtn,
                    service: 'clearance_downpayment' // Mapped to new Payment Gateway Service Type
                };
                latestEvent = { status: t.status.onHold, location: lang === 'en' ? 'Amman, Jordan' : 'عمان، الأردن', timestamp: 'Oct 24, 2023 - 12:00', description: t.desc.onHoldDP, icon: 'alert' };
                
                // Define Bill Details for Down Payment
                bill = [
                    { label: lang === 'en' ? 'Customs Declaration Fee' : 'رسوم البيان الجمركي', amount: 50.00 },
                    { label: lang === 'en' ? 'Estimated Customs Duty (Down Payment)' : 'تقدير الرسوم الجمركية (دفعة مقدمة)', amount: 150.00 },
                    { label: lang === 'en' ? 'Handling Charges' : 'رسوم المناولة', amount: 20.00 }
                ];
            } else {
                // Normal International
                 latestEvent = { status: t.status.inTransit, location: lang === 'en' ? 'Dubai, UAE' : 'دبي، الإمارات', timestamp: 'Oct 22, 2023 - 10:00', description: t.desc.inTransit, icon: 'truck' };
            }
        }

        setRequiredAction(action);
        setShipmentInfo(info);
        setPendingBillDetails(bill);

        if(latestEvent) {
            const baseEvents: TrackingEvent[] = [
              { status: t.status.pickedUp, location: info?.origin || (lang === 'en' ? 'Dubai, UAE' : 'دبي، الإمارات'), timestamp: 'Oct 21, 2023 - 16:45', description: t.desc.pickedUp, icon: 'box' },
            ];
            setTrackingResult([latestEvent, ...baseEvents]);
        }
    }, 600);
  };

  useEffect(() => {
    if (initialTrackingId) {
        setTrackingId(initialTrackingId);
        executeTracking(initialTrackingId);
    }
  }, [initialTrackingId]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) return;
    executeTracking(trackingId);
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotified(true);
    setTimeout(() => {
        setShowNotifyModal(false);
        setNotified(false);
        setNotificationEmail('');
    }, 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate API call
      setTimeout(() => {
          setContactSent(true);
      }, 1000);
  };

  const resetContactForm = () => {
      setShowContactForm(false);
      setContactSent(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className={isPopup ? "w-full p-2" : "max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8"}>
      <div className={`text-center ${isPopup ? 'mb-8' : 'mb-12'}`}>
        <h2 className={`font-extrabold text-wassel-blue animate-slide-up ${isPopup ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
          {t.title}
        </h2>
        <p className="mt-4 text-lg text-gray-500 animate-slide-up delay-100">
          {t.subtitle}
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-16 animate-pop delay-200">
        <form onSubmit={handleTrack}>
            <div className="relative rounded-xl shadow-2xl bg-white transition-transform hover:scale-[1.01] duration-300">
                <input
                    type="text"
                    className="block w-full rounded-xl border-0 py-6 pl-8 pr-40 sm:pr-56 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-wassel-yellow text-lg sm:text-2xl sm:leading-relaxed rtl:pr-8 rtl:pl-40 sm:rtl:pl-56"
                    placeholder={t.placeholder}
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                />
                <div className="absolute inset-y-2 right-2 rtl:right-auto rtl:left-2 flex items-center">
                    <button type="submit" className="h-full rounded-lg bg-wassel-blue px-6 sm:px-10 text-white font-bold text-lg hover:bg-wassel-darkBlue transition-colors flex items-center gap-3">
                        <Package className="w-6 h-6" />
                        <span className="hidden sm:inline">{t.trackBtn}</span>
                    </button>
                </div>
            </div>
        </form>
      </div>

      {/* Action Required Alert */}
      {requiredAction && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm animate-pop">
            <div className="flex flex-col sm:flex-row">
                <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3 rtl:mr-3 flex-1">
                        <h3 className="text-sm font-bold text-red-800">{requiredAction.title}</h3>
                        <p className="mt-1 text-sm text-red-700">{requiredAction.description}</p>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-auto rtl:sm:mr-auto flex items-center justify-end">
                    <button
                        onClick={() => onNavigateToPayment(trackingId, requiredAction.service, pendingBillDetails)}
                        className="whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        {requiredAction.type === 'documents' && <FileText className="w-4 h-4 mr-2 rtl:ml-2" />}
                        {requiredAction.type === 'fees' && <CreditCard className="w-4 h-4 mr-2 rtl:ml-2" />}
                        {requiredAction.type === 'downpayment' && <DollarSign className="w-4 h-4 mr-2 rtl:ml-2" />}
                        {requiredAction.buttonText}
                    </button>
                </div>
            </div>
        </div>
      )}

      {(trackingResult || notFound) && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 animate-slide-up">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 border-b border-gray-200 gap-4">
            <div>
              <h3 className="text-lg leading-6 font-medium text-wassel-blue">
                {t.trackingIdLabel} <span className="text-wassel-yellow font-bold">{trackingId}</span>
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {notFound ? t.noData : t.shipmentType}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button 
                    onClick={() => setShowNotifyModal(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                    <Bell className="h-4 w-4 rtl:ml-2 ltr:mr-2 text-wassel-yellow" />
                    <span className="hidden sm:inline">{t.getUpdates}</span>
                    <span className="sm:hidden">{lang === 'en' ? 'Updates' : 'تحديثات'}</span>
                </button>
                <button 
                    onClick={() => setShowContactForm(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                    <MessageCircle className="h-4 w-4 rtl:ml-2 ltr:mr-2 text-gray-500" />
                    <span className="hidden sm:inline">{t.contactSupport}</span>
                    <span className="sm:hidden">{lang === 'en' ? 'Contact' : 'تواصل'}</span>
                </button>
            </div>
          </div>

          {/* Shipment Details Panel */}
          {shipmentInfo && (
              <div className="px-4 py-6 bg-blue-50/50 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {t.infoCategory}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{shipmentInfo.category}</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> {t.infoService}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{shipmentInfo.serviceType}</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {t.infoOrigin}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{shipmentInfo.origin}</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 rtl:rotate-180" /> {t.infoDest}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{shipmentInfo.destination}</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                              <Scale className="w-3 h-3" /> {t.infoWeight}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{shipmentInfo.weight}</span>
                      </div>
                  </div>
              </div>
          )}

          <div className="border-t border-gray-200 px-4 py-8 sm:p-8">
            {notFound ? (
                <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-6">
                        <Search className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t.noData}</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">{t.noDataDesc}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button
                            onClick={() => setShowNotifyModal(true)}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-wassel-blue hover:bg-wassel-darkBlue focus:outline-none transition-transform hover:-translate-y-1"
                        >
                            <Bell className="h-5 w-5 rtl:ml-2 ltr:mr-2" />
                            {t.notifyMe}
                        </button>
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                        >
                            <MessageCircle className="h-5 w-5 rtl:ml-2 ltr:mr-2 text-gray-500" />
                            {t.contactSupport}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flow-root">
                <ul className="-mb-8">
                    {trackingResult!.map((event, eventIdx) => (
                    <li key={eventIdx} className="animate-slide-in-right" style={{ animationDelay: `${eventIdx * 150}ms` }}>
                        <div className="relative pb-8">
                        {eventIdx !== trackingResult!.length - 1 ? (
                            <span
                            className="absolute top-4 rtl:right-4 ltr:left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                            />
                        ) : null}
                        <div className="relative flex gap-3">
                            <div>
                            <span
                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white transition-all duration-500 ${
                                eventIdx === 0 ? (event.icon === 'alert' ? 'bg-red-500' : 'bg-green-500') + ' scale-110' : 'bg-gray-400'
                                }`}
                            >
                                {event.icon === 'check' && <CheckCircle className="h-5 w-5 text-white" />}
                                {event.icon === 'truck' && <Truck className="h-5 w-5 text-white" />}
                                {event.icon === 'box' && <MapPin className="h-5 w-5 text-white" />}
                                {event.icon === 'alert' && <AlertTriangle className="h-5 w-5 text-white" />}
                            </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between gap-4">
                            <div>
                                <p className={`text-sm font-medium ${event.icon === 'alert' ? 'text-red-600' : 'text-wassel-blue'}`}>
                                {event.status}
                                </p>
                                <p className="text-sm text-gray-500">{event.description}</p>
                            </div>
                            <div className="rtl:text-left ltr:text-right text-sm whitespace-nowrap text-gray-500">
                                <time dateTime={event.timestamp} className="block">{event.timestamp.split(' - ')[0]}</time>
                                <time className="block text-xs">{event.timestamp.split(' - ')[1]}</time>
                                <span className="block text-xs font-semibold mt-1">{event.location}</span>
                            </div>
                            </div>
                        </div>
                        </div>
                    </li>
                    ))}
                </ul>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Notify Modal */}
      {showNotifyModal && (
        <div className="fixed z-[70] inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowNotifyModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left rtl:text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full animate-pop">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Bell className="h-6 w-6 text-wassel-yellow" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 rtl:sm:mr-4 rtl:sm:ml-0 sm:text-left rtl:sm:text-right w-full">
                    <h3 className="text-lg leading-6 font-medium text-wassel-blue" id="modal-title">
                      {t.updatesTitle}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {t.updatesDesc}
                      </p>
                      <form onSubmit={handleNotifySubmit} className="mt-4">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t.emailLabel}</label>
                          <input 
                            type="email" 
                            required 
                            id="email"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow sm:text-sm"
                            placeholder={t.emailPlaceholder}
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                          />
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2 sm:gap-0">
                            <button 
                                type="submit" 
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-wassel-blue text-base font-medium text-white hover:bg-wassel-darkBlue focus:outline-none sm:ml-3 rtl:sm:mr-3 rtl:sm:ml-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                                disabled={notified}
                            >
                                {notified ? t.subscribed : t.notifyMe}
                            </button>
                            <button type="button" onClick={() => setShowNotifyModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors">
                                {t.cancel}
                            </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Contact Us About This Modal */}
      {showContactForm && (
        <div className="fixed z-[80] inset-0 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={resetContactForm}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-middle bg-white rounded-xl text-left rtl:text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full animate-pop">
                    <div className="bg-wassel-blue px-4 py-3 sm:px-6 flex justify-between items-center text-white">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-wassel-yellow" />
                            {t.inquiryTitle}
                        </h3>
                        <button onClick={resetContactForm} className="text-gray-300 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {!contactSent ? (
                        <form onSubmit={handleContactSubmit} className="p-6">
                            <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">{t.trackingIdLabel}</span>
                                <span className="text-lg font-bold text-wassel-blue">{trackingId}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="c-name" className="block text-sm font-medium text-gray-700 mb-1">{t.nameLabel}</label>
                                    <input 
                                        type="text" 
                                        id="c-name" 
                                        required 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                                        value={contactForm.name}
                                        onChange={e => setContactForm({...contactForm, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="c-email" className="block text-sm font-medium text-gray-700 mb-1">{t.emailLabel}</label>
                                        <input 
                                            type="email" 
                                            id="c-email" 
                                            required 
                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                                            value={contactForm.email}
                                            onChange={e => setContactForm({...contactForm, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="c-phone" className="block text-sm font-medium text-gray-700 mb-1">{t.phoneLabel}</label>
                                        <input 
                                            type="tel" 
                                            id="c-phone" 
                                            required 
                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                                            value={contactForm.phone}
                                            onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="c-message" className="block text-sm font-medium text-gray-700 mb-1">{t.messageLabel}</label>
                                    <textarea 
                                        id="c-message" 
                                        rows={4} 
                                        required 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow"
                                        value={contactForm.message}
                                        onChange={e => setContactForm({...contactForm, message: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={resetContactForm} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
                                    {t.cancel}
                                </button>
                                <button type="submit" className="px-4 py-2 bg-wassel-blue text-white rounded-md hover:bg-wassel-darkBlue text-sm font-bold flex items-center gap-2 transition-colors">
                                    <Send className="w-4 h-4 rtl:rotate-180" />
                                    {t.sendMessage}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{t.messageSent}</h4>
                            <p className="text-gray-500 mb-6">{t.successDesc}</p>
                            <button onClick={resetContactForm} className="px-6 py-2 bg-wassel-blue text-white rounded-md hover:bg-wassel-darkBlue font-medium transition-colors">
                                {t.close}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};