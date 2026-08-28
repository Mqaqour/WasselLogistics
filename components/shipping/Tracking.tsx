import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, Truck, CheckCircle, Clock, Bell, AlertTriangle, FileText, CreditCard, Package, MessageCircle, X, Send, Globe, Scale, Tag, ArrowRight, DollarSign, Copy, RefreshCw, Plane, IdCard, FileCheck, Ship, Container, Loader2 } from 'lucide-react';
import { TrackingEvent, Language } from '../../types';
import { useTypewriter } from '../../hooks/useTypewriter';

// Icons for the track button, synced by index to the placeholder's typewriter word list
const TRACK_ICONS = [Package, Plane, Truck, IdCard, FileCheck, Ship, Container];

interface TrackingProps {
    lang: Language;
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

const WASSEL_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/wassel/track`;

const JO_PASSPORT_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/jopassport/track`;

const DHL_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/dhl/track`;

const FEDEX_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/fedex/track`;

const WAITING_SHIPMENTS_BASE_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/waiting-shipments`;
const WAITING_SHIPMENTS_URL = `${WAITING_SHIPMENTS_BASE_URL}/register`;
const WAITING_SHIPMENTS_CHECK_URL = `${WAITING_SHIPMENTS_BASE_URL}/check`;

type Carrier = 'wassel' | 'dhl' | 'fedex' | 'passport';

const isJordanPassportNumber = (id: string): boolean => {
  const upper = id.trim().toUpperCase();
  return upper.length === 13 && (upper.startsWith('QW') || upper.startsWith('RA')) && upper.endsWith('JO');
};

// Routes a tracking number to a carrier by its known number format, before ever calling an API.
// Checked most-specific-first (prefixed formats) so a bare-length fallback can't shadow them —
// e.g. a FedEx number starting with "88" must still match the Wassel rule, not the FedEx one.
const detectCarrier = (id: string): Carrier => {
  const trimmed = id.trim();
  const upper = trimmed.toUpperCase();

  if (isJordanPassportNumber(trimmed)) return 'passport';
  if (trimmed.length === 12 && trimmed.startsWith('88')) return 'wassel';
  if (trimmed.length === 10 && trimmed.startsWith('500')) return 'wassel';
  if (upper.length === 21 && upper.startsWith('JDD')) return 'dhl';

  // Bare-length fallbacks — only reached once no prefixed format matched.
  if (trimmed.length === 10) return 'dhl';
  if (trimmed.length === 12) return 'fedex';

  // Unrecognized format — keep existing behavior: try Wassel, offer the carrier picker on miss.
  return 'wassel';
};

const parsePassportJson = (
  record: any,
  lang: Language
): { shipmentInfo: ShipmentInfo; trackingResult: TrackingEvent[]; requiredAction: ActionRequired | null } => {
  const shipmentInfo: ShipmentInfo = {
    category: lang === 'en' ? 'Jordan Passport' : 'جواز السفر الأردني',
    serviceType: lang === 'en' ? 'Passport Delivery' : 'توصيل جواز السفر',
    origin: lang === 'en' ? 'Jordan Civil Affairs' : 'الأحوال المدنية الأردنية',
    destination: lang === 'en'
      ? (record.location_en || record.location || '—')
      : (record.location_ar || record.location || '—'),
    weight: '—',
  };

  const logs: any[] = Array.isArray(record.events) ? record.events : [];

  const trackingResult: TrackingEvent[] = [...logs]
    .sort((a: any, b: any) => {
      const ta = new Date(a?.delevn_date || '').getTime();
      const tb = new Date(b?.delevn_date || '').getTime();
      if (!isNaN(tb) && !isNaN(ta)) return tb - ta;
      return 0;
    })
    .map((log: any) => {
    const status = lang === 'en'
      ? (log.status_front_en || log.status || '')
      : (log.status_front_ar || log.status_front_en || log.status || '');
    const location = lang === 'en'
      ? (log.location_en || log.location || '—')
      : (log.location_ar || log.location_en || log.location || '—');
    const dateStr = log.date || '—';
    const timeStr = log.time || '—';
    const phase = lang === 'en'
      ? (log.phase_description_en || '')
      : (log.phase_description_ar || log.phase_description_en || '');
    const description = [status, phase].filter(Boolean).join(' - ').trim();
    return {
      status: status.trim() || '—',
      location,
      timestamp: timeStr ? `${dateStr} - ${timeStr}` : dateStr,
      description: description || status.trim() || '—',
      icon: getEventIcon(status),
      relativeTime: log.days || '—',
      day: log.day || '—',
      date: dateStr,
      time: timeStr,
    } as TrackingEvent;
  });

  if (trackingResult.length === 0) {
    const currentStatus = lang === 'en'
      ? (record.status_front_en || record.status_desc || record.status || '—')
      : (record.status_front_ar || record.status_desc || record.status || '—');
    if (currentStatus !== '—') {
      trackingResult.push({
        status: currentStatus,
        location: lang === 'en'
          ? (record.location_en || record.location || shipmentInfo.destination)
          : (record.location_ar || record.location || shipmentInfo.destination),
        timestamp: record.created_date || '—',
        description: currentStatus,
        icon: getEventIcon(currentStatus),
        relativeTime: '—',
        day: '—',
        date: record.created_date || '—',
        time: '—',
      });
    }
  }

  return { shipmentInfo, trackingResult, requiredAction: null };
};

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

const formatAddress = (address: any): string => {
  if (!address) return '—';
  return [address.addressLocality, address.countryCode].filter(Boolean).join(', ') || '—';
};

// DHL's postalAddress fields (cityName/postalCode) come back empty in practice —
// serviceArea's description (e.g. "Ramallah-West Bank-IL") is the field that's
// actually populated, so it's used as the primary source for a readable place name.
const formatDhlPlace = (details: any): string => {
  const areaDesc = details?.serviceArea?.[0]?.description;
  if (areaDesc) return areaDesc;
  return formatAddress({ addressLocality: details?.postalAddress?.cityName, countryCode: details?.postalAddress?.countryCode });
};

const parseDhlJson = (shipment: any, lang: Language) => {
  const shipmentInfo: ShipmentInfo = {
    category: lang === 'en' ? 'International' : 'دولي',
    serviceType: shipment.description ? `DHL — ${shipment.description}` : 'DHL',
    origin: formatDhlPlace(shipment.shipperDetails),
    destination: formatDhlPlace(shipment.receiverDetails),
    weight: shipment.totalWeight
      ? `${shipment.totalWeight} ${shipment.unitOfMeasurements === 'metric' ? 'kg' : 'lb'}`
      : '—',
  };

  const events: any[] = Array.isArray(shipment.events) ? shipment.events : [];

  const trackingResult: TrackingEvent[] = [...events]
    .sort((a: any, b: any) => {
      const ta = new Date(`${a?.date}T${a?.time}`).getTime();
      const tb = new Date(`${b?.date}T${b?.time}`).getTime();
      if (!isNaN(tb) && !isNaN(ta)) return tb - ta;
      return 0;
    })
    .map((event) => {
      const status = event.description || '—';
      const location = event.serviceArea?.[0]?.description || '—';
      const dt = event.date && event.time ? new Date(`${event.date}T${event.time}`) : null;
      return {
        status,
        location,
        timestamp: `${event.date || '—'} - ${event.time || '—'}`,
        description: status,
        icon: getEventIcon(status),
        relativeTime: '—',
        day: dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long' }) : '—',
        date: event.date || '—',
        time: event.time || '—',
      } as TrackingEvent;
    });

  return { shipmentInfo, trackingResult, requiredAction: null as ActionRequired | null };
};

const formatFedexAddress = (address: any): string =>
  address ? [address.city, address.stateOrProvinceCode, address.countryCode].filter(Boolean).join(', ') : '—';

const parseFedexJson = (trackResult: any, lang: Language) => {
  const shipperAddr = trackResult.shipperInformation?.address;
  const recipientAddr = trackResult.recipientInformation?.address;

  // Weight lives under packageDetails.weightAndDimensions.weight (or shipmentDetails.weight) —
  // an array of {value, unit} entries, one per unit system. Prefer the KG entry.
  const weightEntries: any[] = trackResult.packageDetails?.weightAndDimensions?.weight
    ?? trackResult.shipmentDetails?.weight
    ?? [];
  const weightEntry = weightEntries.find((w) => w.unit === 'KG') ?? weightEntries[0];

  const shipmentInfo: ShipmentInfo = {
    category: lang === 'en' ? 'International' : 'دولي',
    serviceType: trackResult.serviceDetail?.description || 'FedEx',
    origin: formatFedexAddress(shipperAddr),
    destination: formatFedexAddress(recipientAddr),
    weight: weightEntry?.value ? `${weightEntry.value} ${weightEntry.unit || ''}`.trim() : '—',
  };

  const scanEvents: any[] = Array.isArray(trackResult.scanEvents) ? trackResult.scanEvents : [];

  const trackingResult: TrackingEvent[] = scanEvents.map((event) => {
    const status = event.eventDescription || event.derivedStatus || '—';
    const loc = event.scanLocation;
    const location = loc ? [loc.city, loc.stateOrProvinceCode, loc.countryCode].filter(Boolean).join(', ') : '—';
    const dt = event.date ? new Date(event.date) : null;
    const dateStr = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '—';
    const timeStr = dt && !isNaN(dt.getTime()) ? dt.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
    return {
      status,
      location,
      timestamp: `${dateStr} - ${timeStr}`,
      description: status,
      icon: getEventIcon(status),
      relativeTime: '—',
      day: dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long' }) : '—',
      date: dateStr,
      time: timeStr,
    } as TrackingEvent;
  });

  return { shipmentInfo, trackingResult, requiredAction: null as ActionRequired | null };
};

export const Tracking: React.FC<TrackingProps> = ({ lang, initialTrackingId, isPopup = false, mode = 'standard', onContact }) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId || '');
  const placeholderWords = useMemo(() => ({
    ar: ['واصل', 'فيديكس', 'دي اتش ال', 'جواز السفر', 'المعاملة الجمركية', 'الشحن البحري', 'الكونتينر'],
    en: ['Wassel', 'FedEx', 'DHL', 'Passport', 'Customs Transaction', 'Sea Freight', 'Container'],
  }), []);
  const placeholderTypewriter = useTypewriter(lang === 'en' ? placeholderWords.en : placeholderWords.ar);
  const placeholderTypedWord = placeholderTypewriter.text;
  const TrackButtonIcon = TRACK_ICONS[placeholderTypewriter.index % TRACK_ICONS.length];
  const [trackingResult, setTrackingResult] = useState<TrackingEvent[] | null>(null);
  const [shipmentInfo, setShipmentInfo] = useState<ShipmentInfo | null>(null);
  const [requiredAction, setRequiredAction] = useState<ActionRequired | null>(null);
  const [notificationName, setNotificationName] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notificationPhone, setNotificationPhone] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notified, setNotified] = useState(false);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [notifyChecking, setNotifyChecking] = useState(false);
  const [notifyAlreadyRegistered, setNotifyAlreadyRegistered] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
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
      getUpdates: lang === 'en' ? 'Notify me when it arrives' : 'أبلغني عند وصولها',
      updatesTitle: lang === 'en' ? 'Get Shipment Updates' : 'احصل على تحديثات الشحنة',
      eventsTitle: lang === 'en' ? 'Tracking History' : 'سجل التتبع',
      eventsWhen: lang === 'en' ? 'When' : 'الوقت النسبي',
      eventsDay: lang === 'en' ? 'Day' : 'اليوم',
      eventsDate: lang === 'en' ? 'Date' : 'التاريخ',
      eventsTime: lang === 'en' ? 'Time' : 'الوقت',
      eventsStatus: lang === 'en' ? 'Status' : 'الحالة',
      eventsLocation: lang === 'en' ? 'Location' : 'الموقع',
      updatesDesc: lang === 'en'
        ? 'We could not find this tracking number yet. Leave your details and we will check again and email you as soon as it appears.'
        : 'لم نتمكن من العثور على رقم التتبع هذا بعد. اترك بياناتك وسنعيد التحقق ونرسل لك بريداً إلكترونياً بمجرد ظهورها.',
      notifyNameLabel: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
      notifyPhoneLabel: lang === 'en' ? 'Mobile Number' : 'رقم الجوال',
      emailLabel: lang === 'en' ? 'Email Address' : 'البريد الإلكتروني',
      emailPlaceholder: lang === 'en' ? 'you@example.com' : 'you@example.com',
      notifyMe: lang === 'en' ? 'Notify Me' : 'أبلغني',
      notifyError: lang === 'en' ? 'Could not save your request. Please try again.' : 'تعذر حفظ طلبك. يرجى المحاولة مرة أخرى.',
      notifyDuplicate: lang === 'en'
        ? 'This shipment is already registered — we\'ll email and text you as soon as it appears.'
        : 'هذه الشحنة مسجَّلة لدينا بالفعل — سنرسل لك إشعاراً بالبريد والرسائل النصية بمجرد ظهورها.',
      submitting: lang === 'en' ? 'Saving...' : 'جاري الحفظ...',
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

  const executeTracking = async (id: string, carrierOverride?: Carrier) => {
    const trimmedId = id.trim();
    if (!trimmedId) return;

    setTrackingId(trimmedId);
    setIsLoading(true);
    setErrorMessage('');
    setTrackingResult(null);
    setShipmentInfo(null);
    setRequiredAction(null);
    setNotFound(false);
    setSelectedCarrier(null);
    setAwbRecord(null);
    setPendingBillDetails(undefined);

    const carrier: Carrier = carrierOverride ?? detectCarrier(trimmedId);

    try {
      if (carrier === 'passport') {
        const response = await fetch(JO_PASSPORT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_nos: [trimmedId.toUpperCase()] }),
        });

        if (!response.ok) {
          throw new Error(`Passport tracking request failed with status ${response.status}`);
        }

        const json = await response.json();

        const records: any[] = Array.isArray(json)
          ? json
          : (json.data || json.results || json.deliveries || []);

        if (records.length === 0) {
          setNotFound(true);
          return;
        }

        const parsed = parsePassportJson(records[0], lang);
        setAwbRecord(records[0]);
        setShipmentInfo(parsed.shipmentInfo);
        setTrackingResult(parsed.trackingResult);
        setRequiredAction(parsed.requiredAction);
      } else if (carrier === 'dhl') {
        const response = await fetch(`${DHL_API_URL}?trackingNumber=${encodeURIComponent(trimmedId)}`, {
          headers: { Accept: 'application/json' },
        });

        const json = await response.json();
        const shipment = json?.shipments?.[0];

        if (!response.ok || !shipment) {
          setNotFound(true);
          return;
        }

        const parsed = parseDhlJson(shipment, lang);
        setAwbRecord(shipment);
        setShipmentInfo(parsed.shipmentInfo);
        setTrackingResult(parsed.trackingResult);
        setRequiredAction(parsed.requiredAction);
      } else if (carrier === 'fedex') {
        const response = await fetch(FEDEX_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber: trimmedId }),
        });

        const json = await response.json();
        const trackResult = json?.output?.completeTrackResults?.[0]?.trackResults?.[0];

        if (!response.ok || !trackResult || trackResult.error) {
          setNotFound(true);
          return;
        }

        const parsed = parseFedexJson(trackResult, lang);
        setAwbRecord(trackResult);
        setShipmentInfo(parsed.shipmentInfo);
        setTrackingResult(parsed.trackingResult);
        setRequiredAction(parsed.requiredAction);
      } else {
        const response = await fetch(`${WASSEL_API_URL}?Awbs=${encodeURIComponent(trimmedId)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
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
      }
    } catch (error) {
      console.error('Tracking lookup failed:', error);
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

  const handleOpenNotifyModal = async () => {
    setNotifyError('');
    setNotifyAlreadyRegistered(false);
    setNotifyChecking(true);
    try {
      const response = await fetch(`${WAITING_SHIPMENTS_CHECK_URL}?trackingNumber=${encodeURIComponent(trackingId)}`);
      const data = await response.json().catch(() => ({}));
      setNotifyAlreadyRegistered(!!data?.registered);
    } catch {
      // If the check itself fails, fall back to showing the normal form —
      // the register call will still catch a real duplicate on submit.
      setNotifyAlreadyRegistered(false);
    } finally {
      setNotifyChecking(false);
      setShowNotifyModal(true);
    }
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyError('');
    setNotifySubmitting(true);
    try {
      const response = await fetch(WAITING_SHIPMENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: trackingId,
          customerName: notificationName,
          customerEmail: notificationEmail,
          customerPhone: notificationPhone,
          carrier: selectedCarrier ?? undefined,
          language: lang,
        }),
      });

      if (response.status === 409) {
        setNotifyError(t.notifyDuplicate);
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setNotified(true);
      setTimeout(() => {
        setShowNotifyModal(false);
        setNotified(false);
        setNotificationName('');
        setNotificationEmail('');
        setNotificationPhone('');
      }, 2000);
    } catch {
      setNotifyError(t.notifyError);
    } finally {
      setNotifySubmitting(false);
    }
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
                    placeholder={`${t.placeholder} ${placeholderTypedWord}|`}
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                />
                <div className="absolute inset-y-2 right-2 rtl:right-auto rtl:left-2 flex items-center">
                    <button type="submit" disabled={isLoading || !trackingId.trim()} className="h-full rounded-lg bg-wassel-blue px-6 sm:px-10 text-white font-bold text-lg hover:bg-wassel-darkBlue transition-colors flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
                        <TrackButtonIcon className="w-6 h-6" />
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
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">{t.noData}</h3>
              <p className="text-gray-500 mb-6 text-center text-sm">{t.noDataDesc}</p>

              {/* Carrier selector */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                  {lang === 'en' ? 'What type of shipment are you tracking?' : 'ما نوع الشحنة التي تريد تتبعها؟'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { key: 'wassel',   labelAr: 'واصل',       labelEn: 'Wassel'   },
                    { key: 'dhl',      labelAr: 'DHL',         labelEn: 'DHL'      },
                    { key: 'fedex',    labelAr: 'FedEx',       labelEn: 'FedEx'    },
                    { key: 'passport', labelAr: 'جواز سفر أردني', labelEn: 'Jordan Passport' },
                  ] as const).map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => { setSelectedCarrier(c.key); executeTracking(trackingId, c.key); }}
                      className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition-colors ${
                        selectedCarrier === c.key
                          ? 'border-wassel-blue bg-wassel-blue text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-wassel-blue hover:bg-blue-50'
                      }`}
                    >
                      {lang === 'en' ? c.labelEn : c.labelAr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-carrier format hint */}
              {selectedCarrier && (
                <div className="mb-6 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
                  {selectedCarrier === 'passport' && (
                    <div>
                      <p className="font-bold mb-1">
                        {lang === 'en' ? 'Jordan Passport format:' : 'صيغة رقم جواز السفر الأردني:'}
                      </p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>{lang === 'en' ? 'Starts with QW or RA' : 'يبدأ بـ QW أو RA'}</li>
                        <li>{lang === 'en' ? 'Followed by 9 digits' : 'يليه 9 أرقام'}</li>
                        <li>{lang === 'en' ? 'Ends with JO' : 'ينتهي بـ JO'}</li>
                        <li dir="ltr" className="font-mono">{lang === 'en' ? 'Example: QW123456789JO' : 'مثال: QW123456789JO'}</li>
                      </ul>
                    </div>
                  )}
                  {selectedCarrier === 'dhl' && (
                    <div>
                      <p className="font-bold mb-1">
                        {lang === 'en' ? 'DHL tracking number format:' : 'صيغة رقم تتبع DHL:'}
                      </p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>{lang === 'en' ? 'Starts with JDD, 21 characters total' : 'يبدأ بـ JDD، ويتكون من 21 خانة'}</li>
                        <li dir="ltr" className="font-mono">{lang === 'en' ? 'Example: JDD012345678901234567' : 'مثال: JDD012345678901234567'}</li>
                        <li>{lang === 'en' ? 'Or 10 digits with no prefix' : 'أو 10 أرقام بدون بادئة'}</li>
                        <li dir="ltr" className="font-mono">{lang === 'en' ? 'Example: 1234567890' : 'مثال: 1234567890'}</li>
                      </ul>
                    </div>
                  )}
                  {selectedCarrier === 'fedex' && (
                    <div>
                      <p className="font-bold mb-1">
                        {lang === 'en' ? 'FedEx tracking number format:' : 'صيغة رقم تتبع FedEx:'}
                      </p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>{lang === 'en' ? 'Usually 12, 15, or 20–22 digits' : 'عادةً 12 أو 15 أو 20-22 رقماً'}</li>
                        <li dir="ltr" className="font-mono">{lang === 'en' ? 'Example: 449044304137821' : 'مثال: 449044304137821'}</li>
                      </ul>
                    </div>
                  )}
                  {selectedCarrier === 'wassel' && (
                    <div>
                      <p className="font-bold mb-1">
                        {lang === 'en' ? 'Wassel tracking number format:' : 'صيغة رقم تتبع واصل:'}
                      </p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>{lang === 'en' ? 'Starts with 88, 12 characters total' : 'يبدأ بـ 88، ويتكون من 12 خانة'}</li>
                        <li dir="ltr" className="font-mono">{lang === 'en' ? 'Example: 885551234567' : 'مثال: 885551234567'}</li>
                        <li>{lang === 'en' ? 'Or starts with 500, 10 characters total' : 'أو يبدأ بـ 500، ويتكون من 10 خانات'}</li>
                        <li dir="ltr" className="font-mono">{lang === 'en' ? 'Example: 5001234567' : 'مثال: 5001234567'}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={handleRefreshTracking} className="inline-flex items-center rounded-lg bg-wassel-blue px-4 py-2 text-sm font-semibold text-white hover:bg-wassel-darkBlue transition-colors">
                  <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t.retryBtn}
                </button>
                <button
                  onClick={handleOpenNotifyModal}
                  disabled={notifyChecking}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {notifyChecking ? (
                    <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  )}
                  {t.getUpdates}
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
                    {notifyAlreadyRegistered ? (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{t.notifyDuplicate}</p>
                        <div className="mt-5 sm:mt-4">
                          <button
                            type="button"
                            onClick={() => setShowNotifyModal(false)}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-wassel-blue text-base font-medium text-white hover:bg-wassel-darkBlue focus:outline-none sm:w-auto sm:text-sm transition-colors"
                          >
                            {t.close}
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {t.updatesDesc}
                      </p>
                      <form onSubmit={handleNotifySubmit} className="mt-4">
                          <label htmlFor="notify-name" className="block text-sm font-medium text-gray-700">{t.notifyNameLabel}</label>
                          <input
                            type="text"
                            required
                            id="notify-name"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow sm:text-sm"
                            value={notificationName}
                            onChange={(e) => setNotificationName(e.target.value)}
                          />
                          <label htmlFor="notify-phone" className="block text-sm font-medium text-gray-700 mt-4">{t.notifyPhoneLabel}</label>
                          <input
                            type="tel"
                            required
                            id="notify-phone"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow sm:text-sm"
                            value={notificationPhone}
                            onChange={(e) => setNotificationPhone(e.target.value)}
                          />
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mt-4">{t.emailLabel}</label>
                          <input
                            type="email"
                            required
                            id="email"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow sm:text-sm"
                            placeholder={t.emailPlaceholder}
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                          />
                          {notifyError && (
                            <p className="mt-2 text-sm text-red-600">{notifyError}</p>
                          )}
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2 sm:gap-0">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-wassel-blue text-base font-medium text-white hover:bg-wassel-darkBlue focus:outline-none sm:ml-3 rtl:sm:mr-3 rtl:sm:ml-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                                disabled={notified || notifySubmitting}
                            >
                                {notified ? t.subscribed : notifySubmitting ? t.submitting : t.notifyMe}
                            </button>
                            <button type="button" onClick={() => setShowNotifyModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors">
                                {t.cancel}
                            </button>
                        </div>
                      </form>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Contact Us About This Modal — rendered via portal to escape overflow-y-auto parent */}
      {showContactForm && createPortal(
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
      , document.body)}
    </div>
  );
};