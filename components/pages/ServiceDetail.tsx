import React, { useState } from 'react';
import { 
    Truck, 
    Plane, 
    FileCheck, 
    Globe, 
    ShoppingBag, 
    CreditCard, 
    FileText, 
    CheckCircle2, 
    ArrowRight,
    Package,
    Phone,
    Mail,
    FileSignature,
    Archive,
    Warehouse,
    Server,
    Layers,
    Box,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    ClipboardCheck,
    Hammer,
    Tag,
    Container,
    Search,
    Loader2,
    AlertTriangle,
    BadgeCheck,
    Clock,
    Smartphone
} from 'lucide-react';
import { Language } from '../../types';
import { FAQ_DATA } from '../../data/faqs';

interface ServiceDetailProps {
  serviceId: string;
  lang: Language;
  onAction: (actionType: string, params?: any) => void;
}

// ─── Review Card Checker (Jordan Passport) ─────────────────────────────────

const JORDAN_PASSPORT_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname.includes('wassel.ps')
    ? 'https://www.cspd.gov.jo'
    : '/api/jordan-passport';

type ReviewCardStatus = {
  status: string;
  details?: string;
  isReady?: boolean;
};

const ReviewCardChecker: React.FC<{ lang: Language }> = ({ lang }) => {
  const [reviewCard, setReviewCard] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReviewCardStatus | null>(null);
  const [error, setError] = useState('');

  const t = {
    sectionTitle: lang === 'en' ? 'Check Review Card Status' : 'استعلام عن بطاقة المراجعة',
    sectionDesc:
      lang === 'en'
        ? 'Enter your review card number and registered mobile number to check the current status of your Jordan passport application.'
        : 'أدخل رقم بطاقة المراجعة ورقم الجوال المسجل للاستعلام عن حالة طلب جواز سفرك الأردني.',
    cardLabel: lang === 'en' ? 'Review Card Number' : 'رقم بطاقة المراجعة',
    cardPlaceholder: lang === 'en' ? 'e.g. 123456789' : 'مثال: 123456789',
    mobileLabel: lang === 'en' ? 'Mobile Number' : 'رقم الجوال',
    mobilePlaceholder: lang === 'en' ? 'e.g. 07XXXXXXXX' : 'مثال: 07XXXXXXXX',
    checkBtn: lang === 'en' ? 'Check Status' : 'استعلام',
    checking: lang === 'en' ? 'Checking…' : 'جاري الاستعلام…',
    errorGeneric:
      lang === 'en'
        ? 'Unable to fetch status right now. Please try again.'
        : 'تعذر الاستعلام في الوقت الحالي. يرجى المحاولة مرة أخرى.',
    notFound:
      lang === 'en'
        ? 'No record found for the provided details. Please verify your review card number and mobile number.'
        : 'لم يتم العثور على سجل بالمعلومات المدخلة. يرجى التحقق من رقم بطاقة المراجعة ورقم الجوال.',
    statusLabel: lang === 'en' ? 'Application Status' : 'حالة الطلب',
    resetBtn: lang === 'en' ? 'New Inquiry' : 'استعلام جديد',
    requiredField: lang === 'en' ? 'This field is required.' : 'هذا الحقل مطلوب.',
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCard = reviewCard.trim();
    const trimmedMobile = mobile.trim();
    if (!trimmedCard || !trimmedMobile) return;

    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await fetch(`${JORDAN_PASSPORT_BASE_URL}/passport/checkPassportStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'text/html,application/xhtml+xml',
        },
        body: new URLSearchParams({
          reviewCardNumber: trimmedCard,
          mobileNumber: trimmedMobile,
        }).toString(),
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Parse the response — adjust selectors to match the actual portal response
      const statusEl =
        doc.querySelector('.passport-status') ??
        doc.querySelector('#passportStatus') ??
        doc.querySelector('.status-value') ??
        doc.querySelector('h3, h4, .result-status');

      const detailsEl =
        doc.querySelector('.passport-details') ??
        doc.querySelector('.status-details') ??
        doc.querySelector('.result-details');

      const bodyText = doc.body?.textContent?.toLowerCase() ?? '';
      const isNotFound =
        bodyText.includes('not found') ||
        bodyText.includes('لم يتم العثور') ||
        bodyText.includes('غير موجود') ||
        bodyText.includes('invalid') ||
        (!statusEl && bodyText.length < 200);

      if (isNotFound) {
        setError(t.notFound);
      } else {
        const statusText = statusEl?.textContent?.trim() ?? (lang === 'en' ? 'Under Review' : 'قيد المراجعة');
        const detailsText = detailsEl?.textContent?.trim();
        const isReady =
          statusText.toLowerCase().includes('ready') ||
          statusText.includes('جاهز') ||
          statusText.includes('تم') ||
          statusText.toLowerCase().includes('complete');

        setResult({ status: statusText, details: detailsText, isReady });
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-20 pt-12 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-wassel-yellow text-wassel-blue flex items-center justify-center shrink-0">
          <Search className="w-5 h-5" />
        </div>
        <h3 className="text-2xl font-bold text-wassel-blue">{t.sectionTitle}</h3>
      </div>
      <p className="text-gray-500 mb-8 rtl:text-right">{t.sectionDesc}</p>

      {!result ? (
        <form
          onSubmit={handleCheck}
          className="bg-gray-50 rounded-2xl border border-gray-100 p-6 md:p-8 max-w-lg"
        >
          <div className="space-y-5">
            {/* Review Card Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 rtl:text-right">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-wassel-blue" />
                  {t.cardLabel}
                </span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={reviewCard}
                onChange={(e) => setReviewCard(e.target.value)}
                placeholder={t.cardPlaceholder}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wassel-yellow text-base"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 rtl:text-right">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-wassel-blue" />
                  {t.mobileLabel}
                </span>
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={t.mobilePlaceholder}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-wassel-yellow text-base"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded-xl p-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !reviewCard.trim() || !mobile.trim()}
              className="w-full flex items-center justify-center gap-2 bg-wassel-blue text-white font-bold py-3.5 px-6 rounded-xl hover:bg-wassel-darkBlue transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />{t.checking}</>
              ) : (
                <><Search className="w-5 h-5" />{t.checkBtn}</>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="max-w-lg">
          <div
            className={`rounded-2xl border p-6 md:p-8 ${
              result.isReady
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {result.isReady ? (
                <BadgeCheck className="w-8 h-8 text-green-600 shrink-0" />
              ) : (
                <Clock className="w-8 h-8 text-blue-600 shrink-0" />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t.statusLabel}
                </p>
                <p
                  className={`text-xl font-bold ${
                    result.isReady ? 'text-green-700' : 'text-blue-700'
                  }`}
                >
                  {result.status}
                </p>
              </div>
            </div>
            {result.details && (
              <p className="text-sm text-gray-600 border-t border-gray-200 pt-4 mt-4 rtl:text-right">
                {result.details}
              </p>
            )}
          </div>

          <button
            onClick={() => { setResult(null); setError(''); setReviewCard(''); setMobile(''); }}
            className="mt-4 text-sm font-semibold text-wassel-blue hover:underline flex items-center gap-1"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            {t.resetBtn}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Customs Clearance Request Form ──────────────────────────────────────────

const CustomsClearanceRequestForm: React.FC<{ lang: Language }> = ({ lang }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    awb: '',
    shipmentType: 'import',
    carrier: '',
    goodsDesc: '',
    declaredValue: '',
    originCountry: '',
    pieces: '',
    weight: '',
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const t = {
    sectionTitle: lang === 'en' ? 'Submit a Clearance Request' : 'تقديم طلب تخليص جمركي',
    sectionDesc: lang === 'en'
      ? 'Fill in the details below and our customs team will get in touch with you to complete the clearance process.'
      : 'املأ التفاصيل أدناه وسيتواصل معك فريق التخليص الجمركي لدينا لاستكمال الإجراءات.',
    name: lang === 'en' ? 'Full Name' : 'الاسم الكامل',
    namePh: lang === 'en' ? 'e.g. Ahmad Khalil' : 'مثال: أحمد خليل',
    phone: lang === 'en' ? 'Phone Number' : 'رقم الهاتف',
    phonePh: lang === 'en' ? 'e.g. 059XXXXXXX' : 'مثال: 059XXXXXXX',
    awb: lang === 'en' ? 'Shipment / AWB Number' : 'رقم الشحنة / AWB',
    awbPh: lang === 'en' ? 'e.g. 1234567890' : 'مثال: 1234567890',
    shipmentType: lang === 'en' ? 'Shipment Direction' : 'اتجاه الشحنة',
    import: lang === 'en' ? 'Import (Incoming)' : 'استيراد (وارد)',
    export: lang === 'en' ? 'Export (Outgoing)' : 'تصدير (صادر)',
    carrier: lang === 'en' ? 'Carrier / Shipping Company' : 'شركة الشحن / الناقل',
    carrierPh: lang === 'en' ? 'e.g. FedEx, DHL, UPS' : 'مثال: فيديكس، DHL، UPS',
    goodsDesc: lang === 'en' ? 'Description of Goods' : 'وصف البضاعة',
    goodsDescPh: lang === 'en' ? 'e.g. Electronics, clothing, books…' : 'مثال: إلكترونيات، ملابس، كتب…',
    declaredValue: lang === 'en' ? 'Declared Value (USD)' : 'القيمة المصرح بها (USD)',
    declaredValuePh: lang === 'en' ? 'e.g. 500' : 'مثال: 500',
    originCountry: lang === 'en' ? 'Country of Origin / Destination' : 'بلد المنشأ / الوجهة',
    originCountryPh: lang === 'en' ? 'e.g. China, USA' : 'مثال: الصين، أمريكا',
    pieces: lang === 'en' ? 'Number of Pieces' : 'عدد القطع',
    piecePh: '1',
    weight: lang === 'en' ? 'Total Weight (kg)' : 'الوزن الإجمالي (كجم)',
    weightPh: 'e.g. 10',
    documents: lang === 'en' ? 'Upload Documents (Invoice, Packing List…)' : 'رفع المستندات (فاتورة، قائمة تعبئة…)',
    submit: lang === 'en' ? 'Submit Request' : 'إرسال الطلب',
    submitting: lang === 'en' ? 'Submitting…' : 'جاري الإرسال…',
    successTitle: lang === 'en' ? 'Request Submitted!' : 'تم تقديم الطلب!',
    successDesc: lang === 'en'
      ? 'Our customs clearance team will contact you within 1 business day.'
      : 'سيتواصل معك فريق التخليص الجمركي خلال يوم عمل واحد.',
    newRequest: lang === 'en' ? 'Submit Another Request' : 'تقديم طلب جديد',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSent(true);
  };

  const inputCls = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow';
  const labelCls = 'block text-sm font-medium text-gray-700';

  if (isSent) {
    return (
      <div className="mt-20 pt-12 border-t border-gray-100">
        <div className="flex flex-col items-center text-center py-12 bg-green-50 rounded-2xl border border-green-100">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">{t.successTitle}</h3>
          <p className="text-gray-600 max-w-md mb-6">{t.successDesc}</p>
          <button
            onClick={() => { setIsSent(false); setForm({ name:'',phone:'',awb:'',shipmentType:'import',carrier:'',goodsDesc:'',declaredValue:'',originCountry:'',pieces:'',weight:'' }); setFiles(null); }}
            className="px-6 py-2 bg-wassel-blue text-white rounded-lg font-semibold hover:bg-wassel-darkBlue transition-colors"
          >
            {t.newRequest}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 pt-12 border-t border-gray-100">
      <h3 className="text-2xl font-bold text-wassel-blue mb-2 flex items-center gap-2">
        <ClipboardCheck className="w-6 h-6 text-wassel-yellow" />
        {t.sectionTitle}
      </h3>
      <p className="text-gray-500 mb-8">{t.sectionDesc}</p>

      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 md:p-8 space-y-6">
        {/* Row 1: Name + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t.name}</label>
            <input required name="name" value={form.name} onChange={handleChange} placeholder={t.namePh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.phone}</label>
            <input required name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder={t.phonePh} className={inputCls} />
          </div>
        </div>

        {/* Row 2: AWB + Carrier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t.awb}</label>
            <input name="awb" value={form.awb} onChange={handleChange} placeholder={t.awbPh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.carrier}</label>
            <input name="carrier" value={form.carrier} onChange={handleChange} placeholder={t.carrierPh} className={inputCls} />
          </div>
        </div>

        {/* Row 3: Shipment direction + Origin country */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t.shipmentType}</label>
            <select name="shipmentType" value={form.shipmentType} onChange={handleChange} aria-label={t.shipmentType} className={inputCls}>
              <option value="import">{t.import}</option>
              <option value="export">{t.export}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.originCountry}</label>
            <input name="originCountry" value={form.originCountry} onChange={handleChange} placeholder={t.originCountryPh} className={inputCls} />
          </div>
        </div>

        {/* Row 4: Pieces + Weight + Declared Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelCls}>{t.pieces}</label>
            <input name="pieces" type="number" min="1" value={form.pieces} onChange={handleChange} placeholder={t.piecePh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.weight}</label>
            <input name="weight" type="number" min="0.1" step="0.1" value={form.weight} onChange={handleChange} placeholder={t.weightPh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.declaredValue}</label>
            <input name="declaredValue" type="number" min="0" value={form.declaredValue} onChange={handleChange} placeholder={t.declaredValuePh} className={inputCls} />
          </div>
        </div>

        {/* Goods Description */}
        <div>
          <label className={labelCls}>{t.goodsDesc}</label>
          <textarea required name="goodsDesc" rows={3} value={form.goodsDesc} onChange={handleChange} placeholder={t.goodsDescPh} className={inputCls + ' resize-none'} />
        </div>

        {/* Document Upload */}
        <div>
          <label className={labelCls}>{t.documents}</label>
          <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:border-wassel-yellow transition-colors bg-white">
            <label className="flex flex-col items-center cursor-pointer w-full">
              <FileText className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                {files && files.length > 0
                  ? Array.from(files).map(f => f.name).join(', ')
                  : (lang === 'en' ? 'Click to upload PDF, JPG, PNG (max 10 MB each)' : 'اضغط لرفع PDF، JPG، PNG (حتى 10 ميغابايت لكل ملف)')}
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => setFiles(e.target.files)}
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-wassel-blue text-white rounded-xl font-bold text-lg hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
            {isSubmitting ? t.submitting : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Freight Shipping Request Form ───────────────────────────────────────────

const FreightShippingRequestForm: React.FC<{ lang: Language }> = ({ lang }) => {
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    mode: 'ocean',       // ocean | land | air
    cargoType: 'lcl',    // fcl | lcl (ocean only)
    origin: '',
    destination: '',
    readyDate: '',
    goodsDesc: '',
    declaredValue: '',
    weight: '',
    pieces: '',
    special: '',
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const t = {
    sectionTitle: lang === 'en' ? 'Submit a Shipping Request' : 'تقديم طلب شحن',
    sectionDesc: lang === 'en'
      ? 'Tell us about your cargo and our freight team will prepare the best routing and pricing for you.'
      : 'أخبرنا عن بضاعتك وسيقوم فريق الشحن بإعداد أفضل مسار وسعر مناسب لك.',
    name: lang === 'en' ? 'Contact Name' : 'اسم جهة الاتصال',
    namePh: lang === 'en' ? 'e.g. Ahmad Khalil' : 'مثال: أحمد خليل',
    company: lang === 'en' ? 'Company Name' : 'اسم الشركة',
    companyPh: lang === 'en' ? 'e.g. Al-Nour Trading Co.' : 'مثال: شركة النور للتجارة',
    phone: lang === 'en' ? 'Phone Number' : 'رقم الهاتف',
    phonePh: lang === 'en' ? 'e.g. 059XXXXXXX' : 'مثال: 059XXXXXXX',
    email: lang === 'en' ? 'Email Address' : 'البريد الإلكتروني',
    emailPh: lang === 'en' ? 'e.g. info@company.com' : 'مثال: info@company.com',
    mode: lang === 'en' ? 'Shipping Mode' : 'وسيلة الشحن',
    ocean: lang === 'en' ? 'Ocean Freight' : 'الشحن البحري',
    land: lang === 'en' ? 'Land Freight' : 'الشحن البري',
    air: lang === 'en' ? 'Air Freight' : 'الشحن الجوي',
    cargoType: lang === 'en' ? 'Container Type' : 'نوع الحاوية',
    fcl: lang === 'en' ? 'FCL – Full Container Load' : 'FCL – حاوية كاملة',
    lcl: lang === 'en' ? 'LCL – Less than Container Load' : 'LCL – حاوية جزئية',
    origin: lang === 'en' ? 'Origin (City / Country)' : 'المنشأ (مدينة / دولة)',
    originPh: lang === 'en' ? 'e.g. Shanghai, China' : 'مثال: شنغهاي، الصين',
    destination: lang === 'en' ? 'Destination (City / Country)' : 'الوجهة (مدينة / دولة)',
    destinationPh: lang === 'en' ? 'e.g. Jerusalem, Palestine' : 'مثال: القدس، فلسطين',
    readyDate: lang === 'en' ? 'Cargo Ready Date' : 'تاريخ جاهزية البضاعة',
    goodsDesc: lang === 'en' ? 'Description of Goods' : 'وصف البضاعة',
    goodsDescPh: lang === 'en' ? 'e.g. Electronics, machinery, textiles…' : 'مثال: إلكترونيات، آلات، منسوجات…',
    declaredValue: lang === 'en' ? 'Declared Value (USD)' : 'القيمة المصرح بها (USD)',
    declaredValuePh: lang === 'en' ? 'e.g. 50000' : 'مثال: 50000',
    weight: lang === 'en' ? 'Total Weight (kg)' : 'الوزن الإجمالي (كجم)',
    weightPh: lang === 'en' ? 'e.g. 2000' : 'مثال: 2000',
    pieces: lang === 'en' ? 'Number of Pieces / Pallets' : 'عدد القطع / البالتات',
    piecesPh: lang === 'en' ? 'e.g. 20' : 'مثال: 20',
    special: lang === 'en' ? 'Special Requirements (optional)' : 'متطلبات خاصة (اختياري)',
    specialPh: lang === 'en' ? 'e.g. refrigerated, hazardous, oversized…' : 'مثال: مبرد، خطر، أحجام كبيرة…',
    documents: lang === 'en' ? 'Attach Documents (Packing list, commercial invoice…)' : 'إرفاق مستندات (قائمة تعبئة، فاتورة تجارية…)',
    submit: lang === 'en' ? 'Submit Shipping Request' : 'إرسال طلب الشحن',
    submitting: lang === 'en' ? 'Submitting…' : 'جاري الإرسال…',
    successTitle: lang === 'en' ? 'Request Submitted!' : 'تم تقديم الطلب!',
    successDesc: lang === 'en'
      ? 'Our freight team will review your request and respond within 1 business day.'
      : 'سيراجع فريق الشحن طلبك ويرد عليك خلال يوم عمل واحد.',
    newRequest: lang === 'en' ? 'Submit Another Request' : 'تقديم طلب جديد',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSent(true);
  };

  const emptyForm = { name:'', company:'', phone:'', email:'', mode:'ocean', cargoType:'lcl', origin:'', destination:'', readyDate:'', goodsDesc:'', declaredValue:'', weight:'', pieces:'', special:'' };

  const inputCls = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-corp-secondary focus:border-corp-secondary';
  const labelCls = 'block text-sm font-medium text-gray-700';

  if (isSent) {
    return (
      <div className="mt-20 pt-12 border-t border-gray-100">
        <div className="flex flex-col items-center text-center py-12 bg-green-50 rounded-2xl border border-green-100">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">{t.successTitle}</h3>
          <p className="text-gray-600 max-w-md mb-6">{t.successDesc}</p>
          <button
            onClick={() => { setIsSent(false); setForm(emptyForm); setFiles(null); }}
            className="px-6 py-2 bg-corp-primary text-corp-secondary rounded-lg font-semibold hover:bg-corp-primary/90 transition-colors"
          >
            {t.newRequest}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 pt-12 border-t border-gray-100">
      <h3 className="text-2xl font-bold text-corp-primary mb-2 flex items-center gap-2">
        <Truck className="w-6 h-6 text-corp-secondary" />
        {t.sectionTitle}
      </h3>
      <p className="text-gray-500 mb-8">{t.sectionDesc}</p>

      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 md:p-8 space-y-6">

        {/* Row 1: Name + Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t.name}</label>
            <input required name="name" value={form.name} onChange={handleChange} placeholder={t.namePh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.company}</label>
            <input name="company" value={form.company} onChange={handleChange} placeholder={t.companyPh} className={inputCls} />
          </div>
        </div>

        {/* Row 2: Phone + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t.phone}</label>
            <input required name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder={t.phonePh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.email}</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder={t.emailPh} className={inputCls} />
          </div>
        </div>

        {/* Row 3: Shipping Mode + Container Type (ocean only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t.mode}</label>
            <select name="mode" value={form.mode} onChange={handleChange} aria-label={t.mode} className={inputCls}>
              <option value="ocean">{t.ocean}</option>
              <option value="land">{t.land}</option>
              <option value="air">{t.air}</option>
            </select>
          </div>
          {form.mode === 'ocean' && (
            <div>
              <label className={labelCls}>{t.cargoType}</label>
              <select name="cargoType" value={form.cargoType} onChange={handleChange} aria-label={t.cargoType} className={inputCls}>
                <option value="lcl">{t.lcl}</option>
                <option value="fcl">{t.fcl}</option>
              </select>
            </div>
          )}
        </div>

        {/* Row 4: Origin + Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>{t.origin}</label>
            <input required name="origin" value={form.origin} onChange={handleChange} placeholder={t.originPh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.destination}</label>
            <input required name="destination" value={form.destination} onChange={handleChange} placeholder={t.destinationPh} className={inputCls} />
          </div>
        </div>

        {/* Row 5: Pieces + Weight + Value + Date */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className={labelCls}>{t.pieces}</label>
            <input name="pieces" type="number" min="1" value={form.pieces} onChange={handleChange} placeholder={t.piecesPh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.weight}</label>
            <input name="weight" type="number" min="0.1" step="0.1" value={form.weight} onChange={handleChange} placeholder={t.weightPh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.declaredValue}</label>
            <input name="declaredValue" type="number" min="0" value={form.declaredValue} onChange={handleChange} placeholder={t.declaredValuePh} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t.readyDate}</label>
            <input name="readyDate" type="date" value={form.readyDate} onChange={handleChange} aria-label={t.readyDate} className={inputCls} />
          </div>
        </div>

        {/* Goods Description */}
        <div>
          <label className={labelCls}>{t.goodsDesc}</label>
          <textarea required name="goodsDesc" rows={3} value={form.goodsDesc} onChange={handleChange} placeholder={t.goodsDescPh} className={inputCls + ' resize-none'} />
        </div>

        {/* Special requirements */}
        <div>
          <label className={labelCls}>{t.special}</label>
          <input name="special" value={form.special} onChange={handleChange} placeholder={t.specialPh} className={inputCls} />
        </div>

        {/* Document Upload */}
        <div>
          <label className={labelCls}>{t.documents}</label>
          <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 bg-white hover:border-corp-secondary transition-colors cursor-pointer">
            <label className="flex flex-col items-center cursor-pointer w-full">
              <FileText className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 text-center">
                {files && files.length > 0
                  ? Array.from(files).map(f => f.name).join(', ')
                  : (lang === 'en' ? 'Click to upload PDF, JPG, PNG (max 10 MB each)' : 'اضغط لرفع PDF، JPG، PNG (حتى 10 ميغابايت لكل ملف)')}
              </span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFiles(e.target.files)} />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-wassel-blue text-white rounded-xl font-bold text-lg hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
            {isSubmitting ? t.submitting : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ serviceId, lang, onAction }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Determine if the service is a corporate service based on ID convention
  const isCorporate = serviceId.startsWith('service-corp-');

  // Define theme classes based on service type
  const themeClasses = isCorporate ? {
      heroBg: 'bg-corp-primary', // #3D3D3D
      heroOverlay: 'from-corp-primary via-corp-primary/80',
      iconBox: 'bg-corp-secondary text-corp-primary', // Yellow bg, Dark text
      labelText: 'text-corp-secondary',
      headingText: 'text-corp-primary',
      primaryBtn: 'bg-corp-secondary text-corp-primary hover:bg-[#E6B800] shadow-lg',
      primaryBtnIcon: 'text-corp-primary',
      faqBg: 'bg-gray-50',
      faqQuestion: 'text-corp-primary',
      stepNumBg: 'bg-corp-secondary text-corp-primary',
      packingCard: 'bg-white border-gray-100 hover:shadow-lg'
  } : {
      heroBg: 'bg-wassel-blue',
      heroOverlay: 'from-wassel-blue via-wassel-blue/80',
      iconBox: 'bg-wassel-yellow text-wassel-blue',
      labelText: 'text-wassel-yellow',
      headingText: 'text-wassel-blue',
      primaryBtn: 'bg-wassel-blue text-white hover:bg-wassel-darkBlue shadow-lg',
      primaryBtnIcon: 'text-wassel-yellow',
      faqBg: 'bg-blue-50/30',
      faqQuestion: 'text-wassel-blue',
      stepNumBg: 'bg-wassel-blue text-wassel-yellow',
      packingCard: 'bg-white border-blue-50 hover:shadow-md'
  };

  const getContent = () => {
      switch(serviceId) {
          // --- INDIVIDUAL SERVICES ---
          case 'service-clearance':
              return {
                  title: lang === 'en' ? 'Customs Clearance' : 'التخليص الجمركي',
                  subtitle: lang === 'en' ? 'Seamless handling of customs procedures.' : 'إنجاز سلس للإجراءات الجمركية.',
                  desc: lang === 'en' 
                    ? 'Our expert team ensures your shipments comply with all regulations, minimizing delays and avoiding penalties. Track your file status or upload required documents directly.'
                    : 'يضمن فريق خبرائنا امتثال شحناتك لجميع اللوائح، مما يقلل من التأخير ويتجنب الغرامات. تتبع حالة ملفك أو ارفع المستندات المطلوبة مباشرة.',
                  icon: FileCheck,
                  heroImage: 'warehouse.png',
                  features: [
                      { title: lang === 'en' ? 'Document Handling' : 'معالجة المستندات', desc: lang === 'en' ? 'We manage all paperwork.' : 'ندير جميع الأوراق.' },
                      { title: lang === 'en' ? 'Duty Calculation' : 'حساب الرسوم', desc: lang === 'en' ? 'Accurate tax estimates.' : 'تقديرات ضريبية دقيقة.' },
                      { title: lang === 'en' ? 'Fast Release' : 'إفراج سريع', desc: lang === 'en' ? 'Minimize holding time.' : 'تقليل وقت الحجز.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Track File' : 'تتبع الملف', icon: Package, type: 'tracking-customs', primary: true },
                      { label: lang === 'en' ? 'Pay Fees' : 'دفع الرسوم', icon: CreditCard, type: 'pay' }
                  ]
              };
          case 'service-pick-pack':
              return {
                  title: lang === 'en' ? 'Pick & Pack' : 'التغليف والتجهيز',
                  subtitle: lang === 'en' ? 'Professional packing for safe transit.' : 'تغليف احترافي لنقل آمن.',
                  desc: lang === 'en'
                    ? 'Moving house or sending a fragile gift? We collect your items, professionally pack them using high-quality materials, and ship them to their destination.'
                    : 'هل تنتقل من منزل أو ترسل هدية قابلة للكسر؟ نقوم بجمع أغراضك، وتغليفها بشكل احترافي باستخدام مواد عالية الجودة، وشحنها إلى وجهتها.',
                  icon: Box,
                  heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Doorstep Collection' : 'استلام من الباب', desc: lang === 'en' ? 'We come to you.' : 'نأتي إليك.' },
                      { title: lang === 'en' ? 'Professional Packing' : 'تغليف احترافي', desc: lang === 'en' ? 'Expert techniques.' : 'تقنيات متخصصة.' },
                      { title: lang === 'en' ? 'Material Supply' : 'توفير المواد', desc: lang === 'en' ? 'Boxes, bubble wrap, etc.' : 'صناديق، فقاعات، إلخ.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Request Service' : 'طلب الخدمة', icon: Truck, type: 'pickup', primary: true }
                  ],
                  packingTypes: [
                      { name: { en: 'Standard Boxes', ar: 'صناديق قياسية' }, desc: { en: 'Various sizes for general items.', ar: 'أحجام مختلفة للعناصر العامة.' }, icon: Box },
                      { name: { en: 'Fragile Packing', ar: 'تغليف القابل للكسر' }, desc: { en: 'Bubble wrap & cushioning.', ar: 'فقاعات هوائية وتبطين.' }, icon: ClipboardCheck },
                      { name: { en: 'Wooden Crating', ar: 'صناديق خشبية' }, desc: { en: 'For art & heavy electronics.', ar: 'للفن والإلكترونيات الثقيلة.' }, icon: Hammer },
                  ],
                  howItWorks: [
                      { title: { en: 'We Collect', ar: 'نحن نستلم' }, desc: { en: 'Driver arrives at your location.', ar: 'يصل السائق إلى موقعك.' } },
                      { title: { en: 'We Pack', ar: 'نحن نغلف' }, desc: { en: 'Items packed securely on-site or at hub.', ar: 'تغليف آمن في الموقع أو المركز.' } },
                      { title: { en: 'We Label', ar: 'نحن نضع الملصقات' }, desc: { en: 'Shipping labels attached.', ar: 'إرفاق ملصقات الشحن.' } },
                      { title: { en: 'We Ship', ar: 'نحن نشحن' }, desc: { en: 'Dispatched to destination.', ar: 'يتم الإرسال إلى الوجهة.' } }
                  ]
              };
          case 'service-express':
              return {
                  title: lang === 'en' ? 'International Express' : 'الشحن الدولي السريع',
                  subtitle: lang === 'en' ? 'Connect with the world faster.' : 'تواصل مع العالم بشكل أسرع.',
                  desc: lang === 'en'
                    ? 'Through our strategic partnerships with global leaders like DHL and FedEx, we offer reliable express shipping to over 220 countries.'
                    : 'من خلال شراكاتنا الاستراتيجية مع رواد عالميين مثل DHL و FedEx، نقدم شحناً سريعاً موثوقاً لأكثر من 220 دولة.',
                  icon: Plane,
                  heroImage: 'airplane.png',
                  features: [
                      { title: lang === 'en' ? 'Global Network' : 'شبكة عالمية', desc: lang === 'en' ? 'Reach 220+ countries.' : 'الوصول لأكثر من 220 دولة.' },
                      { title: lang === 'en' ? 'Real-time Tracking' : 'تتبع فوري', desc: lang === 'en' ? 'Know where your package is.' : 'اعرف مكان طردك.' },
                      { title: lang === 'en' ? 'Express Delivery' : 'توصيل سريع', desc: lang === 'en' ? 'Urgent document handling.' : 'معالجة المستندات العاجلة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Get Quote' : 'احصل على عرض سعر', icon: Globe, type: 'rates-international', primary: true },
                      { label: lang === 'en' ? 'Track Shipment' : 'تتبع الشحنة', icon: Package, type: 'tracking' }
                  ]
              };
          case 'service-domestic':
              return {
                  title: lang === 'en' ? 'Domestic Shipping' : 'الشحن المحلي',
                  subtitle: lang === 'en' ? 'Reliable door-to-door delivery.' : 'توصيل موثوق من الباب للباب.',
                  desc: lang === 'en'
                    ? 'Covering the West Bank and Gaza with a fleet that ensures your packages arrive safely and on time. Cash on Delivery supported.'
                    : 'تغطية الضفة الغربية وقطاع غزة بأسطول يضمن وصول طرودك بأمان وفي الوقت المحدد. ندعم خدمة الدفع عند الاستلام.',
                  icon: Truck,
                  heroImage: 'truck.png',
                  features: [
                      { title: lang === 'en' ? 'Next Day Delivery' : 'توصيل اليوم التالي', desc: lang === 'en' ? 'Fast turnaround.' : 'سرعة في الإنجاز.' },
                      { title: lang === 'en' ? 'Cash on Delivery' : 'الدفع عند الاستلام', desc: lang === 'en' ? 'Secure payment collection.' : 'تحصيل آمن للدفعات.' },
                      { title: lang === 'en' ? 'Wide Coverage' : 'تغطية واسعة', desc: lang === 'en' ? 'All major cities covered.' : 'تغطية جميع المدن الرئيسية.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Request Pickup' : 'طلب استلام', icon: Truck, type: 'pickup', primary: true },
                      { label: lang === 'en' ? 'Calculate Rate' : 'حساب التكلفة', icon: Globe, type: 'rates-domestic' }
                  ]
              };
          case 'service-shop':
              return {
                  title: lang === 'en' ? 'Shop & Ship' : 'تسوق واستلم',
                  subtitle: lang === 'en' ? 'Shop globally, receive locally.' : 'تسوق عالمياً، واستلم محلياً.',
                  desc: lang === 'en'
                    ? 'Get your own shipping addresses in the USA, UK, and UAE. Shop from stores that don’t ship to Palestine, and we’ll bring it to your door.'
                    : 'احصل على عناوين شحن خاصة بك في أمريكا، بريطانيا، والإمارات. تسوق من متاجر لا تشحن لفلسطين، وسنقوم بتوصيلها لبابك.',
                  icon: ShoppingBag,
                  heroImage: 'https://images.unsplash.com/photo-1516937941348-c09645f31e88?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Global Addresses' : 'عناوين عالمية', desc: lang === 'en' ? 'USA, UK, UAE hubs.' : 'مستودعات في أمريكا، بريطانيا، والإمارات.' },
                      { title: lang === 'en' ? 'Consolidation' : 'تجميع الشحنات', desc: lang === 'en' ? 'Save on shipping costs.' : 'وفر في تكاليف الشحن.' },
                      { title: lang === 'en' ? 'Easy Management' : 'إدارة سهلة', desc: lang === 'en' ? 'Manage via dashboard.' : 'إدارة عبر لوحة التحكم.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Sign Up Now' : 'سجل الآن', icon: ShoppingBag, type: 'login', primary: true }
                  ]
              };
          case 'service-idp':
              return {
                  title: lang === 'en' ? 'International Driving Permit' : 'رخصة القيادة الدولية',
                  subtitle: lang === 'en' ? 'Drive anywhere with confidence.' : 'قد سيارتك في أي مكان بثقة.',
                  desc: lang === 'en'
                    ? 'Planning to drive abroad? Get your certified International Driving Permit quickly and easily through Wassel.'
                    : 'تخطط للقيادة في الخارج؟ احصل على رخصة القيادة الدولية المعتمدة بسرعة وسهولة عبر واصل.',
                  icon: CreditCard,
                  heroImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Accepted Globally' : 'مقبولة عالمياً', desc: lang === 'en' ? 'Valid in 150+ countries.' : 'سارية في أكثر من 150 دولة.' },
                      { title: lang === 'en' ? 'Quick Processing' : 'إجراءات سريعة', desc: lang === 'en' ? 'Get it in days.' : 'احصل عليها خلال أيام.' },
                      { title: lang === 'en' ? 'Multiple Years' : 'سنوات متعددة', desc: lang === 'en' ? '1 or 3 year validity.' : 'صلاحية لمدة سنة أو 3 سنوات.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Apply Now' : 'قدم الآن', icon: FileText, type: 'idp-flow', primary: true }
                  ]
              };
          case 'service-jordanian':
              return {
                  title: lang === 'en' ? 'Jordanian Passport Services' : 'خدمات الجوازات الأردنية',
                  subtitle: lang === 'en' ? 'Hassle-free passport logistics.' : 'خدمات لوجستية للجوازات بدون عناء.',
                  desc: lang === 'en'
                    ? 'We handle the secure transport of documents to and from Jordanian authorities for passport issuance and renewal.'
                    : 'نتولى النقل الآمن للمستندات من وإلى السلطات الأردنية لإصدار وتجديد جوازات السفر.',
                  icon: FileText,
                  heroImage: 'https://images.unsplash.com/photo-1544026230-01d006198896?auto=format&fit=crop&q=80&w=2000',
                  features: [
                      { title: lang === 'en' ? 'Secure Transport' : 'نقل آمن', desc: lang === 'en' ? 'Tracked delivery.' : 'توصيل متتبع.' },
                      { title: lang === 'en' ? 'End-to-End' : 'من البداية للنهاية', desc: lang === 'en' ? 'We handle the legwork.' : 'نحن نتولى المهام الشاقة.' },
                      { title: lang === 'en' ? 'Trusted Service' : 'خدمة موثوقة', desc: lang === 'en' ? 'Years of experience.' : 'سنوات من الخبرة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Us' : 'تواصل معنا', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          
          // --- CORPORATE SERVICES ---
          case 'service-corp-daily':
              return {
                  title: lang === 'en' ? 'Daily Mail Services' : 'البريد اليومي',
                  subtitle: lang === 'en' ? 'Consistent and reliable mail exchange.' : 'تبادل بريد منتظم وموثوق.',
                  desc: lang === 'en'
                    ? 'Scheduled daily pickup and delivery routes tailored for your business correspondence. We ensure your documents move efficiently between branches or partners.'
                    : 'رحلات استلام وتوصيل يومية مجدولة مصممة لمراسلات عملك. نضمن نقل مستنداتك بكفاءة بين الفروع أو الشركاء.',
                  icon: Mail,
                  heroImage: 'daily-mail.jpg',
                  features: [
                      { title: lang === 'en' ? 'Scheduled Routes' : 'مسارات مجدولة', desc: lang === 'en' ? 'Fixed timings.' : 'توقيتات ثابتة.' },
                      { title: lang === 'en' ? 'Secure Pouches' : 'حقائب آمنة', desc: lang === 'en' ? 'Tamper-proof transport.' : 'نقل محمي من التلاعب.' },
                      { title: lang === 'en' ? 'Inter-branch' : 'بين الفروع', desc: lang === 'en' ? 'Internal mail systems.' : 'أنظمة بريد داخلية.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-signing':
              return {
                  title: lang === 'en' ? 'Document Signing' : 'توقيع المستندات',
                  subtitle: lang === 'en' ? 'Courier-facilitated legal signing.' : 'توقيع قانوني بمساعدة المندوب.',
                  desc: lang === 'en'
                    ? 'We don’t just deliver; we ensure your documents are signed by the right person. Ideal for contracts, banking forms, and legal notices requiring proof of execution.'
                    : 'لا نكتفي بالتوصيل فحسب؛ بل نضمن توقيع مستنداتك من قبل الشخص المعني. مثالية للعقود، النماذج البنكية، والإشعارات القانونية التي تتطلب إثبات التنفيذ.',
                  icon: FileSignature,
                  heroImage: 'signing.jpg',
                  features: [
                      { title: lang === 'en' ? 'ID Verification' : 'التحقق من الهوية', desc: lang === 'en' ? 'Verify signer identity.' : 'التحقق من هوية الموقع.' },
                      { title: lang === 'en' ? 'Return Service' : 'خدمة الإرجاع', desc: lang === 'en' ? 'Signed docs returned.' : 'إعادة المستندات الموقعة.' },
                      { title: lang === 'en' ? 'Legal Compliance' : 'امتثال قانوني', desc: lang === 'en' ? 'Audit trail provided.' : 'توفير مسار تدقيق.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-bulk':
              return {
                  title: lang === 'en' ? 'Bulk Distribution' : 'التوزيع بالجملة',
                  subtitle: lang === 'en' ? 'Mass delivery for marketing & bills.' : 'توصيل جماعي للتسويق والفواتير.',
                  desc: lang === 'en'
                    ? 'Efficient distribution for high-volume items like magazines, invoices, or promotional materials. We offer targeted delivery zones and detailed reporting.'
                    : 'توزيع فعال للعناصر ذات الحجم الكبير مثل المجلات، الفواتير، أو المواد الترويجية. نقدم مناطق توصيل مستهدفة وتقارير مفصلة.',
                  icon: Layers,
                  heroImage: 'bulk.jpg',
                  features: [
                      { title: lang === 'en' ? 'Zone Targeting' : 'استهداف المناطق', desc: lang === 'en' ? 'Geographic segmentation.' : 'تقسيم جغرافي.' },
                      { title: lang === 'en' ? 'Address Verification' : 'التحقق من العنوان', desc: lang === 'en' ? 'Clean your database.' : 'تنظيف قاعدة بياناتك.' },
                      { title: lang === 'en' ? 'Cost Effective' : 'فعال من حيث التكلفة', desc: lang === 'en' ? 'Volume discounts.' : 'خصومات على الكميات.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Contact Sales' : 'تواصل مع المبيعات', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-storage':
              return {
                  title: lang === 'en' ? 'Storage Services' : 'خدمات التخزين',
                  subtitle: lang === 'en' ? 'Flexible short & long term storage.' : 'تخزين مرن قصير وطويل المدى.',
                  desc: lang === 'en'
                    ? 'Secure, climate-controlled storage facilities. Whether you need temporary space for seasonal stock or long-term archiving, we have the capacity.'
                    : 'مرافق تخزين آمنة ومتحكم في مناخها للاحتياجات قصيرة المدى. خيارات مساحة مرنة للتعامل مع تقلبات المخزون.',
                  icon: Box,
                  heroImage: 'storage.jpg',
                  features: [
                      { title: lang === 'en' ? '24/7 Security' : 'أمن 24/7', desc: lang === 'en' ? 'Monitored facilities.' : 'مرافق مراقبة.' },
                      { title: lang === 'en' ? 'Climate Control' : 'تحكم بالمناخ', desc: lang === 'en' ? 'For sensitive items.' : 'للمواد الحساسة.' },
                      { title: lang === 'en' ? 'Flexible Terms' : 'شروط مرنة', desc: lang === 'en' ? 'Pay as you use.' : 'ادفع حسب الاستخدام.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Inquire Now' : 'استفسر الآن', icon: Phone, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-warehousing':
              return {
                  title: lang === 'en' ? 'Warehouse Management' : 'إدارة المستودعات',
                  subtitle: lang === 'en' ? 'Outsourced fulfillment & logistics.' : 'إدارة وتجهيز الطلبات خارجيًا.',
                  desc: lang === 'en'
                    ? 'Let us be your logistics partner. We handle receiving, inventory management, picking, packing, and shipping so you can focus on sales.'
                    : 'دعنا نكون شريكك اللوجستي. نتولى الاستلام، إدارة المخزون، التجهيز، التغليف، والشحن لتتمكن من التركيز على المبيعات.',
                  icon: Warehouse,
                  heroImage: 'warehouse.png',
                  features: [
                      { title: lang === 'en' ? 'Inventory System' : 'نظام المخزون', desc: lang === 'en' ? 'Real-time tracking.' : 'تتبع فوري.' },
                      { title: lang === 'en' ? 'Pick & Pack' : 'تجهيز وتغليف', desc: lang === 'en' ? 'Efficient fulfillment.' : 'تجهيز فعال.' },
                      { title: lang === 'en' ? 'API Integration' : 'ربط API', desc: lang === 'en' ? 'Connect your store.' : 'اربط متجرك.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Partner with Us' : 'شاركنا', icon: Server, type: 'contact', primary: true }
                  ]
              };
          case 'service-corp-freight':
              return {
                  title: lang === 'en' ? 'Heavy Freight' : 'الشحن الثقيل',
                  subtitle: lang === 'en' ? 'Transport for oversized cargo.' : 'نقل البضائع الضخمة.',
                  desc: lang === 'en'
                    ? 'Specialized fleet for heavy and oversized loads. We handle route planning, permits, and secure transport for industrial equipment and machinery.'
                    : 'أسطول متخصص للأحمال الثقيلة والضخمة. نتولى تخطيط المسار، التصاريح، والنقل الآمن للمعدات والآلات الصناعية.',
                  icon: Truck,
                  heroImage: 'truck.png',
                  features: [
                      { title: lang === 'en' ? 'Specialized Fleet' : 'أسطول متخصص', desc: lang === 'en' ? 'Flatbeds & cranes.' : 'شاحنات مسطحة ورافعات.' },
                      { title: lang === 'en' ? 'Route Planning' : 'تخطيط المسار', desc: lang === 'en' ? 'Safe transit.' : 'عبور آمن.' },
                      { title: lang === 'en' ? 'Insurance' : 'تأمين', desc: lang === 'en' ? 'Full coverage.' : 'تغطية شاملة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Get Quote' : 'طلب عرض سعر', icon: FileText, type: 'contact', primary: true }
                  ]
              };
          case 'service-multimodal-freight':
              return {
                  title: lang === 'en' ? 'Ocean, Land & Air Freight' : 'الشحن البحري والبري والجوي',
                  subtitle: lang === 'en' ? 'One partner, every route.' : 'شريك واحد، كل الطرق.',
                  desc: lang === 'en'
                    ? 'End-to-end multimodal freight forwarding by sea, road and air. We design the most cost-effective route for FCL/LCL ocean shipments, cross-border trucking, and time-critical air cargo with full customs and documentation support.'
                    : 'خدمات شحن متعددة الوسائل بحراً وبراً وجواً. نصمم المسار الأنسب للحاويات البحرية الكاملة والجزئية، والنقل البري بين الدول، والشحن الجوي العاجل مع التخليص الجمركي الكامل.',
                  icon: Plane,
                  heroImage: 'airplane.png',
                  features: [
                      { title: lang === 'en' ? 'Ocean Freight' : 'الشحن البحري', desc: lang === 'en' ? 'FCL & LCL containers.' : 'حاويات كاملة وجزئية.' },
                      { title: lang === 'en' ? 'Land Freight' : 'الشحن البري', desc: lang === 'en' ? 'Cross-border trucking.' : 'نقل بري عبر الحدود.' },
                      { title: lang === 'en' ? 'Air Freight' : 'الشحن الجوي', desc: lang === 'en' ? 'Time-critical cargo.' : 'بضائع عاجلة.' }
                  ],
                  actions: [
                      { label: lang === 'en' ? 'Get Quote' : 'طلب عرض سعر', icon: FileText, type: 'contact', primary: true }
                  ]
              };

          default:
              return null;
      }
  };

  const content = getContent();
  const faqs = FAQ_DATA[serviceId] || [];

  if (!content) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className={`relative h-[400px] flex items-center overflow-hidden ${themeClasses.heroBg}`}>
            {/* Background Image Logic */}
            <div className="absolute inset-0 z-0 opacity-20">
                {/* Fallback for local images that might be missing in preview environment, use generic abstract or color if img fails visually */}
                <img 
                    src={content.heroImage} 
                    alt={content.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        if (e.currentTarget.dataset.fallbackApplied === 'true') {
                            e.currentTarget.style.display = 'none';
                            return;
                        }
                        e.currentTarget.dataset.fallbackApplied = 'true';
                        e.currentTarget.src = isCorporate ? '/assets/corporate-bg.jpg' : '/assets/background.jpg';
                    }}
                />
                <div className={`w-full h-full absolute inset-0 mix-blend-color ${themeClasses.heroBg}`}></div>
            </div>
            <div className={`absolute inset-0 bg-gradient-to-r to-transparent z-10 ${themeClasses.heroOverlay}`}></div>
            
            <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-lg ${themeClasses.iconBox}`}>
                        <content.icon className="w-8 h-8" />
                    </div>
                    <span className={`font-bold uppercase tracking-wider text-sm ${themeClasses.labelText}`}>
                        {lang === 'en' ? 'Service Detail' : 'تفاصيل الخدمة'}
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 animate-slide-up">
                    {content.title}
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl animate-slide-up delay-100">
                    {content.subtitle}
                </p>
            </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-30 mb-20">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 animate-pop delay-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* Description & Features */}
                    <div className="space-y-8">
                        <div>
                            <h3 className={`text-2xl font-bold mb-4 ${themeClasses.headingText}`}>
                                {lang === 'en' ? 'About this Service' : 'عن هذه الخدمة'}
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {content.desc}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {content.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{feature.title}</h4>
                                        <p className="text-sm text-gray-500">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                            {lang === 'en' ? 'Ready to get started?' : 'مستعد للبدء؟'}
                        </h3>
                        <div className="space-y-4">
                            {content.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onAction(action.type)}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:translate-y-[-2px] ${
                                        action.primary 
                                        ? themeClasses.primaryBtn
                                        : 'bg-white text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <action.icon className="w-5 h-5" />
                                        {action.label}
                                    </div>
                                    <ArrowRight className={`w-5 h-5 rtl:rotate-180 ${action.primary ? themeClasses.primaryBtnIcon : 'text-gray-400'}`} />
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-sm text-gray-500">
                                {lang === 'en' ? 'Need help? Contact our support.' : 'تحتاج مساعدة؟ تواصل مع الدعم الفني.'}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Packing Available Types (New Section) */}
                {content.packingTypes && (
                    <div className="mt-20 pt-12 border-t border-gray-100">
                        <h3 className={`text-2xl font-bold mb-8 ${themeClasses.headingText}`}>
                            {lang === 'en' ? 'Packing Available Types' : 'أنواع التغليف المتاحة'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {content.packingTypes.map((type, idx) => (
                                <div key={idx} className={`p-6 rounded-xl border ${themeClasses.packingCard} transition-all`}>
                                    <div className={`w-12 h-12 rounded-lg ${themeClasses.iconBox} flex items-center justify-center mb-4`}>
                                        <type.icon className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{lang === 'en' ? type.name.en : type.name.ar}</h4>
                                    <p className="text-sm text-gray-500">{lang === 'en' ? type.desc.en : type.desc.ar}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* How It Works (New Section) */}
                {content.howItWorks && (
                    <div className="mt-20 pt-12 border-t border-gray-100">
                        <h3 className={`text-2xl font-bold mb-10 text-center ${themeClasses.headingText}`}>
                            {lang === 'en' ? 'How Packing Service Works' : 'كيف تعمل خدمة التغليف'}
                        </h3>
                        <div className="relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0"></div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {content.howItWorks.map((step, idx) => (
                                    <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4 border-4 border-white shadow-md ${themeClasses.stepNumBg}`}>
                                            {idx + 1}
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">{lang === 'en' ? step.title.en : step.title.ar}</h4>
                                        <p className="text-sm text-gray-500 max-w-[200px]">{lang === 'en' ? step.desc.en : step.desc.ar}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Card Checker – Jordan Passport only */}
                {serviceId === 'service-jordanian' && (
                    <ReviewCardChecker lang={lang} />
                )}

                {/* Customs Clearance Request Form – Clearance service only */}
                {serviceId === 'service-clearance' && (
                    <CustomsClearanceRequestForm lang={lang} />
                )}

                {/* Freight Shipping Request Form – Multimodal freight service only */}
                {serviceId === 'service-multimodal-freight' && (
                    <FreightShippingRequestForm lang={lang} />
                )}

                {/* FAQ Section */}
                {faqs.length > 0 && (
                    <div className="mt-20 pt-12 border-t border-gray-100">
                        <h3 className={`text-2xl font-bold mb-8 flex items-center gap-2 ${themeClasses.headingText}`}>
                            <HelpCircle className="w-6 h-6" />
                            {lang === 'en' ? 'Frequently Asked Questions' : 'أسئلة شائعة'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {faqs.map((faq, index) => {
                                const isOpen = openFaqIndex === index;
                                return (
                                    <div key={index} className={`rounded-xl border border-gray-100 overflow-hidden transition-all ${isOpen ? 'shadow-md' : 'hover:shadow-sm'}`}>
                                        <button
                                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                            className={`w-full flex justify-between items-start text-left rtl:text-right p-5 ${themeClasses.faqBg} hover:opacity-90 transition-opacity`}
                                        >
                                            <span className={`font-bold text-lg ${themeClasses.faqQuestion}`}>
                                                {lang === 'en' ? faq.q.en : faq.q.ar}
                                            </span>
                                            {isOpen ? <ChevronUp className={`w-5 h-5 mt-1 ${themeClasses.faqQuestion}`} /> : <ChevronDown className={`w-5 h-5 mt-1 ${themeClasses.faqQuestion}`} />}
                                        </button>
                                        <div 
                                            className={`bg-white transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <div className="p-5 pt-2 text-gray-600 leading-relaxed border-t border-gray-100/50">
                                                {lang === 'en' ? faq.a.en : faq.a.ar}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};