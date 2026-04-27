import React, { useState, useEffect } from 'react';
import { Search, MapPin, Truck, CheckCircle, Clock, Bell, AlertTriangle, FileText, CreditCard, Package, MessageCircle, X, Send, Globe, Scale, Tag, ArrowRight, DollarSign, Copy, RefreshCw } from 'lucide-react';
import { TrackingEvent, Language } from '../../types';

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
    category: string;
    serviceType: string;
    origin: string;
    destination: string;
    weight: string;
}

const WASSEL_API_URL = 'http://external.wassel.ps:4040/api/GetAwbDetails';
const WASSEL_API_AUTH = 'Basic ' + btoa('ramallah_admin:Mo@2020!');

// Adds business days skipping Friday (5) and Saturday (6)
const addBusinessDays = (dateStr: string, days: number): string => {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  let added = 0;
  const d = new Date(parsed);
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay(); // 0=Sun,1=Mon,...,5=Fri,6=Sat
    if (dow !== 5 && dow !== 6) added++;
  }
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const getEventIcon = (status: string): TrackingEvent['icon'] => {
  const normalized = status.toLowerCase();

  if (normalized.includes('delivered') || normalized.includes('تم التوصيل') || normalized.includes('تم التسليم')) {
    return 'check';
  }

  if (
    normalized.includes('hold') ||
    normalized.includes('required') ||
    normalized.includes('not found') ||
    normalized.includes('معلق') ||
    normalized.includes('مطلوب') ||
    normalized.includes('رسوم')
  ) {
    return 'alert';
  }

  if (
    normalized.includes('transit') ||
    normalized.includes('dispatch') ||
    normalized.includes('delivery') ||
    normalized.includes('تم ارسال') ||
    normalized.includes('تجهيز') ||
    normalized.includes('النقل') ||
    normalized.includes('خرج')
  ) {
    return 'truck';
  }

  return 'box';
};

const buildRequiredAction = (summary: string, lang: Language): ActionRequired | null => {
  const normalized = summary.toLowerCase();

  if (normalized.includes('document') || normalized.includes('مستند')) {
    return {
      type: 'documents',
      title: lang === 'en' ? 'Documents Required' : 'مستندات مطلوبة',
      description: lang === 'en' ? 'Please upload the missing documents to continue the shipment.' : 'يرجى رفع المستندات الناقصة للمتابعة في الشحنة.',
      buttonText: lang === 'en' ? 'Upload Documents' : 'رفع المستندات',
      service: 'customs'
    };
  }

  if (normalized.includes('fee') || normalized.includes('customs') || normalized.includes('رسوم')) {
    return {
      type: 'fees',
      title: lang === 'en' ? 'Customs Fees Pending' : 'رسوم جمركية معلقة',
      description: lang === 'en' ? 'Customs fees are pending for this shipment.' : 'هناك رسوم جمركية معلقة لهذه الشحنة.',
      buttonText: lang === 'en' ? 'Pay Fees' : 'دفع الرسوم',
      service: 'customs'
    };
  }

  if (normalized.includes('cod') || normalized.includes('cash on delivery') || normalized.includes('الدفع عند التوصيل')) {
    return {
      type: 'cod',
      title: lang === 'en' ? 'Cash on Delivery' : 'الدفع عند الاستلام',
      description: lang === 'en' ? 'This shipment supports payment on delivery.' : 'هذه الشحنة تدعم الدفع عند الاستلام.',
      buttonText: lang === 'en' ? 'Pay Now' : 'ادفع الآن',
      service: 'cod'
    };
  }

  return null;
};

const parseAwbJson = (record: any, lang: Language) => {
  const shipmentInfo: ShipmentInfo = {
    category: lang === 'en' ? (record.mailType || 'Shipment') : (record.mailTypeAr || 'شحنة'),
    serviceType: lang === 'en' ? (record.serviceType || 'Wassel') : (record.serviceTypeAr || 'واصل'),
    origin: lang === 'en' ? (record.from || 'Unknown') : (record.fromAr || 'غير معروف'),
    destination: lang === 'en' ? (record.to || 'Unknown') : (record.toAr || 'غير معروف'),
    weight: record.grossWieght ? `${record.grossWieght} kg` : '—',
  };

  const trackingResult: TrackingEvent[] = (record.destinationLog || []).map((log: any) => {
    const status = lang === 'en' ? (log.portalDescription || '') : (log.portalDescriptionAr || log.portalDescription || '');
    const location = lang === 'en' ? (log.location || log.terminal || '—') : (log.locationAr || log.terminalAr || log.location || log.terminal || '—');
    return {
      status: status.trim() || '—',
      location,
      timestamp: `${log.statusDate || '—'} - ${log.statusTime || '—'}`,
      description: status.trim() || '—',
      icon: getEventIcon(status),
      relativeTime: log.differanceTime || '—',
      day: log.statusDay || '—',
      date: log.statusDate || '—',
      time: log.statusTime || '—',
    } as TrackingEvent;
  });

  const latestStatus = lang === 'en'
    ? (record.status || record.lastDestinationLog?.portalDescription || '')
    : (record.statusAr || record.lastDestinationLog?.portalDescriptionAr || record.status || '');

  const requiredAction = buildRequiredAction(`${latestStatus} ${shipmentInfo.serviceType}`, lang);

  return { shipmentInfo, trackingResult, requiredAction };
};

export const Tracking: React.FC<TrackingProps> = ({ lang, onNavigateToPayment, initialTrackingId, isPopup = false, mode = 'standard', onContact }) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId || '');
  const [trackingResult, setTrackingResult] = useState<TrackingEvent[] | null>(null);
  const [shipmentInfo, setShipmentInfo] = useState<ShipmentInfo | null>(null);
  const [requiredAction, setRequiredAction] = useState<ActionRequired | null>(null);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notified, setNotified] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [awbRecord, setAwbRecord] = useState<any>(null);
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
      placeholder: lang === 'en' ? 'Enter Tracking Number' : 'أدخل رقم التتبع',
      trackBtn: lang === 'en' ? 'Track' : 'تتبع',
      trackingNow: lang === 'en' ? 'Tracking...' : 'جاري التتبع...',
      copyNumber: lang === 'en' ? 'Copy Number' : 'نسخ الرقم',
      copied: lang === 'en' ? 'Copied!' : 'تم النسخ!',
      refresh: lang === 'en' ? 'Refresh' : 'تحديث',
      retryBtn: lang === 'en' ? 'Try Again' : 'حاول مرة أخرى',
      latestStatus: lang === 'en' ? 'Latest Status' : 'آخر حالة',
      errorLoading: lang === 'en' ? 'Unable to reach Wassel tracking right now. Please try again.' : 'تعذر الوصول إلى تتبع واصل حالياً. يرجى المحاولة مرة أخرى.',
      trackingIdLabel: lang === 'en' ? 'Tracking ID:' : 'رقم التتبع:',
      shipmentType: lang === 'en' ? 'Standard International Shipping' : 'شحن دولي قياسي',
      getUpdates: lang === 'en' ? 'Get Updates' : 'تلقي التحديثات',
      updatesTitle: lang === 'en' ? 'Get Shipment Updates' : 'احصل على تحديثات الشحنة',
      eventsTitle: lang === 'en' ? 'Tracking History' : 'سجل التتبع',
      eventsWhen: lang === 'en' ? 'When' : 'الوقت النسبي',
      eventsDay: lang === 'en' ? 'Day' : 'اليوم',
      eventsDate: lang === 'en' ? 'Date' : 'التاريخ',
      eventsTime: lang === 'en' ? 'Time' : 'الوقت',
      eventsStatus: lang === 'en' ? 'Status' : 'الحالة',
      eventsLocation: lang === 'en' ? 'Location' : 'الموقع',
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

  const executeTracking = async (id: string) => {
    const trimmedId = id.trim();
    if (!trimmedId) return;

    setTrackingId(trimmedId);
    setIsLoading(true);
    setErrorMessage('');
    setTrackingResult(null);
    setShipmentInfo(null);
    setRequiredAction(null);
    setNotFound(false);
    setAwbRecord(null);
    setPendingBillDetails(undefined);

    try {
      const response = await fetch(`${WASSEL_API_URL}?Awbs=${encodeURIComponent(trimmedId)}`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: WASSEL_API_AUTH },
      });

      if (!response.ok) {
        throw new Error(`Tracking request failed with status ${response.status}`);
      }

      const json = await response.json();

      if (!json.isSuccess || !json.data || json.data.length === 0) {
        setNotFound(true);
        return;
      }

      const record = json.data[0];
      const parsed = parseAwbJson(record, lang);

      setAwbRecord(record);
      setShipmentInfo(parsed.shipmentInfo);
      setTrackingResult(parsed.trackingResult);
      setRequiredAction(parsed.requiredAction);
    } catch (error) {
      console.error('Wassel tracking lookup failed:', error);
      setErrorMessage(t.errorLoading);
    } finally {
      setIsLoading(false);
    }
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

  const handleCopyTracking = async () => {
      if (!trackingId.trim() || !navigator.clipboard) return;
      await navigator.clipboard.writeText(trackingId);
      setCopiedTracking(true);
      window.setTimeout(() => setCopiedTracking(false), 1500);
  };

  const handleRefreshTracking = () => {
      if (trackingId.trim()) {
          executeTracking(trackingId);
      }
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
                    <button type="submit" disabled={isLoading || !trackingId.trim()} className="h-full rounded-lg bg-wassel-blue px-6 sm:px-10 text-white font-bold text-lg hover:bg-wassel-darkBlue transition-colors flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
                        <Package className="w-6 h-6" />
                        <span className="hidden sm:inline">{isLoading ? t.trackingNow : t.trackBtn}</span>
                    </button>
                </div>
            </div>
        </form>
      </div>

      {errorMessage && (
        <div className="max-w-4xl mx-auto mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="max-w-5xl mx-auto mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="h-5 w-40 rounded bg-gray-200 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="h-16 rounded-xl bg-gray-100"></div>
            <div className="h-16 rounded-xl bg-gray-100"></div>
            <div className="h-16 rounded-xl bg-gray-100"></div>
          </div>
          <div className="h-48 rounded-xl bg-gray-100"></div>
        </div>
      )}

      {(awbRecord || notFound) && (
        <div className="max-w-5xl mx-auto animate-slide-up space-y-6">
          {notFound ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.noData}</h3>
              <p className="text-gray-500 mb-5">{t.noDataDesc}</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={handleRefreshTracking} className="inline-flex items-center rounded-lg bg-wassel-blue px-4 py-2 text-sm font-semibold text-white hover:bg-wassel-darkBlue transition-colors">
                  <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t.retryBtn}
                </button>
                <button onClick={() => setShowContactForm(true)} className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <MessageCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t.contactSupport}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.latestStatus}</div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-wassel-blue/10 px-3 py-1 text-sm font-bold text-wassel-blue">{trackingResult?.[0]?.status || trackingId}</span>
                    <span className="text-sm text-gray-500">{trackingId}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleCopyTracking} className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Copy className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {copiedTracking ? t.copied : t.copyNumber}
                  </button>
                  <button type="button" onClick={handleRefreshTracking} className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t.refresh}
                  </button>
                </div>
              </div>

              {shipmentInfo && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="bg-slate-50 border-b border-gray-200 px-4 py-3 flex flex-wrap gap-x-2 gap-y-1 items-center">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.infoService}:</span>
                    <span className="text-sm font-bold text-wassel-blue">{shipmentInfo.serviceType}</span>
                    <span className="text-gray-300 mx-1">·</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.infoCategory}:</span>
                    <span className="text-sm font-bold text-gray-800">{shipmentInfo.category}</span>
                    {awbRecord?.expectedDeliveryDate && (
                      <>
                        <span className="text-gray-300 mx-1">·</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{lang === 'en' ? 'Expected' : 'المتوقع'}:</span>
                        <span className="text-sm font-bold text-gray-800">{addBusinessDays(awbRecord.expectedDeliveryDate, 3)}</span>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-100 rtl:divide-x-reverse">
                    <div className="p-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{t.infoOrigin}</p>
                      <p className="text-sm font-bold text-gray-900">{shipmentInfo.origin}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{t.infoDest}</p>
                      <p className="text-sm font-bold text-gray-900">{shipmentInfo.destination}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{t.infoWeight}</p>
                      <p className="text-sm font-bold text-gray-900">{shipmentInfo.weight}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{lang === 'en' ? 'Packages' : 'الطرود'}</p>
                      <p className="text-sm font-bold text-gray-900">{awbRecord?.totalPackges ?? '—'}</p>
                    </div>
                  </div>
                  {awbRecord?.lastDestinationLog && (
                    <div className="border-t border-gray-100 bg-wassel-blue/5 px-4 py-3 flex flex-wrap gap-3 items-center">
                      <MapPin className="w-4 h-4 text-wassel-blue shrink-0" />
                      <span className="text-sm font-bold text-wassel-blue">
                        {lang === 'en'
                          ? (awbRecord.lastDestinationLog.portalDescription || '')
                          : (awbRecord.lastDestinationLog.portalDescriptionAr || awbRecord.lastDestinationLog.portalDescription || '')}
                      </span>

                    </div>
                  )}
                </div>
              )}

              {trackingResult && trackingResult.length > 0 && (() => {
                // Group events by date
                const groups: { date: string; day: string; relativeTime: string; events: TrackingEvent[] }[] = [];
                trackingResult.forEach((event) => {
                  const key = event.date || '—';
                  const last = groups[groups.length - 1];
                  if (last && last.date === key) {
                    last.events.push(event);
                  } else {
                    groups.push({ date: key, day: event.day || '—', relativeTime: event.relativeTime || '—', events: [event] });
                  }
                });
                return (
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-slate-50 px-4 py-3">
                      <h3 className="text-lg font-bold text-wassel-blue">{t.eventsTitle}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-start font-semibold">{t.eventsTime}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t.eventsStatus}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t.eventsLocation}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {groups.map((group) => (
                            <React.Fragment key={group.date}>
                              <tr className="bg-gray-50 border-t border-gray-200">
                                <td colSpan={3} className="px-4 py-2">
                                  <span className="font-bold text-wassel-blue text-sm">{group.date}</span>
                                  <span className="mx-2 text-gray-300">·</span>
                                  <span className="text-xs text-gray-500">{group.day}</span>
                                  <span className="mx-2 text-gray-300">·</span>
                                  <span className="text-xs text-gray-400">{group.relativeTime}</span>
                                </td>
                              </tr>
                              {group.events.map((event, idx) => (
                                <tr key={`${event.timestamp}-${idx}`} className="border-t border-gray-100">
                                  <td className="px-4 py-3 text-gray-600 w-28">{event.time || '—'}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">{event.status}</td>
                                  <td className="px-4 py-3 text-gray-600">{event.location || '—'}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
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
                        <button title={lang === 'en' ? 'Close inquiry form' : 'إغلاق نموذج الاستفسار'} aria-label={lang === 'en' ? 'Close inquiry form' : 'إغلاق نموذج الاستفسار'} onClick={resetContactForm} className="text-gray-300 hover:text-white transition-colors">
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