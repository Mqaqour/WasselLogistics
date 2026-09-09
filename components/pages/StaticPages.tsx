import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2, Globe, AlertTriangle, MessageCircle } from 'lucide-react';

interface PageProps {
  lang: Language;
}

type ContactFormData = {
    topic: string;
    name: string;
    mobile: string;
    email: string;
    message: string;
    trackingNumber: string;
    passportNumber: string;
};

// Jordan passport delivery numbers: 13 chars, start with RA/QW, end with JO — same rule used in Tracking.tsx.
const isValidJordanPassportNumber = (id: string): boolean => {
    const upper = id.trim().toUpperCase();
    return upper.length === 13 && (upper.startsWith('RA') || upper.startsWith('QW')) && upper.endsWith('JO');
};

// Unifies the alef/ya/ta-marbuta variants and drops tatweel/diacritics so status
// strings from the passport API match regardless of how they were typed upstream.
const normalizeArabic = (s: string): string =>
    s
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[ـً-ٰٟ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

// Passport processing stages during which we show the "no need to contact us"
// notice instead of expecting the customer to ask. Matched as substrings against
// the Arabic status, after normalization.
const PASSPORT_IN_PROGRESS_KEYWORDS = [
    'ادخال الطلب',
    'قيد النقل',
    'قيد التجديد',
    'تم الوصول',
    'تم التسليم',
    'قيد التسليم',
].map(normalizeArabic);

// Expected working-days turnaround by passport-number prefix: RA = 30, QW = 14.
const passportProcessingDays = (passportNumber: string): number | null => {
    const upper = passportNumber.trim().toUpperCase();
    if (upper.startsWith('RA')) return 30;
    if (upper.startsWith('QW')) return 14;
    return null;
};

const passportStatusInProgress = (statusAr: string): boolean => {
    const normalized = normalizeArabic(statusAr);
    return PASSPORT_IN_PROGRESS_KEYWORDS.some((kw) => normalized.includes(kw));
};

const JO_PASSPORT_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/jopassport/track`;
const WASSEL_TRACK_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/wassel/track`;
const DHL_TRACK_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/dhl/track`;
const FEDEX_TRACK_API_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/fedex/track`;
const WAITING_SHIPMENTS_REGISTER_URL = `${import.meta.env.VITE_CHAT_BACKEND_URL || ''}/api/waiting-shipments/register`;

type LastShipmentStatus = { status: string; date: string };

// Same carrier heuristics as components/shipping/Tracking.tsx, trimmed to the
// three carriers the contact form can look up (passport has its own field).
const detectTrackingCarrier = (id: string): 'wassel' | 'dhl' | 'fedex' => {
    const trimmed = id.trim();
    const upper = trimmed.toUpperCase();
    if (trimmed.length === 12 && trimmed.startsWith('88')) return 'wassel';
    if (trimmed.length === 10 && trimmed.startsWith('500')) return 'wassel';
    if (upper.length === 21 && upper.startsWith('JDD')) return 'dhl';
    if (trimmed.length === 10) return 'dhl';
    if (trimmed.length === 12) return 'fedex';
    return 'wassel';
};

// Best-effort lookup of just the most recent tracking event (status + date) for
// the contact form. Returns null whenever nothing usable comes back.
const fetchLastShipmentStatus = async (
    rawId: string,
    lang: Language,
    signal: AbortSignal,
): Promise<LastShipmentStatus | null> => {
    const id = rawId.trim();
    const carrier = detectTrackingCarrier(id);

    if (carrier === 'dhl') {
        const res = await fetch(`${DHL_TRACK_API_URL}?trackingNumber=${encodeURIComponent(id)}`, {
            headers: { Accept: 'application/json' }, signal,
        });
        const json = await res.json().catch(() => null);
        const shipment = json?.shipments?.[0];
        if (!res.ok || !shipment) return null;
        const events: any[] = Array.isArray(shipment.events) ? shipment.events : [];
        const latest = [...events].sort((a, b) => {
            const tb = new Date(`${b?.date}T${b?.time}`).getTime();
            const ta = new Date(`${a?.date}T${a?.time}`).getTime();
            return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
        })[0];
        if (!latest) return null;
        return {
            status: latest.description || '—',
            date: [latest.date, latest.time].filter(Boolean).join(' ') || '—',
        };
    }

    if (carrier === 'fedex') {
        const res = await fetch(FEDEX_TRACK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackingNumber: id }),
            signal,
        });
        const json = await res.json().catch(() => null);
        const trackResult = json?.output?.completeTrackResults?.[0]?.trackResults?.[0];
        if (!res.ok || !trackResult || trackResult.error) return null;
        const scanEvents: any[] = Array.isArray(trackResult.scanEvents) ? trackResult.scanEvents : [];
        const latest = scanEvents[0]; // FedEx returns scan events most-recent first
        if (!latest) return null;
        const dt = latest.date ? new Date(latest.date) : null;
        return {
            status: latest.eventDescription || latest.derivedStatus || '—',
            date: dt && !isNaN(dt.getTime())
                ? dt.toLocaleString('en-GB')
                : (latest.date || '—'),
        };
    }

    const res = await fetch(`${WASSEL_TRACK_API_URL}?Awbs=${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' }, signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.isSuccess || !Array.isArray(json.data) || json.data.length === 0) return null;
    const record = json.data[0];
    const logs: any[] = Array.isArray(record.destinationLog) ? record.destinationLog : [];
    const last = record.lastDestinationLog || logs[logs.length - 1] || null;
    const status = (lang === 'en'
        ? (record.status || last?.portalDescription || '')
        : (record.statusAr || last?.portalDescriptionAr || record.status || last?.portalDescription || '')
    ).trim();
    if (!status) return null;
    const date = last ? [last.statusDate, last.statusTime].filter(Boolean).join(' ') : '';
    return { status, date: date || '—' };
};

export const Contact: React.FC<PageProps> = ({ lang }) => {
    const [formData, setFormData] = useState<ContactFormData>({
        topic: '',
        name: '',
        mobile: '',
        email: '',
        message: '',
        trackingNumber: '',
        passportNumber: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [passportStatus, setPassportStatus] = useState<{ status: string; statusAr: string; date: string; creationDate: string } | null>(null);
    const [passportStatusLoading, setPassportStatusLoading] = useState(false);
    const [shipmentStatus, setShipmentStatus] = useState<LastShipmentStatus | null>(null);
    const [shipmentStatusLoading, setShipmentStatusLoading] = useState(false);
    const [notifyStatus, setNotifyStatus] = useState<'idle' | 'submitting' | 'done' | 'already'>('idle');
    const [notifyError, setNotifyError] = useState('');
    // Flips true the moment the customer clicks "notify me", even before any
    // validation — from then on the message-sending path stays hidden.
    const [notifyClicked, setNotifyClicked] = useState(false);

    const topics = [
        { id: 'general', en: 'General Inquiry', ar: 'استفسار عام', field: 'none' },
        { id: 'shipment', en: 'Shipment Inquiry', ar: 'استفسار عن شحنة', field: 'tracking' },
        { id: 'passport', en: 'Jordan Passport Services', ar: 'خدمات الجوازات الأردنية', field: 'passport' },
        { id: 'complaint', en: 'Complaint', ar: 'شكوى', field: 'tracking' },
        { id: 'claiming', en: 'Claiming', ar: 'مطالبة', field: 'tracking' }
    ];

    const currentTopic = topics.find(t => t.id === formData.topic);

    // Show the full passport processing notice (instead of the one-line status
    // badge) when the number is RA/QW and the transaction is still in progress.
    const passportNoticeDays = passportProcessingDays(formData.passportNumber);
    const showPassportNotice = !!passportStatus
        && passportNoticeDays !== null
        && passportStatusInProgress(passportStatus.statusAr);

    // Once the customer opts into "notify me when it arrives", the message-sending
    // path is hidden — they're taking the waiting-list route instead.
    const notifyRequested = notifyClicked || notifyStatus !== 'idle';

    // Once the passport number matches the valid format, look up its last known status.
    useEffect(() => {
        if (currentTopic?.field !== 'passport' || !isValidJordanPassportNumber(formData.passportNumber)) {
            setPassportStatus(null);
            setPassportStatusLoading(false);
            return;
        }

        let cancelled = false;
        const passportNumber = formData.passportNumber.trim().toUpperCase();
        setPassportStatusLoading(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(JO_PASSPORT_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ delivery_nos: [passportNumber] }),
                });
                if (!res.ok) throw new Error(`Passport tracking request failed (${res.status})`);

                const json = await res.json();
                const records: any[] = Array.isArray(json) ? json : (json.data || json.results || json.deliveries || []);
                const record = records[0];
                if (!record) {
                    if (!cancelled) setPassportStatus(null);
                    return;
                }

                const logs: any[] = Array.isArray(record.events) ? record.events : [];
                const latest = [...logs].sort((a: any, b: any) => {
                    const ta = new Date(a?.delevn_date || '').getTime();
                    const tb = new Date(b?.delevn_date || '').getTime();
                    if (!isNaN(tb) && !isNaN(ta)) return tb - ta;
                    return 0;
                })[0];

                const status = latest
                    ? (lang === 'en'
                        ? (latest.status_front_en || latest.status || '')
                        : (latest.status_front_ar || latest.status_front_en || latest.status || ''))
                    : (lang === 'en'
                        ? (record.status_front_en || record.status_desc || record.status || '')
                        : (record.status_front_ar || record.status_desc || record.status || ''));
                // Arabic status kept regardless of UI language so the processing-notice
                // keyword match below doesn't depend on the site being in Arabic.
                const statusAr = latest
                    ? (latest.status_front_ar || latest.status || '')
                    : (record.status_front_ar || record.status_desc || record.status || '');
                const date = latest ? (latest.date || '') : (record.created_date || '');

                if (!cancelled) setPassportStatus(status
                    ? { status, statusAr, date: date || '—', creationDate: record.created_date || '' }
                    : null);
            } catch {
                if (!cancelled) setPassportStatus(null);
            } finally {
                if (!cancelled) setPassportStatusLoading(false);
            }
        }, 500);

        return () => { cancelled = true; clearTimeout(timer); };
    }, [formData.passportNumber, currentTopic?.field, lang]);

    // Once a tracking number is entered on a shipment-related topic, look up its
    // last known status + date and show it inline (best effort — hidden on any miss).
    useEffect(() => {
        const trackingNumber = formData.trackingNumber.trim();
        if (currentTopic?.field !== 'tracking' || trackingNumber.length < 6) {
            setShipmentStatus(null);
            setShipmentStatusLoading(false);
            return;
        }

        const controller = new AbortController();
        setShipmentStatusLoading(true);
        setNotifyStatus('idle');
        setNotifyError('');
        setNotifyClicked(false);

        const timer = setTimeout(async () => {
            try {
                const result = await fetchLastShipmentStatus(trackingNumber, lang, controller.signal);
                if (!controller.signal.aborted) setShipmentStatus(result);
            } catch {
                if (!controller.signal.aborted) setShipmentStatus(null);
            } finally {
                if (!controller.signal.aborted) setShipmentStatusLoading(false);
            }
        }, 500);

        return () => { controller.abort(); clearTimeout(timer); };
    }, [formData.trackingNumber, currentTopic?.field, lang]);

    // When the tracking lookup turns up nothing, the customer can register to be
    // emailed once the shipment shows up (same waiting-list endpoint as the Tracking page).
    const handleNotifyWhenArrives = async () => {
        setNotifyClicked(true);

        const trackingNumber = formData.trackingNumber.trim();
        const customerName = formData.name.trim();
        const customerEmail = formData.email.trim();
        const customerPhone = formData.mobile.trim();

        if (!customerName || !customerEmail || !customerPhone) {
            setNotifyError(t.notifyNeedContact);
            return;
        }

        setNotifyError('');
        setNotifyStatus('submitting');
        try {
            const res = await fetch(WAITING_SHIPMENTS_REGISTER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trackingNumber,
                    customerName,
                    customerEmail,
                    customerPhone,
                    carrier: detectTrackingCarrier(trackingNumber),
                    language: lang,
                }),
            });
            if (res.status === 409) {
                setNotifyStatus('already');
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setNotifyStatus('done');
        } catch {
            setNotifyStatus('idle');
            setNotifyError(t.notifyFailed);
        }
    };

    const updateField = (key: keyof ContactFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setSubmitError('');
    };

    const sendContactMessage = async () => {
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    language: lang,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as { error?: string }).error ?? 'Failed to send');
            }
            setIsSent(true);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) {
            return;
        }

        if (currentTopic?.field === 'passport' && !isValidJordanPassportNumber(formData.passportNumber)) {
            setSubmitError(t.passportFormatError);
            return;
        }

        await sendContactMessage();
    };

    const t = {
        title: lang === 'en' ? 'Contact Us' : 'تواصل معنا',
        subtitle: lang === 'en' ? 'We are here to help. Reach out to us.' : 'نحن هنا للمساعدة. تواصل معنا.',
        phone: lang === 'en' ? 'Call Us' : 'اتصل بنا',
        email: lang === 'en' ? 'Email Us' : 'راسلنا',
        
        // Form Strings
        formTitle: lang === 'en' ? 'Send us a message' : 'أرسل لنا رسالة',
        formSubtitle: lang === 'en' ? 'Please fill the form below and we will get back to you shortly.' : 'يرجى تعبئة النموذج أدناه وسنرد عليك قريباً.',
        labelTopic: lang === 'en' ? 'Topic' : 'الموضوع',
        labelName: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
        labelMobile: lang === 'en' ? 'Mobile Number' : 'رقم الموبايل',
        labelEmail: lang === 'en' ? 'Email Address (Optional)' : 'البريد الإلكتروني (اختياري)',
        labelMessage: lang === 'en' ? 'Your Message' : 'رسالتك',
        labelTracking: lang === 'en' ? 'Tracking Number' : 'رقم التتبع',
        labelPassport: lang === 'en' ? 'Passport Number' : 'رقم تتبع الجواز',
        passportFormatError: lang === 'en'
            ? 'Passport number must be 13 characters, start with RA or QW, and end with JO.'
            : 'رقم تتبع الجواز يجب أن يتكون من 13 رمزاً، ويبدأ بـ RA أو QW، وينتهي بـ JO.',
        checkingPassportStatus: lang === 'en' ? 'Checking status...' : 'جاري التحقق من الحالة...',
        lastPassportStatus: lang === 'en' ? 'Last status' : 'آخر حالة',
        passportNoticeHeading: lang === 'en' ? 'About your passport transaction' : 'معلومات عن معاملة جواز السفر',
        passportNoticeCurrentStatus: lang === 'en' ? 'Current status:' : 'الحالة الحالية:',
        passportNoticeLastUpdate: lang === 'en' ? 'Last update:' : 'تاريخ آخر تحديث:',
        passportNoticeBody: (days: number, creationDate: string) => lang === 'en'
            ? `Issuing or renewing a passport currently takes around ${days} working days in general from the date the application was submitted${creationDate ? ` on ${creationDate}` : ''}. Processing time may vary from one application to another depending on the procedures and approvals required by the relevant official authorities.`
            : `تستغرق معاملات إصدار أو تجديد جواز السفر خلال الفترة الحالية نحو ${days} يوم عمل بشكل عام من تاريخ تقديم الطلب${creationDate ? ` في ${creationDate}` : ''}، وقد تختلف مدة الإنجاز من معاملة إلى أخرى حسب الإجراءات والموافقات المطلوبة لدى الجهات الرسمية المختصة.`,
        passportNoticeAuto: lang === 'en'
            ? 'The status shown above is the latest update available on your application, and it will be updated automatically once there are any developments.'
            : 'الحالة الظاهرة أعلاه هي آخر تحديث متوفر على معاملتكم، وسيتم تحديثها تلقائيًا عند ورود أي مستجدات.',
        passportNoticeNoContact: lang === 'en'
            ? 'There is no need to contact Wassel to follow up on the application as long as its status has not changed. You will be notified when there is an update or when the passport is ready for collection.'
            : 'لا يتطلب الأمر التواصل مع واصل لمتابعة المعاملة ما دامت حالتها لم تتغير، وسيتم إشعاركم عند وجود تحديث أو عند جاهزية جواز السفر للاستلام.',
        checkingShipmentStatus: lang === 'en' ? 'Checking shipment status...' : 'جاري التحقق من حالة الشحنة...',
        lastShipmentStatus: lang === 'en' ? 'Last shipment status' : 'آخر حالة للشحنة',
        noShipmentStatus: lang === 'en'
            ? "We couldn't find any status for this shipment yet."
            : 'لم نتمكن من إيجاد أي حالة لهذه الشحنة حتى الآن.',
        notifyWhenArrives: lang === 'en' ? 'Notify me when the shipment arrives' : 'أبلغني عند وصول الشحنة',
        notifyNeedContact: lang === 'en'
            ? 'Please fill in your name, mobile number and email first.'
            : 'يرجى تعبئة الاسم ورقم الجوال والبريد الإلكتروني أولاً.',
        notifyRegistered: lang === 'en'
            ? "Done — we'll email you as soon as your shipment appears."
            : 'تم — سنرسل لك بريداً إلكترونياً فور توفر معلومات عن شحنتك.',
        notifyAlready: lang === 'en'
            ? 'This tracking number is already registered for notifications.'
            : 'رقم التتبع هذا مسجّل مسبقاً لتلقّي الإشعارات.',
        notifyFailed: lang === 'en'
            ? 'Could not register right now. Please try again.'
            : 'تعذّر التسجيل حالياً. يرجى المحاولة مرة أخرى.',
        selectTopic: lang === 'en' ? 'Select a topic...' : 'اختر موضوعاً...',
        btnSubmit: lang === 'en' ? 'Send Message' : 'إرسال الرسالة',
        sending: lang === 'en' ? 'Sending...' : 'جاري الإرسال...',
        successTitle: lang === 'en' ? 'Message Sent Successfully!' : 'تم إرسال الرسالة بنجاح!',
        successDesc: lang === 'en' ? 'Thank you for contacting us. Our team will review your message and respond as soon as possible.' : 'شكراً لتواصلك معنا. سيقوم فريقنا بمراجعة رسالتك والرد في أقرب وقت ممكن.',
        sendNew: lang === 'en' ? 'Send Another Message' : 'إرسال رسالة أخرى',
        
        // Branches
        branchesTitle: lang === 'en' ? 'Our Branches & Hours' : 'فروعنا وساعات العمل',
        office: lang === 'en' ? 'Office' : 'المكتب',
        hours: lang === 'en' ? 'Working Hours' : 'ساعات العمل'
    };

    const branchGroups = [
        {
            category: lang === 'en' ? 'Our Offices' : 'فروعنا',
            schedule: lang === 'en' ? 'Sun - Thu: 8:00 AM - 4:30 PM' : 'الأحد - الخميس: 8:00 ص - 4:30 م',
            items: [
                { 
                    name: lang === 'en' ? 'Ramallah' : 'رام الله', 
                    address: lang === 'en' ? 'Al Masyoun, Edward Said St., opposite Legislative Council roundabout, Al-Qalaa Building' : 'الماصيون، شارع إدوارد سعيد، مقابل دوار المجلس التشريعي، عمارة القلعة',
                    mapUrl: 'https://maps.app.goo.gl/Myne187jJwd7GeVn8'
                },
                { 
                    name: lang === 'en' ? 'Nablus' : 'نابلس', 
                    address: lang === 'en' ? 'Rafidya, opposite Family Park, Ammasha Building' : 'رفيديا، مقابل منتزه العائلات، عمارة عماشة',
                    mapUrl: 'https://maps.app.goo.gl/1n24mDWVM7W4eLVz9'
                },
                { 
                    name: lang === 'en' ? 'Hebron' : 'الخليل', 
                    address: lang === 'en' ? 'Ibn Rushd roundabout, near Commercial Chamber, Juthoor Building' : 'دوار ابن رشد، بالقرب من الغرفة التجارية، عمارة جذور',
                    mapUrl: 'https://maps.app.goo.gl/aasJrQgu9wp5B7CG6'
                },
                { 
                    name: lang === 'en' ? 'Jerusalem' : 'القدس', 
                    address: lang === 'en' ? "Shu'fat, Shu'fat St. 45, Jerusalem Towers" : 'شعفاط، شارع شعفاط 45، أبراج القدس',
                    mapUrl: 'https://maps.app.goo.gl/2dX7reYf8DBL6A3n9'
                },
            ]
        },
        {
            category: lang === 'en' ? 'Jordanian Services Center' : 'مركز الخدمات الأردنية',
            schedule: lang === 'en'
                ? 'Sun - Thu: 9:00 AM - 5:30 PM\nSat: 9:00 AM - 3:00 PM'
                : 'الأحد - الخميس: 9:00 ص - 5:30 م\nالسبت: 9:00 ص - 3:00 م',
            items: [
                {
                    name: lang === 'en' ? 'Rawabi Q Center' : 'كيوسنتر روابي',
                    address: lang === 'en' ? 'Rawabi, Q Center, opposite Arab Bank' : 'روابي، كيوسنتر، مقابل البنك العربي',
                    mapUrl: 'https://maps.app.goo.gl/C9BAZX6Z2UfKsbkJ7'
                }
            ]
        },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* HERO Section: Title and Subtitle with Dark Background for Transparent Header */}
            <div className="bg-wassel-blue pt-36 md:pt-48 pb-20 px-4 sm:px-6 lg:px-8 text-center text-white">
                <div className="max-w-4xl mx-auto animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">{t.title}</h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">{t.subtitle}</p>
                </div>
            </div>

            {/* Split Content Container (Overlapping Hero) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row animate-pop delay-100">
                    
                    {/* Left Panel: Contact Info & Branches (Darker Blue) */}
                    <div className="w-full lg:w-1/3 bg-wassel-darkBlue text-white p-8 lg:p-12 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
                        
                        <div className="relative z-10 space-y-10">
                            {/* Quick Contacts */}
                            <div className="space-y-6 pb-8 border-b border-white/10">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <Phone className="w-5 h-5 text-wassel-yellow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base mb-1">{t.phone}</h3>
                                        <p dir="ltr" className="text-blue-100 text-sm">1700 974 444</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <Mail className="w-5 h-5 text-wassel-yellow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base mb-1">{t.email}</h3>
                                        <p className="text-blue-100 text-sm">info@wassel.ps</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <MessageCircle className="w-5 h-5 text-wassel-yellow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base mb-1">{lang === 'en' ? 'WhatsApp' : 'واتساب'}</h3>
                                        <a
                                            href="https://wa.me/972594775000"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            dir="ltr"
                                            className="text-blue-100 text-sm hover:text-wassel-yellow transition-colors"
                                        >
                                            +972 59 477 5000
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Branches List */}
                            <div>
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-wassel-yellow" />
                                    {t.branchesTitle}
                                </h3>
                                
                                <div className="space-y-8">
                                    {branchGroups.map((group, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <div className="border-b border-white/10 pb-2">
                                                <h4 className="font-bold text-lg text-wassel-yellow">{group.category}</h4>
                                                {group.schedule && (
                                                    <p className="text-xs text-blue-300 mt-1 whitespace-pre-line">{group.schedule}</p>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {group.items.map((location, i) => {
                                                    const inner = (
                                                        <>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h5 className="font-bold text-sm text-white">{location.name}</h5>
                                                                {'mapUrl' in location && (
                                                                    <span className="text-[10px] bg-wassel-yellow/20 text-wassel-yellow px-2 py-0.5 rounded whitespace-nowrap">
                                                                        {lang === 'en' ? 'View Map' : 'عرض الخريطة'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-start gap-1.5 text-xs text-blue-200">
                                                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                                                <span className="opacity-80">{location.address}</span>
                                                            </div>
                                                        </>
                                                    );
                                                    return 'mapUrl' in location ? (
                                                        <a key={i} href={(location as { mapUrl: string }).mapUrl} target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                                            {inner}
                                                        </a>
                                                    ) : (
                                                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors">
                                                            {inner}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Contact Form */}
                    <div className="flex-1 p-8 lg:p-12 bg-white">
                        {!isSent ? (
                            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{t.formTitle}</h2>
                                <p className="text-gray-500 mb-8">{t.formSubtitle}</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Topic Selection */}
                                    <div>
                                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">{t.labelTopic}</label>
                                        <select 
                                            id="topic"
                                            required 
                                            value={formData.topic}
                                            onChange={(e) => updateField('topic', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                        >
                                            <option value="" disabled>{t.selectTopic}</option>
                                            {topics.map((topic) => (
                                                <option key={topic.id} value={topic.id}>{lang === 'en' ? topic.en : topic.ar}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Conditional Fields based on Topic */}
                                    {currentTopic?.field === 'tracking' && (
                                        <div className="animate-enter">
                                            <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">{t.labelTracking}</label>
                                            <input
                                                type="text"
                                                id="trackingNumber"
                                                required
                                                value={formData.trackingNumber}
                                                onChange={(e) => updateField('trackingNumber', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border bg-blue-50"
                                            />
                                            {shipmentStatusLoading && (
                                                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {t.checkingShipmentStatus}
                                                </p>
                                            )}
                                            {!shipmentStatusLoading && shipmentStatus && (
                                                <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-gray-700">
                                                    <span className="font-semibold">{t.lastShipmentStatus}: </span>
                                                    {shipmentStatus.status}
                                                    {shipmentStatus.date && shipmentStatus.date !== '—' && (
                                                        <span className="text-gray-500"> — {shipmentStatus.date}</span>
                                                    )}
                                                </div>
                                            )}

                                            {!shipmentStatusLoading && !shipmentStatus && formData.trackingNumber.trim().length >= 6 && (
                                                <div className="mt-3">
                                                    <p className="text-xs text-gray-500 mb-2">{t.noShipmentStatus}</p>

                                                    {(notifyStatus === 'done' || notifyStatus === 'already') ? (
                                                        <p className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                                                            <CheckCircle className="w-4 h-4 shrink-0" />
                                                            {notifyStatus === 'done' ? t.notifyRegistered : t.notifyAlready}
                                                        </p>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleNotifyWhenArrives}
                                                            disabled={notifyStatus === 'submitting'}
                                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-wassel-blue bg-wassel-blue px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-wassel-darkBlue transition-colors disabled:opacity-70"
                                                        >
                                                            {notifyStatus === 'submitting' ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" />{t.sending}</>
                                                            ) : (
                                                                <><span aria-hidden="true">🔔</span>{t.notifyWhenArrives}</>
                                                            )}
                                                        </button>
                                                    )}

                                                    {notifyError && (
                                                        <p className="mt-1.5 text-xs text-red-600">{notifyError}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {currentTopic?.field === 'passport' && (
                                        <div className="animate-enter">
                                            <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-1">{t.labelPassport}</label>
                                            <input
                                                type="text"
                                                id="passportNumber"
                                                required
                                                maxLength={13}
                                                dir="ltr"
                                                value={formData.passportNumber}
                                                onChange={(e) => updateField('passportNumber', e.target.value.toUpperCase())}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border bg-blue-50"
                                            />
                                            {formData.passportNumber.trim().length > 0 && !isValidJordanPassportNumber(formData.passportNumber) && (
                                                <p className="mt-1 text-xs text-red-600">{t.passportFormatError}</p>
                                            )}
                                            {passportStatusLoading && (
                                                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {t.checkingPassportStatus}
                                                </p>
                                            )}
                                            {!passportStatusLoading && passportStatus && !showPassportNotice && (
                                                <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-gray-700">
                                                    <span className="font-semibold">{t.lastPassportStatus}: </span>
                                                    {passportStatus.status}
                                                    {passportStatus.date && passportStatus.date !== '—' && (
                                                        <span className="text-gray-500"> — {passportStatus.date}</span>
                                                    )}
                                                </div>
                                            )}
                                            {!passportStatusLoading && passportStatus && showPassportNotice && (
                                                <div className="mt-3 overflow-hidden rounded-xl border-2 border-wassel-blue/25 bg-blue-50 shadow-md border-s-[6px] border-s-wassel-yellow animate-enter">
                                                    <div className="flex items-center gap-2 bg-wassel-blue px-4 py-2.5 text-white">
                                                        <Clock className="h-4 w-4 shrink-0 text-wassel-yellow" />
                                                        <span className="text-sm font-bold">{t.passportNoticeHeading}</span>
                                                    </div>
                                                    <div className="space-y-3 px-4 py-3.5 text-[13px] leading-relaxed text-gray-800">
                                                        <div className="rounded-lg bg-white px-3 py-2.5 shadow-sm">
                                                            <div>
                                                                <span className="font-semibold text-wassel-blue">{t.passportNoticeCurrentStatus} </span>
                                                                <span className="font-semibold">{passportStatus.status}</span>
                                                            </div>
                                                            {passportStatus.date && passportStatus.date !== '—' && (
                                                                <div className="mt-1 text-gray-600">
                                                                    <span className="font-semibold text-wassel-blue">{t.passportNoticeLastUpdate} </span>
                                                                    {passportStatus.date}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p>{t.passportNoticeBody(passportNoticeDays as number, passportStatus.creationDate)}</p>
                                                        <p>{t.passportNoticeAuto}</p>
                                                        <p className="font-semibold text-wassel-blue">{t.passportNoticeNoContact}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t.labelName}</label>
                                        <input 
                                            type="text" 
                                            id="name"
                                            required 
                                            value={formData.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">{t.labelMobile}</label>
                                            <input 
                                                type="tel" 
                                                id="mobile"
                                                required 
                                                value={formData.mobile}
                                                onChange={(e) => updateField('mobile', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t.labelEmail}</label>
                                            <input 
                                                type="email" 
                                                id="email"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                            />
                                        </div>
                                    </div>

                                    {!notifyRequested && (
                                        <div>
                                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">{t.labelMessage}</label>
                                            <textarea
                                                id="message"
                                                rows={5}
                                                required
                                                value={formData.message}
                                                onChange={(e) => updateField('message', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-wassel-blue focus:border-wassel-blue p-3 border"
                                            ></textarea>
                                        </div>
                                    )}

                                    {!notifyRequested && (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-wassel-blue text-white font-bold py-4 rounded-xl shadow-lg hover:bg-wassel-darkBlue transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    {t.sending}
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 rtl:rotate-180" />
                                                    {t.btnSubmit}
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {!notifyRequested && submitError && (
                                        <p className="text-red-600 text-sm mt-2 text-center">{submitError}</p>
                                    )}
                                </form>
                            </div>
                        ) : (
                            <div className="text-center py-12 animate-pop h-full flex flex-col items-center justify-center">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{t.successTitle}</h2>
                                <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                                    {t.successDesc}
                                </p>
                                <button 
                                    onClick={() => { setIsSent(false); setSubmitError(''); setFormData({topic: '', name: '', mobile: '', email: '', message: '', trackingNumber: '', passportNumber: ''}); }}
                                    className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    {t.sendNew}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};