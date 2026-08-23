import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';
import { env } from '../config/env';

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
  | 'local_delivery'
  | 'shipping_quote'
  | 'shipment_tracking'
  | 'jordan_passport_service'
  | 'international_driving_license'
  | 'no_objection_service'
  | 'no_objection_fees'
  | 'branch_info'
  | 'working_hours'
  | 'general';

type IntentFieldKey =
  | 'originCity'
  | 'destinationCountry'
  | 'destinationPostalCode'
  | 'destinationCity'
  | 'transactionType'
  | 'identityType'
  | 'shipmentType'
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
  jordan_passport_service: ['transactionType', 'identityType'],
  international_driving_license: ['serviceType'],
  no_objection_service: ['serviceType'],
  no_objection_fees: [],
  branch_info: [],
  working_hours: [],
  general: [],
    local_delivery: ['originCity', 'destinationCity'],
};

const SHORT_GENERIC_FOLLOW_UP_TERMS = [
  'الرسوم',
  'تكلفة',
  'التكلفة',
  'السعر',
  'المتطلبات',
  'الاوراق',
  'الأوراق',
  'المدة',
  'كيف',
  'وين',
  'نعم',
  'تمام',
  'fees',
  'cost',
  'price',
  'requirements',
  'documents',
  'duration',
  'how',
  'where',
  'yes',
  'ok',
];

const QUICKRATE_FALLBACK_AR = 'لا يتوفر سعر مؤكد لهذه الشحنة ضمن البيانات الحالية.';
const LOCAL_DELIVERY_FALLBACK_AR = (originCity: string, destinationCity: string): string => {
  const origin = originCity || 'المدينة المحددة';
  const destination = destinationCity || 'المدينة المحددة';
  return `لا تتوفر لدينا تكلفة مؤكدة للتوصيل المحلي بين ${origin} و${destination} ضمن البيانات الحالية.\nيمكنك مراجعة صفحة التواصل في موقع واصل للحصول على مزيد من المساعدة.`;
};

const PALESTINIAN_CITY_ALIASES: Record<string, string[]> = {
  'رام الله': ['رام الله', 'رامالله', 'ramallah'],
  نابلس: ['نابلس', 'nablus'],
  الخليل: ['الخليل', 'hebron'],
  'بيت لحم': ['بيت لحم', 'بيتلحم', 'bethlehem'],
  جنين: ['جنين', 'jenin'],
  طولكرم: ['طولكرم', 'tulkarm'],
  قلقيلية: ['قلقيلية', 'qalqilya', 'qalqilia'],
  أريحا: ['أريحا', 'اريحا', 'jericho'],
  سلفيت: ['سلفيت', 'salfit'],
  طوباس: ['طوباس', 'tubas'],
  القدس: ['القدس', 'قدس', 'jerusalem'],
  غزة: ['غزة', 'gaza'],
};

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

  if (
    /\btrack|tracking|awb|shipment status\b/.test(normalized) ||
    /(تتبع|تتبع الشحنة|رقم تتبع|حالة الشحنة)/.test(query)
  ) {
    return 'shipment_tracking';
  }

  const hasShippingCue =
    /\bship|shipping|parcel|package|envelope|delivery|courier\b/.test(normalized)
    || /(شحن|طرد|مغلف|مظروف|شحنة|توصيل|ارسال|إرسال)/.test(query);
  const hasQuoteCue =
    /\bquote|rate|price|cost|shipping price|shipping rate\b/.test(normalized)
    || /(سعر|تكلفة|رسوم|تسعيرة)/.test(query);
  const hasWeightCue = /(\d+(?:\.\d+)?)\s?(kg|كيلو|كغم)/i.test(query);
  const hasDestinationCue = /\bto\s+[\w\s]{2,}/i.test(query) || /(الى|إلى|رايح|وجهة|من\s+.+\s+ل)/.test(query);

  const route = extractLocalRoute(query);
  if (hasShippingCue && route.originCity && route.destinationCity) {
    return 'local_delivery';
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

function isExplicitIntentStarter(query: string): boolean {
  const normalized = query.toLowerCase();
  return /\b(i want to ship|ship to|track|where is branch|branch location|passport cost|working hours)\b/.test(normalized)
    || /(بدي\s*اشحن|بدي\s*أشحن|وين\s*فرع|بدي\s*أتتبع|بدي\s*اتتبع|كم\s*تكلفة\s*جواز|شو\s*دوامكم)/.test(query);
}

function normalizeForFollowUp(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[؟?.,!؛:\-_/\\()\[\]{}"'`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isShortGenericFollowUp(query: string): boolean {
  const normalized = normalizeForFollowUp(query);
  if (!normalized) {
    return false;
  }

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length > 3) {
    return false;
  }

  return SHORT_GENERIC_FOLLOW_UP_TERMS.includes(normalized)
    || tokens.every((token) => SHORT_GENERIC_FOLLOW_UP_TERMS.includes(token));
}

function isFeesLikeFollowUp(query: string): boolean {
  const normalized = normalizeForFollowUp(query);
  return /(رسوم|الرسوم|تكلفة|التكلفة|سعر|السعر|fees|cost|price)/i.test(normalized);
}

function resolveIntentWithCarryover(
  query: string,
  detectedIntent: IntentKey,
  activeIntent: IntentKey,
): IntentKey {
  if (isShortGenericFollowUp(query) && activeIntent !== 'general' && !isClearlyNewRequest(query)) {
    if (activeIntent === 'no_objection_service' && isFeesLikeFollowUp(query)) {
      return 'no_objection_fees';
    }
    return activeIntent;
  }

  if (detectedIntent === 'general' && activeIntent !== 'general' && !isClearlyNewRequest(query)) {
    return activeIntent;
  }

  return detectedIntent;
}

function getBaseIntent(intent: IntentKey): IntentKey {
  if (intent === 'no_objection_fees') {
    return 'no_objection_service';
  }
  return intent;
}

function extractJordanPassportSlots(query: string): Partial<Record<IntentFieldKey, string>> {
  const fields: Partial<Record<IntentFieldKey, string>> = {};
  const normalized = normalizeForFollowUp(query);

  if (/(اصدار|إصدار|issuance|issue|new passport)/i.test(normalized)) {
    fields.transactionType = 'issuance';
  } else if (/(تجديد|renewal|renew)/i.test(normalized)) {
    fields.transactionType = 'renewal';
  }

  if (/(خضرا|خضراء|هوية خضراء|green)/i.test(normalized)) {
    fields.identityType = 'green';
  } else if (/(زرقا|زرقاء|هوية زرقاء|مقدسي|مقدسية|maqdisi|blue)/i.test(normalized)) {
    fields.identityType = 'blue';
  }

  return fields;
}

function buildJordanPassportFinalAnswer(
  knownFields: Partial<Record<IntentFieldKey, string>>,
  isArabic: boolean,
): string {
  const transactionType = (knownFields.transactionType ?? '').trim().toLowerCase();
  const identityType = (knownFields.identityType ?? '').trim().toLowerCase();

  const feeAr = identityType === 'blue'
    ? '120 دينار أردني.'
    : '270 دينار أردني.';

  if (isArabic) {
    const transactionLabel = transactionType === 'issuance' ? 'إصدار' : (transactionType === 'renewal' ? 'تجديد' : 'المعاملة المطلوبة');
    const identityLabel = identityType === 'green' ? 'خضراء' : (identityType === 'blue' ? 'زرقاء / مقدسية' : 'غير محددة');

    return [
      `تمام، بما أن معاملتك ${transactionLabel} وهويتك ${identityLabel}، فهذه تفاصيل الخدمة:`,
      '',
      `- الرسوم: ${feeAr}`,
      '- يجب أولاً تقديم معاملة الإصدار في دائرة الأحوال المدنية الأردنية في الأردن والحصول على بطاقة مراجعة.',
      '- بعد الحصول على بطاقة المراجعة، يتم إرسال صورة البطاقة عبر القناة المعتمدة.',
      '- بعد الموافقة، يتم الحضور إلى أحد فروع واصل لتسليم بطاقة المراجعة الأصلية ودفع الرسوم.',
      '- مدة الإنجاز: من 7 إلى 10 أيام عمل من تاريخ تقديم بطاقة المراجعة في مكاتب واصل.',
      '- استلام الجواز يكون من مركز واصل للخدمات الأردنية - كيو سنتر روابي فقط، بعد وصول رسالة نصية لصاحب العلاقة.',
      '',
      'يشترط توفر بطاقة مراجعة، وأي معاملة بدون بطاقة مراجعة غير متاحة من خلال واصل.',
      '',
      'ملاحظة: الاستلام يكون حصرياً لصاحب العلاقة أو قريب درجة أولى فقط: الأب، الأم، الأخ، الأخت، الابن، الابنة، الزوج، أو الزوجة.',
    ].join('\n');
  }

  const feeEn = identityType === 'blue' ? '120 JOD.' : '270 JOD.';
  return [
    'Jordan passport service details:',
    `- Fee: ${feeEn}`,
    '- You must first submit the issuance transaction at the Jordan Civil Status Department in Jordan and obtain a review card.',
    '- After obtaining the review card, send its copy through the approved channel.',
    '- After approval, visit a Wassel branch with the original review card and pay the fees.',
    '- Processing time: 7 to 10 business days after submitting the original review card at Wassel offices.',
    '- Passport pickup is only from Wassel Jordanian Services Center - Q Center Rawabi, after SMS notification.',
    '- A review card is mandatory; requests without a review card are not available through Wassel.',
    '- Pickup is only by the applicant or first-degree relatives: father, mother, brother, sister, son, daughter, husband, wife.',
  ].join('\n');
}

function extractIntentFields(query: string): Partial<Record<IntentFieldKey, string>> {
  const fields: Partial<Record<IntentFieldKey, string>> = {};
  const passportSlots = extractJordanPassportSlots(query);

  if (passportSlots.transactionType) {
    fields.transactionType = passportSlots.transactionType;
  }
  if (passportSlots.identityType) {
    fields.identityType = passportSlots.identityType;
  }

  const route = extractLocalRoute(query);
  if (route.originCity) {
    fields.originCity = route.originCity;
  }
  if (route.destinationCity) {
    fields.destinationCity = route.destinationCity;
  }

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

  if (/(طرد|parcel|package|box)/i.test(query)) {
    fields.shipmentType = 'parcel';
  } else if (/(مغلف|مظروف|document|envelope)/i.test(query)) {
    fields.shipmentType = 'envelope';
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

function getPalestinianCityMentions(query: string): Array<{ city: string; index: number }> {
  const normalized = query.toLowerCase();
  const mentions: Array<{ city: string; index: number }> = [];

  for (const [city, aliases] of Object.entries(PALESTINIAN_CITY_ALIASES)) {
    let minIndex = -1;
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias.toLowerCase());
      if (idx >= 0 && (minIndex === -1 || idx < minIndex)) {
        minIndex = idx;
      }
    }
    if (minIndex >= 0) {
      mentions.push({ city, index: minIndex });
    }
  }

  return mentions.sort((a, b) => a.index - b.index);
}

function extractLocalRoute(query: string): { originCity?: string; destinationCity?: string } {
  const mentions = getPalestinianCityMentions(query);
  if (mentions.length >= 2) {
    return {
      originCity: mentions[0].city,
      destinationCity: mentions[1].city,
    };
  }
  return {};
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
  if (intent === 'local_delivery') {
    const missing: IntentFieldKey[] = [];
    if (!(knownFields.originCity ?? '').trim()) {
      missing.push('originCity');
    }
    if (!(knownFields.destinationCity ?? '').trim()) {
      missing.push('destinationCity');
    }
    return missing;
  }

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

async function fetchLocalDeliveryQuote(
  knownFields: Partial<Record<IntentFieldKey, string>>,
): Promise<{ price: number; currency: string } | null> {
  const originCity = (knownFields.originCity ?? '').trim();
  const destinationCity = (knownFields.destinationCity ?? '').trim();
  if (!originCity || !destinationCity) {
    return null;
  }

  const payload = {
    originCity,
    destinationCity,
    shipmentType: (knownFields.shipmentType ?? knownFields.packageType ?? '').trim() || undefined,
  };

  const candidateUrls = [
    `${env.QUICKRATE_BASE_URL}/api/external/local-delivery/quotes`,
    `${env.QUICKRATE_BASE_URL}/api/external/domestic/shipping/quotes`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.QUICKRATE_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json().catch(() => ({})) as {
        price?: number | string;
        currency?: string;
        quote?: { price?: number | string; currency?: string };
        quotes?: Array<{ price?: number | string; currency?: string }>;
      };

      let selectedPrice = Number(data.price);
      let selectedCurrency = data.currency;

      if (!Number.isFinite(selectedPrice) && data.quote) {
        selectedPrice = Number(data.quote.price);
        selectedCurrency = data.quote.currency ?? selectedCurrency;
      }

      if (!Number.isFinite(selectedPrice) && Array.isArray(data.quotes) && data.quotes.length > 0) {
        const valid = data.quotes
          .map((q) => ({ price: Number(q.price), currency: q.currency }))
          .filter((q) => Number.isFinite(q.price));
        if (valid.length > 0) {
          const lowest = valid.reduce((best, cur) => (cur.price < best.price ? cur : best));
          selectedPrice = lowest.price;
          selectedCurrency = lowest.currency;
        }
      }

      if (Number.isFinite(selectedPrice)) {
        return {
          price: selectedPrice,
          currency: typeof selectedCurrency === 'string' && selectedCurrency.trim() ? selectedCurrency.trim() : 'ILS',
        };
      }
    } catch {
      // try next candidate endpoint
    }
  }

  return null;
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
    originCity: {
      en: 'Please share the pickup city to continue.',
      ar: 'يرجى تزويدنا بمدينة الانطلاق للمتابعة.',
    },
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
    transactionType: {
      en: 'Is the passport request issuance or renewal?',
      ar: 'هل المعاملة إصدار أم تجديد؟',
    },
    identityType: {
      en: 'Is the identity green or blue/Maqdisi?',
      ar: 'هل الهوية خضراء أم زرقاء/مقدسية؟',
    },
    shipmentType: {
      en: 'Please share shipment type (parcel or envelope).',
      ar: 'يرجى تحديد نوع الشحنة (طرد أو مغلف).',
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
    local_delivery: {
      en: 'This helps us check local delivery pricing between cities.',
      ar: 'هذا يساعدنا على التحقق من تكلفة التوصيل المحلي بين المدن.',
    },
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
    no_objection_fees: {
      en: '',
      ar: '',
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

  if (intent === 'local_delivery') {
    const localFieldLabels: Record<IntentFieldKey, { en: string; ar: string }> = {
      originCity: { en: 'Origin city', ar: 'مدينة الانطلاق' },
      destinationCity: { en: 'Destination city', ar: 'مدينة الوجهة' },
      transactionType: { en: 'Transaction type', ar: 'نوع المعاملة' },
      identityType: { en: 'Identity type', ar: 'نوع الهوية' },
      shipmentType: { en: 'Shipment type', ar: 'نوع الشحنة' },
      destinationCountry: { en: 'Destination country', ar: 'الدولة الوجهة' },
      destinationPostalCode: { en: 'Destination postal code', ar: 'الرمز البريدي' },
      shipmentWeight: { en: 'Shipment weight', ar: 'وزن الشحنة' },
      shipmentContent: { en: 'Shipment content', ar: 'محتوى الشحنة' },
      packageType: { en: 'Package type', ar: 'نوع الطرد' },
      packagingPreference: { en: 'Packaging preference', ar: 'تفضيل التغليف' },
      trackingNumber: { en: 'Tracking number', ar: 'رقم التتبع' },
      serviceType: { en: 'Service type', ar: 'نوع الخدمة' },
    };

    const lines = missingFields
      .map((field, index) => `${index + 1}. ${isArabic ? localFieldLabels[field].ar : localFieldLabels[field].en}`)
      .join('\n');

    return isArabic
      ? `حتى نتمكن من التحقق من تكلفة التوصيل المحلي، يرجى تزويدنا بـ:\n${lines}`
      : `To check local delivery cost, please share:\n${lines}`;
  }

  if (intent === 'shipping_quote') {
    return isArabic
      ? 'يرجى تزويدنا بالدولة أو المدينة الوجهة، وزن الطرد، ومحتوى الطرد'
      : 'Please share destination country or city, shipment weight, and shipment content.';
  }

  if (intent === 'jordan_passport_service') {
    if (missingFields.includes('transactionType')) {
      return isArabic ? 'هل المعاملة إصدار أم تجديد؟' : 'Is the passport request issuance or renewal?';
    }
    if (missingFields.includes('identityType')) {
      return isArabic ? 'هل الهوية خضراء أم زرقاء/مقدسية؟' : 'Is the identity green or blue/Maqdisi?';
    }
  }

  const base = isArabic ? fieldPrompts[primaryField].ar : fieldPrompts[primaryField].en;
  const suffix = isArabic ? intentSuffix.ar : intentSuffix.en;
  return suffix ? `${base} ${suffix}` : base;
}

function buildInsufficientInfoFinalAnswer(intent: IntentKey, isArabic: boolean): string {
    if (intent === 'local_delivery') {
      return isArabic
        ? 'حسب المعلومات المتوفرة لدينا حالياً، لا يمكن تأكيد تكلفة التوصيل المحلي ضمن البيانات الحالية.'
        : 'Based on the currently available information, we cannot confirm local delivery cost.';
    }
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
    local_delivery: {
      en: ['Local delivery', 'Pickup request', 'Branch support'],
      ar: ['التوصيل المحلي', 'طلب استلام', 'الدعم عبر الفروع'],
    },
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
    no_objection_fees: {
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
  const upstream = await fetch(
    `http://external.wassel.ps:4040/api/GetAwbDetails?Awbs=${encodeURIComponent(trackingId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from('ramallah_admin:Mo@2020!').toString('base64'),
      },
    }
  );

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

async function callAgentWithApiKey(prompt: string): Promise<string> {
  const base = env.AI_PROJECT_ENDPOINT.replace(/\/$/, '');
  const url = `${base}/openai/v1/responses`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.AI_PROJECT_API_KEY,
    },
    body: JSON.stringify({
      input: prompt,
      agent_reference: {
        name: env.AI_AGENT_NAME,
        version: env.AI_AGENT_VERSION,
        type: 'agent_reference',
      },
    }),
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

  const resolvedIntent = resolveIntentWithCarryover(query, detectedIntent, conversation.activeIntent);
  const resolvedBaseIntent = getBaseIntent(resolvedIntent);

  if (isClearlyNewRequest(query) || isExplicitIntentStarter(query) || conversation.activeIntent === 'general') {
    conversation.activeIntent = resolvedBaseIntent;
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

  if (resolvedIntent === 'no_objection_fees') {
    intentState.completed = true;
    return {
      answer: 'لا تتوفر لدينا تفاصيل مؤكدة حول رسوم خدمة عدم الممانعة ضمن البيانات الحالية.',
      relatedTopics: buildIntentRelatedTopics('no_objection_service', true),
    };
  }

  if (resolvedIntent === 'jordan_passport_service') {
    intentState.completed = true;
    return {
      answer: buildJordanPassportFinalAnswer(intentState.knownFields, isArabic),
      relatedTopics: buildIntentRelatedTopics(resolvedIntent, isArabic),
    };
  }

  if (resolvedIntent === 'local_delivery') {
    const localQuote = await fetchLocalDeliveryQuote(intentState.knownFields);
    intentState.completed = true;

    const originCity = (intentState.knownFields.originCity ?? '').trim();
    const destinationCity = (intentState.knownFields.destinationCity ?? '').trim();

    if (!localQuote) {
      return {
        answer: LOCAL_DELIVERY_FALLBACK_AR(originCity, destinationCity),
        relatedTopics: buildIntentRelatedTopics(resolvedIntent, true),
      };
    }

    const shipmentType = (intentState.knownFields.shipmentType ?? '').trim();

    return {
      answer: [
        'عرض تكلفة توصيل محلي:',
        `من: ${originCity}`,
        `إلى: ${destinationCity}`,
        shipmentType ? `نوع الشحنة: ${shipmentType}` : '',
        `السعر المبدئي: ${localQuote.price.toFixed(2)} ${localQuote.currency}`,
      ].filter(Boolean).join('\n'),
      relatedTopics: buildIntentRelatedTopics(resolvedIntent, true),
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
    let outputText = '';

    if (env.AI_PROJECT_API_KEY) {
      outputText = await callAgentWithApiKey(prompt);
    } else {
      const projectClient = new AIProjectClient(env.AI_PROJECT_ENDPOINT, new DefaultAzureCredential());
      const openAIClient = projectClient.getOpenAIClient();

      const conversation = await openAIClient.conversations.create({
        items: [{ type: 'message', role: 'user', content: prompt }],
      });

      const response = await openAIClient.responses.create(
        { conversation: conversation.id },
        {
          body: {
            agent: {
              name: env.AI_AGENT_NAME,
              version: env.AI_AGENT_VERSION,
              type: 'agent_reference',
            },
          },
        }
      );

      outputText = extractOutputText(response);
    }

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
