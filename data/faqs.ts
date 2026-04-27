import { Language } from '../types';

export interface FAQItem {
  q: { en: string; ar: string };
  a: { en: string; ar: string };
}

export interface FAQCollection {
  [key: string]: FAQItem[];
}

export const FAQ_DATA: FAQCollection = {
  // --- GENERAL RESOURCES ---
  'general': [
    {
      q: { en: 'How do I track my shipment?', ar: 'كيف أتتبع شحنتي؟' },
      a: { en: 'You can track your shipment using the tracking number provided on your receipt via the tracking bar on the homepage.', ar: 'يمكنك تتبع شحنتك باستخدام رقم التتبع الموجود على إيصالك عبر شريط التتبع في الصفحة الرئيسية.' }
    },
    {
      q: { en: 'What are the working hours?', ar: 'ما هي ساعات العمل؟' },
      a: { en: 'Our main branches operate Sunday to Thursday, 8:00 AM to 4:30 PM.', ar: 'تعمل فروعنا الرئيسية من الأحد إلى الخميس، من الساعة 8:00 صباحاً حتى 4:30 مساءً.' }
    }
  ],

  // --- INDIVIDUAL SERVICES ---
  'service-domestic': [
    {
      q: { en: 'How long does domestic delivery take?', ar: 'كم يستغرق التوصيل المحلي؟' },
      a: { en: 'Domestic shipments are typically delivered within 24-48 hours depending on the city.', ar: 'يتم توصيل الشحنات المحلية عادةً خلال 24-48 ساعة حسب المدينة.' }
    },
    {
      q: { en: 'Is Cash on Delivery available?', ar: 'هل تتوفر خدمة الدفع عند الاستلام؟' },
      a: { en: 'Yes, we offer Cash on Delivery (COD) services for all domestic shipments.', ar: 'نعم، نوفر خدمة الدفع عند الاستلام لجميع الشحنات المحلية.' }
    }
  ],
  'service-express': [
    {
      q: { en: 'Which carriers do you use?', ar: 'من هم شركات النقل التي تتعاملون معها؟' },
      a: { en: 'We partner with global leaders like DHL and FedEx to ensure the fastest routes.', ar: 'نحن نتشارك مع قادة عالميين مثل DHL و FedEx لضمان أسرع المسارات.' }
    },
    {
      q: { en: 'What is volumetric weight?', ar: 'ما هو الوزن الحجمي؟' },
      a: { en: 'Volumetric weight is calculated as (Length x Width x Height) / 5000. Charges apply to the higher of actual or volumetric weight.', ar: 'يتم حساب الوزن الحجمي بالمعادلة (الطول × العرض × الارتفاع) / 5000. يتم تطبيق الرسوم على الوزن الأعلى بين الفعلي والحجمي.' }
    }
  ],
  'service-clearance': [
    {
      q: { en: 'What documents are required for clearance?', ar: 'ما هي المستندات المطلوبة للتخليص؟' },
      a: { en: 'Typically, a commercial invoice, packing list, and certificate of origin are required.', ar: 'عادةً ما تكون الفاتورة التجارية، وقائمة التعبئة، وشهادة المنشأ مطلوبة.' }
    },
    {
      q: { en: 'Can I track my customs file status?', ar: 'هل يمكنني تتبع حالة الملف الجمركي؟' },
      a: { en: 'Yes, use the "Customs File Number" in our tracking tool to see real-time updates.', ar: 'نعم، استخدم "رقم الملف الجمركي" في أداة التتبع لرؤية التحديثات الفورية.' }
    }
  ],
  'service-shop': [
    {
      q: { en: 'Do I need a subscription?', ar: 'هل أحتاج إلى اشتراك؟' },
      a: { en: 'Registration is free. You only pay for the shipping costs of your items.', ar: 'التسجيل مجاني. تدفع فقط تكاليف شحن مشترياتك.' }
    },
    {
      q: { en: 'Which countries do you have addresses in?', ar: 'ما هي الدول التي لديكم عناوين فيها؟' },
      a: { en: 'We provide addresses in the USA, UK, UAE, Turkey, and China.', ar: 'نوفر عناوين في الولايات المتحدة، المملكة المتحدة، الإمارات، تركيا، والصين.' }
    }
  ],
  'service-idp': [
    {
      q: { en: 'How long is the IDP valid for?', ar: 'ما هي مدة صلاحية الرخصة الدولية؟' },
      a: { en: 'You can choose between a 1-year or 3-year validity period.', ar: 'يمكنك الاختيار بين فترة صلاحية لمدة سنة واحدة أو 3 سنوات.' }
    },
    {
      q: { en: 'Is it accepted everywhere?', ar: 'هل هي مقبولة في كل مكان؟' },
      a: { en: 'It is accepted in over 150 countries worldwide as a valid translation of your local license.', ar: 'مقبولة في أكثر من 150 دولة حول العالم كترجمة معتمدة لرخصتك المحلية.' }
    }
  ],
  'service-jordanian': [
    {
      q: { en: 'Do you handle renewals?', ar: 'هل تقومون بمعاملات التجديد؟' },
      a: { en: 'Yes, we handle both new issuances and renewals for Jordanian passports.', ar: 'نعم، نتولى إصدار الجوازات الجديدة وتجديدها.' }
    },
    {
      q: { en: 'How long does the process take?', ar: 'كم تستغرق العملية؟' },
      a: { en: 'Timelines vary by case, but generally take 10-14 working days.', ar: 'تختلف الجداول الزمنية حسب الحالة، ولكن تستغرق عموماً 10-14 يوم عمل.' }
    }
  ],
  'service-pick-pack': [
    {
      q: { en: 'Do you provide the packaging materials?', ar: 'هل توفرون مواد التغليف؟' },
      a: { en: 'Yes, we provide a variety of high-quality boxes, bubble wrap, and protective materials suited for all item types.', ar: 'نعم، نوفر مجموعة متنوعة من الصناديق عالية الجودة، وتغليف الفقاعات، ومواد الحماية المناسبة لجميع أنواع العناصر.' }
    },
    {
      q: { en: 'Can you pack fragile items like glassware?', ar: 'هل يمكنكم تغليف العناصر القابلة للكسر مثل الزجاج؟' },
      a: { en: 'Absolutely. We have specialized "Fragile" packing protocols using double-boxing and cushioning materials.', ar: 'بالتأكيد. لدينا بروتوكولات تغليف "قابلة للكسر" متخصصة تستخدم الصناديق المزدوجة ومواد التبطين.' }
    }
  ],

  // --- CORPORATE SERVICES ---
  'service-corp-daily': [
    {
      q: { en: 'Can we customize pickup times?', ar: 'هل يمكن تخصيص أوقات الاستلام؟' },
      a: { en: 'Yes, corporate contracts allow for specific fixed daily pickup and delivery windows.', ar: 'نعم، تتيح عقود الشركات تحديد نوافذ زمنية ثابتة للاستلام والتوصيل يومياً.' }
    }
  ],
  'service-corp-signing': [
    {
      q: { en: 'is ID verification included?', ar: 'هل يتم التحقق من الهوية؟' },
      a: { en: 'Yes, our couriers verify the signer\'s ID before allowing them to sign the document.', ar: 'نعم، يقوم مندوبونا بالتحقق من هوية الموقع قبل السماح له بتوقيع المستند.' }
    }
  ],
  'service-corp-bulk': [
    {
      q: { en: 'What is the minimum quantity for bulk mail?', ar: 'ما هو الحد الأدنى للبريد الشامل؟' },
      a: { en: 'Bulk rates typically apply for batches of 50+ items distributed to the same zone.', ar: 'تطبق أسعار الجملة عادةً على الدفعات المكونة من 50 عنصراً أو أكثر يتم توزيعها في نفس المنطقة.' }
    }
  ],
  'service-corp-storage': [
    {
      q: { en: 'Is the storage insurance covered?', ar: 'هل التخزين مغطى بالتأمين؟' },
      a: { en: 'Basic liability is included, but comprehensive insurance for high-value goods can be arranged.', ar: 'يتم تضمين المسؤولية الأساسية، ولكن يمكن ترتيب تأمين شامل للبضائع عالية القيمة.' }
    }
  ],
  'service-corp-warehousing': [
    {
      q: { en: 'Can you integrate with Shopify?', ar: 'هل يمكن الربط مع شوبيفاي؟' },
      a: { en: 'Yes, our WMS (Warehouse Management System) integrates with major e-commerce platforms via API.', ar: 'نعم، يتكامل نظام إدارة المستودعات لدينا مع منصات التجارة الإلكترونية الرئيسية عبر API.' }
    }
  ],
  'service-corp-freight': [
    {
      q: { en: 'Do you handle permits for oversized loads?', ar: 'هل تتعاملون مع تصاريح الحمولات الزائدة؟' },
      a: { en: 'Yes, our team handles all necessary road permits and police escorts if required.', ar: 'نعم، يتولى فريقنا جميع تصاريح الطرق اللازمة ومرافقات الشرطة إذا لزم الأمر.' }
    }
  ],

  // --- INDUSTRIES ---
  'banking': [
    {
      q: { en: 'How secure is the transport?', ar: 'ما مدى أمان النقل؟' },
      a: { en: 'We use armored vehicles with GPS tracking and vetted security personnel for sensitive banking assets.', ar: 'نستخدم مركبات مصفحة مع تتبع GPS وأفراد أمن تم فحصهم للأصول المصرفية الحساسة.' }
    },
    {
      q: { en: 'Do you deliver credit cards to customers?', ar: 'هل تقومون بتوصيل البطاقات للعملاء؟' },
      a: { en: 'Yes, with strict ID verification protocols upon delivery.', ar: 'نعم، مع بروتوكولات صارمة للتحقق من الهوية عند التسليم.' }
    }
  ],
  'healthcare': [
    {
      q: { en: 'Do you have refrigerated vehicles?', ar: 'هل لديكم مركبات مبردة؟' },
      a: { en: 'Yes, our pharma fleet is temperature-controlled (2-8°C) and monitored in real-time.', ar: 'نعم، أسطول الأدوية لدينا يتم التحكم في درجة حرارته (2-8 درجات مئوية) ومراقبته في الوقت الفعلي.' }
    }
  ],
  'ecommerce': [
    {
      q: { en: 'How fast is COD remittance?', ar: 'ما سرعة تحويل مبالغ الدفع عند الاستلام؟' },
      a: { en: 'We typically remit collected cash to merchants on a weekly basis.', ar: 'نقوم عادةً بتحويل المبالغ النقدية المحصلة للتجار بشكل أسبوعي.' }
    }
  ],
  'govt': [
    {
      q: { en: 'Is data confidential?', ar: 'هل البيانات سرية؟' },
      a: { en: 'Absolutely. We adhere to strict data privacy laws and government security protocols.', ar: 'بالتأكيد. نحن نلتزم بقوانين خصوصية البيانات الصارمة والبروتوكولات الأمنية الحكومية.' }
    }
  ],
  'manufacturing': [
    {
      q: { en: 'Can you handle raw material imports?', ar: 'هل يمكنكم التعامل مع استيراد المواد الخام؟' },
      a: { en: 'Yes, we handle freight forwarding and customs clearance for bulk raw materials.', ar: 'نعم، نتولى الشحن والتخليص الجمركي للمواد الخام بكميات كبيرة.' }
    }
  ],
  'tech': [
    {
      q: { en: 'Do you insure high-value electronics?', ar: 'هل تؤمنون على الإلكترونيات عالية القيمة؟' },
      a: { en: 'Yes, we offer specialized insurance coverage for high-value tech shipments.', ar: 'نعم، نقدم تغطية تأمينية متخصصة لشحنات التكنولوجيا عالية القيمة.' }
    }
  ],
  'legal': [
    {
      q: { en: 'Do you offer proof of delivery for courts?', ar: 'هل تقدمون إثبات تسليم للمحاكم؟' },
      a: { en: 'Yes, we provide legal-grade proof of delivery including stamped receipts.', ar: 'نعم، نقدم إثبات تسليم قانوني يشمل الإيصالات المختومة.' }
    }
  ],
  'aviation': [
    {
      q: { en: 'Is AOG service available 24/7?', ar: 'هل خدمة AOG متاحة 24/7؟' },
      a: { en: 'Yes, our Aviation desk operates 24/7 to handle critical aircraft parts immediately.', ar: 'نعم، يعمل مكتب الطيران لدينا على مدار الساعة طوال أيام الأسبوع للتعامل مع قطع غيار الطائرات الحرجة فوراً.' }
    }
  ],
  'education': [
    {
      q: { en: 'Can you distribute books to student homes?', ar: 'هل يمكنكم توزيع الكتب لمنازل الطلاب؟' },
      a: { en: 'Yes, we have extensive experience distributing materials directly to students nationwide.', ar: 'نعم، لدينا خبرة واسعة في توزيع المواد مباشرة للطلاب في جميع أنحاء البلاد.' }
    }
  ]
};
