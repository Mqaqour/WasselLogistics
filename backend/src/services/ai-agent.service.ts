import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { wasselAwbDetailsUrl, wasselAwbHeaders } from '../utils/wasselAwb';

type ResourceSearchResult = {
  answer: string;
  relatedTopics: string[];
};

type TrackingApiLog = {
  portalDescription?: string;
  portalDescriptionAr?: string;
  statusDate?: string;
  statusTime?: string;
  location?: string;
};

type TrackingApiItem = {
  status?: string;
  statusAr?: string;
  from?: string;
  fromAr?: string;
  to?: string;
  toAr?: string;
  serviceType?: string;
  serviceTypeAr?: string;
  deliveryType?: string;
  deliveryTypeAr?: string;
  expectedDeliveryDate?: string;
  lastDestinationLog?: TrackingApiLog;
};

type TrackingApiResponse = {
  isSuccess?: boolean;
  data?: TrackingApiItem[];
};

type IntentKey =
  | 'shipping_quote'
  | 'shipment_tracking'
  | 'jordan_passport_service'
  | 'international_driving_license'
  | 'no_objection_service'
  | 'branch_info'
  | 'working_hours'
  | 'general';

type IntentFieldKey =
  | 'destinationCountry'
  | 'destinationPostalCode'
  | 'destinationCity'
  | 'shipmentWeight'
  | 'shipmentContent'
  | 'packageType'
  | 'packagingPreference'
  | 'trackingNumber'
  | 'serviceType';

type IntentState = {
  followUpQuestionCount: number;
  knownFields: Partial<Record<IntentFieldKey, string>>;
  completed: boolean;
  updatedAt: number;
};

type ConversationIntentState = {
  activeIntent: IntentKey;
  intents: Partial<Record<IntentKey, IntentState>>;
  updatedAt: number;
};

type ResourceSearchOptions = {
  conversationId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
};

const MAX_FOLLOW_UP_QUESTIONS = 2;
const CONVERSATION_STATE_TTL_MS = 30 * 60 * 1000;
const conversationIntentState = new Map<string, ConversationIntentState>();

const requiredFieldsByIntent: Record<IntentKey, IntentFieldKey[]> = {
  shipping_quote: ['shipmentWeight', 'shipmentContent'],
  shipment_tracking: ['trackingNumber'],
  jordan_passport_service: ['serviceType'],
  international_driving_license: ['serviceType'],
  no_objection_service: ['serviceType'],
  branch_info: [],
  working_hours: [],
  general: [],
};

const QUICKRATE_FALLBACK_AR = 'لا يتوفر سعر مؤكد لهذه الشحنة ضمن البيانات الحالية.';

const COUNTRY_CODES: Record<string, string> = {
  palestine: 'PS', 'west bank': 'PS', فلسطين: 'PS', 'الضفة الغربية': 'PS',
  israel: 'IL', اسرائيل: 'IL', إسرائيل: 'IL',
  jordan: 'JO', الاردن: 'JO', الأردن: 'JO',
  'saudi arabia': 'SA', السعودية: 'SA', 'المملكة العربية السعودية': 'SA',
  egypt: 'EG', مصر: 'EG',
  'united states': 'US', usa: 'US', america: 'US', الولايات: 'US', 'الولايات المتحدة': 'US', امريكا: 'US', أمريكا: 'US',
  'united kingdom': 'GB', uk: 'GB', 'great britain': 'GB', 'المملكة المتحدة': 'GB', بريطانيا: 'GB',
  germany: 'DE', المانيا: 'DE', ألمانيا: 'DE',
  france: 'FR', فرنسا: 'FR',
  italy: 'IT', ايطاليا: 'IT', إيطاليا: 'IT',
  spain: 'ES', اسبانيا: 'ES', إسبانيا: 'ES',
  netherlands: 'NL', هولندا: 'NL',
  turkey: 'TR', تركيا: 'TR',
  uae: 'AE', 'united arab emirates': 'AE', الامارات: 'AE', الإمارات: 'AE', 'الإمارات العربية المتحدة': 'AE',
  kuwait: 'KW', الكويت: 'KW',
  qatar: 'QA', قطر: 'QA',
  bahrain: 'BH', البحرين: 'BH',
  oman: 'OM', عمان: 'OM', عُمان: 'OM',
  lebanon: 'LB', لبنان: 'LB',
  syria: 'SY', سوريا: 'SY',
  iraq: 'IQ', العراق: 'IQ',
  china: 'CN', الصين: 'CN',
  japan: 'JP', اليابان: 'JP',
  india: 'IN', الهند: 'IN',
  canada: 'CA', كندا: 'CA',
  australia: 'AU', استراليا: 'AU', أستراليا: 'AU',
};

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function inferIntent(query: string): IntentKey {
  const normalized = query.toLowerCase();

  const hasShippingCue =
    /\bship|shipping|parcel|package|envelope|delivery|courier\b/.test(normalized)
    || /(شحن|طرد|مغلف|مظروف|شحنة|توصيل|ارسال|إرسال)/.test(query);
  const hasQuoteCue =
    /\bquote|rate|price|cost|shipping price|shipping rate\b/.test(normalized)
    || /(سعر|تكلفة|رسوم|تسعيرة)/.test(query);
  const hasWeightCue = /(\d+(?:\.\d+)?)\s?(kg|كيلو|كغم)/i.test(query);
  const hasDestinationCue = /\bto\s+[\w\s]{2,}/i.test(query) || /(الى|إلى|رايح|وجهة)/.test(query);

  if (
    /\btrack|tracking|awb|shipment status\b/.test(normalized) ||
    /(تتبع|تتبع الشحنة|رقم تتبع|حالة الشحنة)/.test(query)
  ) {
    return 'shipment_tracking';
  }

  if (hasQuoteCue || (hasShippingCue && (hasWeightCue || hasDestinationCue))) {
    return 'shipping_quote';
  }

  if (/passport|jordan passport/.test(normalized) || /(جواز|الجواز|جواز اردني|جواز أردني)/.test(query)) {
    return 'jordan_passport_service';
  }

  if (/driving license|international license|idl/.test(normalized) || /(رخصة دولية|رخصة قيادة دولية)/.test(query)) {
    return 'international_driving_license';
  }

  if (/no objection|noc/.test(normalized) || /(عدم ممانعة|شهادة عدم ممانعة)/.test(query)) {
    return 'no_objection_service';
  }

  if (/branch|office|location|where are you/.test(normalized) || /(فرع|فروع|موقع|اين|أين)/.test(query)) {
    return 'branch_info';
  }

  if (/working hours|business hours|open|closing time/.test(normalized) || /(ساعات العمل|الدوام|متى تفتح|متى تغلق)/.test(query)) {
    return 'working_hours';
  }

  return 'general';
}

function isClearlyNewRequest(query: string): boolean {
  const normalized = query.toLowerCase();
  return /\bnew request|another request|new shipment|different question|something else\b/.test(normalized)
    || /(طلب جديد|استفسار جديد|سؤال اخر|سؤال آخر|موضوع جديد)/.test(query);
}

function extractIntentFields(query: string): Partial<Record<IntentFieldKey, string>> {
  const fields: Partial<Record<IntentFieldKey, string>> = {};
  const trackingId = detectTrackingId(query);
  if (trackingId) {
    fields.trackingNumber = trackingId;
  }

  const weightMatch = query.match(/(\d+(?:\.\d+)?)\s?(kg|كيلو|كغم)/i);
  if (weightMatch) {
    fields.shipmentWeight = `${weightMatch[1]} ${weightMatch[2]}`;
  }

  const destinationCountryMatch = query.match(/\bto\s+([A-Za-z\s]{3,})/i)
    || query.match(/(?:الى|إلى)\s+([^\d,.;:\n]{3,})/i);
  if (destinationCountryMatch?.[1]) {
    fields.destinationCountry = destinationCountryMatch[1].trim();
  }

  const destinationPostalCodeMatch = query.match(/\b(?:zip|postal(?:\s*code)?)\s*[:\-]?\s*([A-Za-z0-9-]{4,10})\b/i)
    || query.match(/(?:الرمز\s*البريدي|رمز\s*بريدي)\s*[:\-]?\s*([A-Za-z0-9-]{4,10})/i)
    || query.match(/(?:الى|إلى|على|رايح(?:ة)?\s*(?:على|الى|إلى)?|to)\s*([A-Za-z0-9-]{4,10})\b/i);
  if (destinationPostalCodeMatch?.[1] && /\d/.test(destinationPostalCodeMatch[1])) {
    fields.destinationPostalCode = destinationPostalCodeMatch[1].trim();
  }

  const destinationCityMatch = query.match(/\b(city|destination city)\s*[:\-]?\s*([A-Za-z\s]{2,})/i)
    || query.match(/(?:مدينة|المدينة)\s*[:\-]?\s*([^\d,.;:\n]{2,})/i);
  if (destinationCityMatch?.[2]) {
    fields.destinationCity = destinationCityMatch[2].trim();
  }

  const contentMatch = query.match(/(?:content|contains|item|goods)\s*[:\-]?\s*([^,.;\n]+)/i)
    || query.match(/(?:المحتوى|محتوى|يحتوي)\s*[:\-]?\s*([^,.;\n]+)/i);
  if (contentMatch?.[1]) {
    fields.shipmentContent = contentMatch[1].trim();
  }

  if (/\b(document|envelope|documents?)\b/i.test(query) || /(مغلف|مظروف|مستند|وثائق)/.test(query)) {
    fields.packageType = 'document';
  } else if (/\b(parcel|package|box|custom)\b/i.test(query) || /(طرد|صندوق|شحنة)/.test(query)) {
    fields.packageType = 'custom';
  }

  if (/without\s+packag/i.test(query) || /(بدون\s*تغليف|بدون\s*تعبئة)/.test(query)) {
    fields.packagingPreference = 'without_packaging';
  } else if (/with\s+packag/i.test(query) || /(مع\s*تغليف|مع\s*تعبئة)/.test(query)) {
    fields.packagingPreference = 'with_packaging';
  }

  if (/passport|jordan passport|رخصة|جواز|عدم ممانعة|noc/i.test(query)) {
    fields.serviceType = query.trim();
  }

  return fields;
}

function getConversationState(conversationId: string): ConversationIntentState {
  const now = Date.now();

  for (const [key, value] of conversationIntentState.entries()) {
    if (now - value.updatedAt > CONVERSATION_STATE_TTL_MS) {
      conversationIntentState.delete(key);
    }
  }

  const existing = conversationIntentState.get(conversationId);
  if (existing) {
    existing.updatedAt = now;
    return existing;
  }

  const created: ConversationIntentState = {
    activeIntent: 'general',
    intents: {},
    updatedAt: now,
  };
  conversationIntentState.set(conversationId, created);
  return created;
}

function getIntentState(conversation: ConversationIntentState, intent: IntentKey): IntentState {
  const existing = conversation.intents[intent];
  if (existing) {
    existing.updatedAt = Date.now();
    return existing;
  }

  const created: IntentState = {
    followUpQuestionCount: 0,
    knownFields: {},
    completed: false,
    updatedAt: Date.now(),
  };
  conversation.intents[intent] = created;
  return created;
}

function getMissingRequiredFields(intent: IntentKey, knownFields: Partial<Record<IntentFieldKey, string>>): IntentFieldKey[] {
  if (intent !== 'shipping_quote') {
    return requiredFieldsByIntent[intent].filter((field) => {
      const value = knownFields[field];
      return !value || !value.trim();
    });
  }

  const missing: IntentFieldKey[] = [];
  const hasDestination = Boolean((knownFields.destinationCountry ?? '').trim() || (knownFields.destinationPostalCode ?? '').trim());
  if (!hasDestination) {
    missing.push('destinationCountry');
  }

  if (!(knownFields.shipmentWeight ?? '').trim()) {
    missing.push('shipmentWeight');
  }

  if (!(knownFields.shipmentContent ?? '').trim()) {
    missing.push('shipmentContent');
  }

  return missing;
}

function getCountryCode(name: string): string {
  const normalized = name.toLowerCase().trim();
  const known = COUNTRY_CODES[normalized];
  if (known) return known;

  const alphaOnly = normalized.replace(/[^a-z]/g, '').slice(0, 2).toUpperCase();
  return alphaOnly || 'ZZ';
}

function parseWeightKg(value: string): number | null {
  const m = value.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const parsed = Number(m[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function fetchInternationalShippingQuote(
  knownFields: Partial<Record<IntentFieldKey, string>>,
): Promise<{ price: number; currency: string } | null> {
  const destinationCountry = (knownFields.destinationCountry ?? '').trim();
  const destinationPostalCode = (knownFields.destinationPostalCode ?? '').trim();
  const shipmentWeightRaw = (knownFields.shipmentWeight ?? '').trim();
  const shipmentWeight = parseWeightKg(shipmentWeightRaw);

  if (!shipmentWeight) {
    return null;
  }

  const destinationCountryCode = destinationCountry ? getCountryCode(destinationCountry) : 'ZZ';
  const shippingDate = new Date().toISOString().split('T')[0];
  const packageType = knownFields.packageType === 'document' ? 'document' : 'custom';

  const payload = {
    destinationCountryCode,
    weight: shipmentWeight,
    shippingDate,
    packageType,
    origin: {
      country: 'IL',
      city: 'Jerusalem',
      zipCode: '9730000',
    },
    destination: {
      country: destinationCountryCode,
      city: destinationCountry || '',
      zipCode: destinationPostalCode,
    },
    packages: [
      {
        weight: shipmentWeight,
        length: packageType === 'document' ? 35 : 30,
        width: packageType === 'document' ? 25 : 20,
        height: packageType === 'document' ? 1 : 10,
      },
    ],
  };

  try {
    const url = `${env.QUICKRATE_BASE_URL}/api/external/shipping/quotes`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.QUICKRATE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      return null;
    }

    const data = await upstream.json().catch(() => ({})) as { quotes?: Array<{ price?: number | string; currency?: string }> };
    const quotes = Array.isArray(data.quotes) ? data.quotes : [];
    if (quotes.length === 0) {
      return null;
    }

    let selected = quotes[0];
    for (const q of quotes) {
      const qPrice = Number(q?.price);
      const selectedPrice = Number(selected?.price);
      if (Number.isFinite(qPrice) && (!Number.isFinite(selectedPrice) || qPrice < selectedPrice)) {
        selected = q;
      }
    }

    const price = Number(selected?.price);
    if (!Number.isFinite(price)) {
      return null;
    }

    const currency = typeof selected.currency === 'string' && selected.currency.trim()
      ? selected.currency.trim()
      : 'USD';

    return { price, currency };
  } catch {
    return null;
  }
}

function buildFollowUpQuestion(intent: IntentKey, missingFields: IntentFieldKey[], isArabic: boolean): string {
  const primaryField = missingFields[0];
  const fieldPrompts: Record<IntentFieldKey, { en: string; ar: string }> = {
    destinationCountry: {
      en: 'Please share the destination country to continue.',
      ar: 'يرجى تزويدي بدولة الوجهة للمتابعة.',
    },
    destinationPostalCode: {
      en: 'Please share the destination postal code to continue.',
      ar: 'يرجى تزويدي بالرمز البريدي للوجهة للمتابعة.',
    },
    destinationCity: {
      en: 'Please share the destination city to continue.',
      ar: 'يرجى تزويدي بمدينة الوجهة للمتابعة.',
    },
    shipmentWeight: {
      en: 'Please share the shipment weight (in kg) to continue.',
      ar: 'يرجى تزويدي بوزن الشحنة (بالكيلوغرام) للمتابعة.',
    },
    shipmentContent: {
      en: 'Please share the shipment content to continue.',
      ar: 'يرجى تزويدي بمحتوى الشحنة للمتابعة.',
    },
    trackingNumber: {
      en: 'Please share your tracking number so I can check the shipment status.',
      ar: 'يرجى تزويدي برقم التتبع حتى أتمكن من التحقق من حالة الشحنة.',
    },
    serviceType: {
      en: 'Please share the exact service type you need so I can help correctly.',
      ar: 'يرجى تحديد نوع الخدمة المطلوبة بدقة حتى أتمكن من مساعدتك بشكل صحيح.',
    },
    packageType: {
      en: 'Please share whether the shipment is an envelope or a parcel.',
      ar: 'يرجى تحديد ما إذا كانت الشحنة مغلفاً أم طرداً.',
    },
    packagingPreference: {
      en: 'Please share your packaging preference to continue.',
      ar: 'يرجى تزويدنا بتفضيل التغليف للمتابعة.',
    },
  };

  const intentSuffix = {
    shipping_quote: {
      en: 'This helps us provide an accurate shipping estimate.',
      ar: 'هذا يساعدنا على تقديم تقدير شحن أدق.',
    },
    shipment_tracking: {
      en: '',
      ar: '',
    },
    jordan_passport_service: {
      en: 'I will then guide you through Jordan passport service steps.',
      ar: 'بعد ذلك سأرشدك إلى خطوات خدمة الجواز الأردني.',
    },
    international_driving_license: {
      en: 'I will then guide you through international driving license steps.',
      ar: 'بعد ذلك سأرشدك إلى خطوات خدمة الرخصة الدولية.',
    },
    no_objection_service: {
      en: 'I will then guide you through no-objection service steps.',
      ar: 'بعد ذلك سأرشدك إلى خطوات خدمة عدم الممانعة.',
    },
    branch_info: {
      en: '',
      ar: '',
    },
    working_hours: {
      en: '',
      ar: '',
    },
    general: {
      en: '',
      ar: '',
    },
  }[intent];

  if (intent === 'shipping_quote') {
    const shippingFieldLabels: Record<IntentFieldKey, { en: string; ar: string }> = {
      destinationCountry: { en: 'Destination country', ar: 'الدولة أو المدينة الوجهة' },
      destinationCity: { en: 'Destination city', ar: 'المدينة الوجهة' },
      shipmentWeight: { en: 'Shipment weight after packaging', ar: 'وزن الطرد بعد التغليف' },
      shipmentContent: { en: 'Shipment content', ar: 'محتوى الطرد' },
      destinationPostalCode: { en: 'Destination postal code', ar: 'الرمز البريدي للوجهة' },
      trackingNumber: { en: 'Tracking number', ar: 'رقم التتبع' },
      serviceType: { en: 'Service type', ar: 'نوع الخدمة' },
      packageType: { en: 'Package type (parcel or envelope)', ar: 'نوع الشحنة (طرد أو مغلف)' },
      packagingPreference: { en: 'Packaging preference', ar: 'تفضيل التغليف' },
    };

    const lines = missingFields
      .map((field, index) => `${index + 1}. ${isArabic ? shippingFieldLabels[field].ar : shippingFieldLabels[field].en}`)
      .join('\n');

    return isArabic
      ? `حتى نتمكن من عرض المعلومات المتاحة، يرجى تزويدنا بـ:\n${lines}`
      : `To provide the available estimate, please share:\n${lines}`;
  }

  const base = isArabic ? fieldPrompts[primaryField].ar : fieldPrompts[primaryField].en;
  const suffix = isArabic ? intentSuffix.ar : intentSuffix.en;
  return suffix ? `${base} ${suffix}` : base;
}

function buildInsufficientInfoFinalAnswer(intent: IntentKey, isArabic: boolean): string {
  if (intent === 'shipping_quote') {
    return QUICKRATE_FALLBACK_AR;
  }

  if (intent === 'shipment_tracking') {
    return isArabic
      ? 'حسب المعلومات المتوفرة لدينا حالياً، لا يمكن تأكيد حالة الشحنة.'
      : 'Based on the currently available information, we cannot confirm the shipment status.';
  }

  return isArabic
    ? 'حسب المعلومات المتوفرة لدينا حالياً، لا يمكن تأكيد التفاصيل المطلوبة.'
    : 'Based on the currently available information, we cannot confirm the requested details.';
}

function buildIntentRelatedTopics(intent: IntentKey, isArabic: boolean): string[] {
  const topics: Record<IntentKey, { en: string[]; ar: string[] }> = {
    shipping_quote: {
      en: ['Shipping rates', 'Delivery time', 'Packaging guidance'],
      ar: ['أسعار الشحن', 'مدة التوصيل', 'إرشادات التغليف'],
    },
    shipment_tracking: {
      en: ['Track another shipment', 'Delivery status', 'Contact support'],
      ar: ['تتبع شحنة أخرى', 'حالة التسليم', 'التواصل مع الدعم'],
    },
    jordan_passport_service: {
      en: ['Jordan passport requirements', 'Required documents', 'Service timeline'],
      ar: ['متطلبات الجواز الأردني', 'الوثائق المطلوبة', 'مدة الخدمة'],
    },
    international_driving_license: {
      en: ['International driving license', 'Required documents', 'Processing time'],
      ar: ['الرخصة الدولية', 'الوثائق المطلوبة', 'مدة المعالجة'],
    },
    no_objection_service: {
      en: ['No-objection service', 'Required documents', 'Application steps'],
      ar: ['خدمة عدم الممانعة', 'الوثائق المطلوبة', 'خطوات التقديم'],
    },
    branch_info: {
      en: ['Branch locations', 'Nearest branch', 'Working hours'],
      ar: ['مواقع الفروع', 'أقرب فرع', 'ساعات العمل'],
    },
    working_hours: {
      en: ['Working hours', 'Branch locations', 'Customer support'],
      ar: ['ساعات العمل', 'مواقع الفروع', 'خدمة العملاء'],
    },
    general: {
      en: ['Contact support', 'Shipping services', 'Branch locations'],
      ar: ['التواصل مع الدعم', 'خدمات الشحن', 'مواقع الفروع'],
    },
  };

  return isArabic ? topics[intent].ar : topics[intent].en;
}

function looksLikeFollowUpQuestion(answer: string, isArabic: boolean): boolean {
  const text = answer.trim();
  const hasQuestionMark = text.includes('?') || text.includes('؟');
  const followUpHints = isArabic
    ? /(يرجى|فضلاً|من فضلك|زودني|تزويدي|ما هو|ما هي|هل يمكنك)/
    : /(please share|please provide|could you|can you|what is|which)/i;
  return hasQuestionMark || followUpHints.test(text);
}

function detectTrackingId(query: string): string | null {
  const trimmed = query.trim();

  const isLikelyPhoneNumber = (token: string): boolean => {
    const digits = token.replace(/\D/g, '');

    // Common local/international mobile formats that can appear in the contact form.
    if (/^05\d{8}$/.test(digits)) return true;      // 059XXXXXXXX
    if (/^5\d{8}$/.test(digits)) return true;       // 59XXXXXXXX
    if (/^9705\d{8}$/.test(digits)) return true;    // 97059XXXXXXX
    if (/^009705\d{8}$/.test(digits)) return true;  // 0097059XXXXXXX

    return false;
  };

  // Matches: "track 123", "تتبع 123", "track:123"
  const prefixed = trimmed.match(/^(?:track|\u062A\u062A\u0628\u0639)[:\s]+([\w\d-]+)/i);
  if (prefixed) {
    return prefixed[1];
  }

  // Matches bare AWB/number IDs like JJD014600012579976441 or 889122120814.
  const bareId = trimmed.match(/^((?:JJD|WAS|AWB)?[\dA-Z]{8,30})$/i);
  if (bareId) {
    return isLikelyPhoneNumber(bareId[1]) ? null : bareId[1];
  }

  // Fallback: extract any tracking-like token anywhere in the sentence.
  // Handles garbled/unknown prefix text such as "???? 889122120814".
  const embeddedMatches = trimmed.match(/((?:JJD|WAS|AWB)?[\dA-Z]{8,30}|\d{8,})/gi) ?? [];
  for (const match of embeddedMatches) {
    if (!isLikelyPhoneNumber(match)) {
      return match;
    }
  }

  return null;
}

async function getTrackingSummary(trackingId: string, isArabic: boolean): Promise<ResourceSearchResult> {
  const upstream = await fetch(wasselAwbDetailsUrl(trackingId), {
    method: 'GET',
    headers: wasselAwbHeaders(),
  });

  const payload = (await upstream.json().catch(() => ({}))) as TrackingApiResponse;
  const record = Array.isArray(payload.data) ? payload.data[0] : undefined;

  if (!upstream.ok || !payload.isSuccess || !record) {
    return {
      answer: isArabic
        ? `لم يتم العثور على معلومات للشحنة ${trackingId}.`
        : `No tracking information found for shipment ${trackingId}.`,
      relatedTopics: isArabic
        ? ['تتبع شحنة اخرى', 'التواصل مع الدعم']
        : ['Track another shipment', 'Contact support'],
    };
  }

  const status = isArabic ? (record.statusAr ?? record.status ?? '-') : (record.status ?? record.statusAr ?? '-');
  const from = isArabic ? (record.fromAr ?? record.from ?? '-') : (record.from ?? record.fromAr ?? '-');
  const to = isArabic ? (record.toAr ?? record.to ?? '-') : (record.to ?? record.toAr ?? '-');
  const serviceType = isArabic
    ? (record.serviceTypeAr ?? record.serviceType ?? '-')
    : (record.serviceType ?? record.serviceTypeAr ?? '-');
  const deliveryType = isArabic
    ? (record.deliveryTypeAr ?? record.deliveryType ?? '-')
    : (record.deliveryType ?? record.deliveryTypeAr ?? '-');
  const expectedDelivery = record.expectedDeliveryDate ?? (isArabic ? 'غير محدد' : 'N/A');

  const lastLog = record.lastDestinationLog;
  const lastAction = lastLog
    ? (isArabic ? (lastLog.portalDescriptionAr ?? lastLog.portalDescription) : (lastLog.portalDescription ?? lastLog.portalDescriptionAr))
    : undefined;
  const lastAt = lastLog
    ? [lastLog.statusDate, lastLog.statusTime].filter((v) => typeof v === 'string' && v.length > 0).join(' ')
    : '';
  const lastLocation = lastLog?.location ?? '';

  const answer = isArabic
    ? [
        `تتبع الشحنة: ${trackingId}`,
        `الحالة: ${status}`,
        `من: ${from}`,
        `الى: ${to}`,
        `الخدمة: ${serviceType} - ${deliveryType}`,
        lastAction ? `اخر تحديث${lastAt ? ` (${lastAt})` : ''}: ${lastAction}${lastLocation ? ` - ${lastLocation}` : ''}` : '',
        `التسليم المتوقع: ${expectedDelivery}`,
      ]
        .filter(Boolean)
        .join('\n')
    : [
        `Tracking: ${trackingId}`,
        `Status: ${status}`,
        `From: ${from}`,
        `To: ${to}`,
        `Service: ${serviceType} - ${deliveryType}`,
        lastAction ? `Last update${lastAt ? ` (${lastAt})` : ''}: ${lastAction}${lastLocation ? ` - ${lastLocation}` : ''}` : '',
        `Expected delivery: ${expectedDelivery}`,
      ]
        .filter(Boolean)
        .join('\n');

  return {
    answer,
    relatedTopics: isArabic
      ? ['تتبع شحنة اخرى', 'التواصل مع الدعم']
      : ['Track another shipment', 'Contact support'],
  };
}

function extractOutputText(response: any): string {
  if (typeof response?.output_text === 'string' && response.output_text) {
    return response.output_text;
  }

  const parts: string[] = [];
  const output = Array.isArray(response?.output) ? response.output : [];
  for (const item of output) {
    if (item?.type !== 'message' || !Array.isArray(item?.content)) {
      continue;
    }
    for (const content of item.content) {
      if (content?.type === 'output_text' && typeof content?.text === 'string') {
        parts.push(content.text);
      }
    }
  }

  return parts.join('').trim();
}

function parseJsonPayload(raw: string): ResourceSearchResult {
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as Partial<ResourceSearchResult>;

  return {
    answer: typeof parsed.answer === 'string' ? parsed.answer : 'I could not generate an answer right now.',
    relatedTopics: Array.isArray(parsed.relatedTopics)
      ? parsed.relatedTopics.filter((x): x is string => typeof x === 'string').slice(0, 4)
      : [],
  };
}

async function callAgentWithApiKey(prompt: string, agentName: string, agentVersion: string, timeoutMs?: number): Promise<string> {
  const base = env.AI_PROJECT_ENDPOINT.replace(/\/$/, '');
  const url = `${base}/openai/v1/responses`;

  const controller = timeoutMs ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.AI_PROJECT_API_KEY,
      },
      body: JSON.stringify({
        input: prompt,
        agent_reference: {
          name: agentName,
          version: agentVersion,
          type: 'agent_reference',
        },
      }),
      signal: controller?.signal,
    });

    if (!res.ok) {
      const details = await res.text().catch(() => '');
      throw new Error(`API key request failed (${res.status}): ${details}`);
    }

    const response = await res.json();
    const outputText = extractOutputText(response);
    if (!outputText) {
      throw new Error('Empty agent response');
    }

    return outputText;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Calls the given Foundry agent (API-key auth if configured, else Azure AD) and returns its raw output text. */
async function callAgent(prompt: string, agentName: string, agentVersion: string, timeoutMs?: number): Promise<string> {
  if (env.AI_PROJECT_API_KEY) {
    return callAgentWithApiKey(prompt, agentName, agentVersion, timeoutMs);
  }

  const projectClient = new AIProjectClient(env.AI_PROJECT_ENDPOINT, new DefaultAzureCredential());
  const openAIClient = projectClient.getOpenAIClient();

  const conversation = await openAIClient.conversations.create({
    items: [{ type: 'message', role: 'user', content: prompt }],
  });

  const responsePromise = openAIClient.responses.create(
    { conversation: conversation.id },
    { body: { agent: { name: agentName, version: agentVersion, type: 'agent_reference' } } }
  ).then(extractOutputText);

  if (!timeoutMs) return responsePromise;

  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error(`Agent request timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([responsePromise, timeoutPromise]);
}

/**
 * Drafts an internal-only suggested reply + follow-up questions for a Contact Us
 * submission, using a separate, non-conversational agent from the public KB
 * chatbot — this task has no intent detection, tracking hijack, or multi-turn
 * state, it's a single one-shot drafting call.
 */
export async function getContactAiSuggestion(formSummary: string): Promise<ResourceSearchResult> {
  if (!env.AI_PROJECT_ENDPOINT || !env.AI_CONTACT_AGENT_NAME) {
    throw Object.assign(new Error('Contact AI agent is not configured.'), {
      code: 'AI_NOT_CONFIGURED',
      status: 500,
    });
  }

  const prompt = [
    'You are helping a Wassel Logistics support agent draft an internal reply suggestion before they respond to a Contact Us submission.',
    'This text is for internal staff use only — it will never be shown to the customer, so do not greet them or address them directly.',
    'Do not search the web or use any tools. Base your answer only on the form data given below.',
    'Return ONLY valid JSON exactly in this shape, with no markdown formatting:',
    '{"answer":"...","relatedTopics":["...","..."]}',
    '"answer" should be a short, practical suggested reply or next steps for the staff member.',
    '"relatedTopics" should be 3-4 short suggested follow-up questions for the staff member to ask the customer, based on the topic.',
    '',
    formSummary,
  ].join('\n');

  try {
    const outputText = await callAgent(prompt, env.AI_CONTACT_AGENT_NAME, env.AI_CONTACT_AGENT_VERSION, 15000);
    if (!outputText) {
      throw new Error('Empty agent response');
    }
    return parseJsonPayload(outputText);
  } catch (err) {
    logger.warn(`getContactAiSuggestion failed: ${err instanceof Error ? err.message : String(err)}`);
    throw Object.assign(new Error(`Contact AI suggestion failed: ${err instanceof Error ? err.message : String(err)}`), {
      code: 'AI_REQUEST_FAILED',
      status: 502,
    });
  }
}

export async function getResourceSearchResponse(query: string, options?: ResourceSearchOptions): Promise<ResourceSearchResult> {
  if (!env.AI_PROJECT_ENDPOINT || !env.AI_AGENT_NAME) {
    throw Object.assign(new Error('AI agent is not configured.'), {
      code: 'AI_NOT_CONFIGURED',
      status: 500,
    });
  }

  const isArabic = isArabicText(query);
  const conversationId = options?.conversationId?.trim()
    || `stateless-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const conversation = getConversationState(conversationId);
  const recentHistory = Array.isArray(options?.conversationHistory)
    ? options.conversationHistory
        .filter((turn) => turn && typeof turn.content === 'string' && turn.content.trim().length > 0)
        .slice(-12)
    : [];
  const detectedIntent = inferIntent(query);

  const resolvedIntent = (detectedIntent === 'general' && conversation.activeIntent !== 'general' && !isClearlyNewRequest(query))
    ? conversation.activeIntent
    : detectedIntent;

  if (isClearlyNewRequest(query) || conversation.activeIntent !== resolvedIntent) {
    conversation.activeIntent = resolvedIntent;
  }

  const intentState = getIntentState(conversation, resolvedIntent);
  if (intentState.completed && (isClearlyNewRequest(query) || detectedIntent !== 'general')) {
    intentState.followUpQuestionCount = 0;
    intentState.knownFields = {};
    intentState.completed = false;
  }

  const extractedFields = extractIntentFields(query);
  intentState.knownFields = {
    ...intentState.knownFields,
    ...extractedFields,
  };

  const missingFields = getMissingRequiredFields(resolvedIntent, intentState.knownFields);

  if (missingFields.length > 0) {
    if (intentState.followUpQuestionCount < MAX_FOLLOW_UP_QUESTIONS) {
      intentState.followUpQuestionCount += 1;
      intentState.completed = false;
      return {
        answer: buildFollowUpQuestion(resolvedIntent, missingFields, isArabic),
        relatedTopics: buildIntentRelatedTopics(resolvedIntent, isArabic),
      };
    }

    intentState.completed = true;
    return {
      answer: buildInsufficientInfoFinalAnswer(resolvedIntent, isArabic),
      relatedTopics: buildIntentRelatedTopics(resolvedIntent, isArabic),
    };
  }

  if (resolvedIntent === 'shipping_quote') {
    const quote = await fetchInternationalShippingQuote(intentState.knownFields);
    intentState.completed = true;

    if (!quote) {
      return {
        answer: QUICKRATE_FALLBACK_AR,
        relatedTopics: buildIntentRelatedTopics(resolvedIntent, true),
      };
    }

    const destinationDisplay = (intentState.knownFields.destinationCountry ?? '').trim()
      || (intentState.knownFields.destinationPostalCode ?? '').trim()
      || '-';
    const weightDisplay = (intentState.knownFields.shipmentWeight ?? '').trim() || '-';
    const contentDisplay = (intentState.knownFields.shipmentContent ?? '').trim() || '-';
    const priceDisplay = `${quote.price.toFixed(2)} ${quote.currency}`;

    return {
      answer: [
        'عرض سعر شحن دولي:',
        `الوجهة: ${destinationDisplay}`,
        `الوزن: ${weightDisplay}`,
        `محتوى الشحنة: ${contentDisplay}`,
        `السعر المبدئي: ${priceDisplay}`,
        '',
        'ملاحظات:',
        'يرجى التأكد من أن الوزن هو وزن الشحنة بعد التغليف.',
        'يتحمل العميل مسؤولية صحة بيانات الوزن والحجم والمحتوى.',
      ].join('\n'),
      relatedTopics: ['طلب عرض سعر آخر', 'خدمة الشحن الدولي', 'التواصل مع الدعم'],
    };
  }

  const trackingId = intentState.knownFields.trackingNumber ?? detectTrackingId(query);
  if (trackingId) {
    try {
      const result = await getTrackingSummary(trackingId, isArabic);
      intentState.completed = true;
      return result;
    } catch {
      intentState.completed = true;
      return {
        answer: isArabic
          ? 'تعذر الوصول الى خدمة التتبع حاليا. يرجى المحاولة لاحقا.'
          : 'Unable to reach tracking service right now. Please try again later.',
        relatedTopics: isArabic
          ? ['تتبع شحنة اخرى', 'التواصل مع الدعم']
          : ['Track another shipment', 'Contact support'],
      };
    }
  }

  const prompt = [
    'You are an expert logistics assistant for Wassel.',
    'Answer the user question clearly and concisely.',
    'Then suggest 3-4 short related topic phrases.',
    'Detect user language (English or Arabic) and respond in the same language.',
    'Ask at most one follow-up question in a single message.',
    `For this intent, the assistant has already asked ${intentState.followUpQuestionCount} follow-up question(s). Never exceed ${MAX_FOLLOW_UP_QUESTIONS}.`,
    `Active intent: ${resolvedIntent}.`,
    `Known fields: ${JSON.stringify(intentState.knownFields)}.`,
    recentHistory.length > 0
      ? `Recent conversation context:\n${recentHistory.map((turn) => `${turn.role}: ${turn.content}`).join('\n')}`
      : 'Recent conversation context: none.',
    'Return ONLY valid JSON exactly in this shape with no markdown:',
    '{"answer":"...","relatedTopics":["...","..."]}',
    '',
    `User question: ${query}`,
  ].join('\n');

  try {
    const outputText = await callAgent(prompt, env.AI_AGENT_NAME, env.AI_AGENT_VERSION);

    if (!outputText) {
      throw new Error('Empty agent response');
    }

    const parsed = parseJsonPayload(outputText);
    if (looksLikeFollowUpQuestion(parsed.answer, isArabic)) {
      if (intentState.followUpQuestionCount < MAX_FOLLOW_UP_QUESTIONS) {
        intentState.followUpQuestionCount += 1;
        intentState.completed = false;
        return {
          answer: parsed.answer,
          relatedTopics: parsed.relatedTopics,
        };
      }

      intentState.completed = true;
      return {
        answer: buildInsufficientInfoFinalAnswer(resolvedIntent, isArabic),
        relatedTopics: buildIntentRelatedTopics(resolvedIntent, isArabic),
      };
    }

    intentState.completed = true;
    return parsed;
  } catch (error) {
    const message = String(error);
    const isRateLimited = message.includes('rate_limit_exceeded') || message.includes('(429)');

    throw Object.assign(new Error(`AI agent request failed: ${message}`), {
      code: isRateLimited ? 'AI_RATE_LIMITED' : 'AI_REQUEST_FAILED',
      status: isRateLimited ? 429 : 502,
    });
  }
}
