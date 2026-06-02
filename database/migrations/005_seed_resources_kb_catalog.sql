SET NOCOUNT ON;

PRINT '=== Seeding resources KB catalog ===';

DECLARE @Topics TABLE (
  code NVARCHAR(100) NOT NULL,
  is_active BIT NOT NULL,
  name_ar NVARCHAR(500) NOT NULL,
  desc_ar NVARCHAR(2000) NULL,
  name_en NVARCHAR(500) NOT NULL,
  desc_en NVARCHAR(2000) NULL
);

INSERT INTO @Topics (code, is_active, name_ar, desc_ar, name_en, desc_en)
VALUES
  (N'SERVICES', 1, N'الخدمات', N'تعرّف على جميع خدمات الشحن والخدمات اللوجستية المتاحة للأفراد والشركات.', N'Services', N'Explore shipping and logistics services for individuals and businesses.'),
  (N'SHIPPING_GUIDES', 1, N'أدلة الشحن', N'أدلة عملية تساعد العميل على تجهيز الشحنة وطلب الخدمة بالشكل الصحيح.', N'Shipping Guides', N'Practical guides for preparing shipments and using the service correctly.'),
  (N'TRACKING_STATUS', 1, N'التتبع وحالة الشحنة', N'شرح لحالات التتبع وكيفية متابعة الشحنة من الإنشاء حتى التسليم.', N'Tracking and Shipment Status', N'Explanations of shipment statuses and how to track the shipment.'),
  (N'PACKAGING', 1, N'التغليف', N'إرشادات تغليف الشحنات بطريقة آمنة تقلل من فرص التلف أثناء النقل.', N'Packaging', N'Packaging guidance for safer handling and reduced transit damage.'),
  (N'PROHIBITED_ITEMS', 1, N'المواد المحظورة والمقيدة', N'معلومات حول المواد الممنوعة أو المقيدة محلياً ودولياً.', N'Prohibited and Restricted Items', N'Information about locally and internationally prohibited or restricted items.'),
  (N'CUSTOMS_CLEARANCE', 1, N'اللوائح الجمركية والتخليص', N'متطلبات التخليص الجمركي والوثائق والرسوم ذات الصلة بالشحنات.', N'Customs and Clearance', N'Customs clearance requirements, documents, and related duties.'),
  (N'ACCOUNTS_PAYMENTS', 1, N'الحسابات والدفع', N'معلومات عن الحسابات التجارية، الفواتير، وطرق الدفع والتحصيل.', N'Accounts and Payments', N'Information about business accounts, invoices, and payment methods.'),
  (N'POLICIES_TERMS', 1, N'السياسات والشروط', N'سياسات التشغيل والاستخدام والالتزامات المتعلقة بخدمات واصل.', N'Policies and Terms', N'Operational policies, usage rules, and customer obligations.'),
  (N'COMPLAINTS_CLAIMS', 1, N'الشكاوى والمطالبات', N'إرشادات تقديم الشكاوى والمطالبات ومتابعتها.', N'Complaints and Claims', N'Guidance for filing complaints and compensation claims.'),
  (N'FORMS_DOWNLOADS', 1, N'النماذج والتنزيلات', N'النماذج والملفات المساندة التي يحتاجها العميل أثناء تقديم الطلبات.', N'Forms and Downloads', N'Forms and supporting files used during service requests.'),
  (N'COMPANIES_INDUSTRIES', 1, N'الشركات والقطاعات', N'محتوى موجّه لفئات العملاء والقطاعات المختلفة واحتياجاتها اللوجستية.', N'Companies and Industries', N'Content tailored to customer segments and industry logistics needs.'),
  (N'GENERAL_FAQS', 1, N'أسئلة عامة', N'إجابات سريعة على أكثر الأسئلة العامة شيوعاً لدى العملاء.', N'General Questions', N'Quick answers to common customer questions.');

INSERT INTO kb_topics (code, is_active)
SELECT src.code, src.is_active
FROM @Topics src
WHERE NOT EXISTS (
  SELECT 1 FROM kb_topics t WHERE t.code = src.code
);

INSERT INTO kb_topic_translations (topic_id, language_code, name, description)
SELECT t.id, N'ar', src.name_ar, src.desc_ar
FROM @Topics src
JOIN kb_topics t ON t.code = src.code
WHERE NOT EXISTS (
  SELECT 1 FROM kb_topic_translations tt
  WHERE tt.topic_id = t.id AND tt.language_code = N'ar'
);

INSERT INTO kb_topic_translations (topic_id, language_code, name, description)
SELECT t.id, N'en', src.name_en, src.desc_en
FROM @Topics src
JOIN kb_topics t ON t.code = src.code
WHERE NOT EXISTS (
  SELECT 1 FROM kb_topic_translations tt
  WHERE tt.topic_id = t.id AND tt.language_code = N'en'
);

DECLARE @Questions TABLE (
  topic_code NVARCHAR(100) NOT NULL,
  intent_key NVARCHAR(200) NOT NULL,
  priority INT NOT NULL,
  question_ar NVARCHAR(2000) NOT NULL,
  answer_ar NVARCHAR(MAX) NOT NULL
);

INSERT INTO @Questions (topic_code, intent_key, priority, question_ar, answer_ar)
VALUES
  (N'SERVICES', N'SERVICES_INTERNATIONAL_SHIPPING', 10, N'الشحن الدولي', N'معلومات مختصرة حول خدمة الشحن الدولي، وآلية استخدامها، والمتطلبات الأساسية المرتبطة بها.'),
  (N'SERVICES', N'SERVICES_LOCAL_SHIPPING', 10, N'الشحن المحلي', N'معلومات مختصرة حول خدمة الشحن المحلي، وآلية التوصيل داخل المناطق المحلية، وما يلزم لبدء الطلب.'),
  (N'SERVICES', N'SERVICES_HEAVY_CARGO', 9, N'الشحن الثقيل / Cargo', N'معلومات مختصرة حول خدمة الشحن الثقيل، وطبيعة الشحنات المناسبة لها، ومتطلبات التجهيز والنقل.'),
  (N'SERVICES', N'SERVICES_CUSTOMS_CLEARANCE', 9, N'التخليص الجمركي', N'معلومات مختصرة حول خدمة التخليص الجمركي، والوثائق المطلوبة، وآلية متابعة المعاملة.'),
  (N'SERVICES', N'SERVICES_NO_OBJECTION', 8, N'خدمة عدم الممانعة', N'معلومات مختصرة حول خدمة عدم الممانعة، والفئات المستفيدة، وآلية تقديم الطلب.'),
  (N'SERVICES', N'SERVICES_JORDANIAN_PASSPORTS', 8, N'خدمات الجوازات الأردنية', N'معلومات مختصرة حول خدمات الجوازات الأردنية، وخطوات الاستلام والتسليم، والمتطلبات الأساسية.'),
  (N'SERVICES', N'SERVICES_US_EMBASSY_PASSPORT_DELIVERY', 7, N'خدمة توصيل جوازات السفارة الأمريكية', N'معلومات مختصرة حول خدمة توصيل جوازات السفارة الأمريكية، وآلية الاستلام والتسليم.'),
  (N'SERVICES', N'SERVICES_STORAGE_3PL', 8, N'خدمات التخزين والـ 3PL', N'معلومات مختصرة حول خدمات التخزين والتشغيل اللوجستي وإدارة المخزون والتوزيع.'),
  (N'SERVICES', N'SERVICES_CUSTOMER_PICKUP', 8, N'خدمة الاستلام من العميل', N'معلومات مختصرة حول خدمة استلام الشحنة من موقع العميل وآلية تنسيق موعد الاستلام.'),
  (N'SERVICES', N'SERVICES_DOOR_DELIVERY', 8, N'خدمة التوصيل للباب', N'معلومات مختصرة حول خدمة التوصيل إلى عنوان المستلم النهائي وخيارات التسليم المتاحة.'),
  (N'SERVICES', N'SERVICES_COD', 8, N'خدمة الدفع عند الاستلام COD', N'معلومات مختصرة حول خدمة الدفع عند الاستلام، وآلية التحصيل، وتسوية المبالغ.'),
  (N'SERVICES', N'SERVICES_DOCUMENTS', 8, N'خدمة المستندات Documents', N'معلومات مختصرة حول خدمة شحن المستندات والملفات الرسمية ومتطلبات تجهيزها.'),
  (N'SERVICES', N'SERVICES_PACKAGES', 8, N'خدمة الطرود Packages', N'معلومات مختصرة حول خدمة شحن الطرود، والأوزان المناسبة، وخيارات النقل.'),
  (N'SERVICES', N'SERVICES_COMMERCIAL_GOODS', 8, N'خدمة البضائع التجارية', N'معلومات مختصرة حول خدمة نقل البضائع التجارية ومتطلبات الفواتير والوثائق المرتبطة بها.'),

  (N'POLICIES_TERMS', N'POLICIES_INTL_SHIPPING', 7, N'سياسة الشحن الدولي', N'توضيح مختصر لسياسة الشحن الدولي، ونطاق التطبيق، والاستثناءات ذات الصلة.'),
  (N'POLICIES_TERMS', N'POLICIES_LOCAL_SHIPPING', 7, N'سياسة الشحن المحلي', N'توضيح مختصر لسياسة الشحن المحلي، وشروط التوصيل داخل المناطق المستهدفة.'),
  (N'POLICIES_TERMS', N'POLICIES_PRICING_FEES', 7, N'سياسة الأسعار والرسوم', N'توضيح مختصر لآلية احتساب الأسعار والرسوم والعوامل التي تؤثر في التكلفة.'),
  (N'POLICIES_TERMS', N'POLICIES_PACKAGING', 7, N'سياسة التغليف', N'توضيح مختصر لمتطلبات التغليف المقبول ومسؤولية العميل عن تجهيز الشحنة.'),
  (N'POLICIES_TERMS', N'POLICIES_PROHIBITED_ITEMS', 7, N'سياسة المواد المحظورة', N'توضيح مختصر للمواد المحظورة أو المقيدة وآلية التعامل معها عند الفحص.'),
  (N'POLICIES_TERMS', N'POLICIES_LIABILITY_COMPENSATION', 7, N'سياسة المسؤولية والتعويض', N'توضيح مختصر لحدود المسؤولية وحالات التعويض والاشتراطات المرتبطة بها.'),
  (N'POLICIES_TERMS', N'POLICIES_COMPLAINTS', 7, N'سياسة تقديم الشكاوى', N'توضيح مختصر لخطوات تقديم الشكوى ومدد المتابعة والمعالجة.'),
  (N'POLICIES_TERMS', N'POLICIES_REFUNDS', 7, N'سياسة الاسترداد', N'توضيح مختصر لحالات الاسترداد المقبولة وآلية مراجعة الطلبات المالية.'),
  (N'POLICIES_TERMS', N'POLICIES_PAYMENTS_COLLECTION', 7, N'سياسة الدفع والتحصيل', N'توضيح مختصر لآليات الدفع والتحصيل والمتطلبات التنظيمية المرتبطة بها.'),
  (N'POLICIES_TERMS', N'POLICIES_BUSINESS_ACCOUNTS', 7, N'سياسة الحسابات التجارية', N'توضيح مختصر لشروط فتح وإدارة الحسابات التجارية والالتزامات المتعلقة بها.'),
  (N'POLICIES_TERMS', N'POLICIES_PRIVACY_DATA', 7, N'سياسة الخصوصية وحماية البيانات', N'توضيح مختصر لطريقة التعامل مع بيانات العملاء وحماية المعلومات الشخصية.'),
  (N'POLICIES_TERMS', N'POLICIES_TERMS_OF_USE', 7, N'شروط استخدام خدمات واصل', N'توضيح مختصر للشروط العامة المنظمة لاستخدام خدمات واصل.'),
  (N'POLICIES_TERMS', N'POLICIES_DELAY_NON_DELIVERY', 7, N'سياسة التأخير أو عدم التسليم', N'توضيح مختصر لحالات التأخير أو عدم التسليم وآلية المعالجة والمتابعة.'),
  (N'POLICIES_TERMS', N'POLICIES_INCORRECT_ADDRESS', 7, N'سياسة العناوين غير الصحيحة', N'توضيح مختصر لكيفية التعامل مع العناوين غير الصحيحة أو غير المكتملة.'),
  (N'POLICIES_TERMS', N'POLICIES_TEMP_STORAGE', 7, N'سياسة التخزين المؤقت للطرود', N'توضيح مختصر لشروط التخزين المؤقت ومدده والرسوم المحتملة المرتبطة به.'),

  (N'SHIPPING_GUIDES', N'GUIDES_START_SHIPPING_REQUEST', 8, N'كيف أبدأ طلب شحن؟', N'شرح مختصر للخطوات الأساسية التي يبدأ بها العميل طلب الشحن من أول إدخال البيانات حتى تأكيد الطلب.'),
  (N'SHIPPING_GUIDES', N'GUIDES_PREPARE_SHIPMENT', 8, N'خطوات تجهيز الشحنة', N'شرح مختصر لكيفية تجهيز الشحنة بشكل صحيح قبل التسليم أو الاستلام.'),
  (N'SHIPPING_GUIDES', N'GUIDES_DOCUMENTS_VS_PACKAGES', 8, N'الفرق بين شحن المستندات والطرود', N'شرح مختصر للفروق بين شحن المستندات وشحن الطرود من حيث المتطلبات والتعامل.'),
  (N'SHIPPING_GUIDES', N'GUIDES_VOLUMETRIC_WEIGHT', 8, N'كيفية حساب الوزن الحجمي', N'شرح مختصر لطريقة احتساب الوزن الحجمي وتأثيره على تسعير الشحنة.'),
  (N'SHIPPING_GUIDES', N'GUIDES_CHOOSE_SERVICE', 8, N'كيفية اختيار نوع الخدمة المناسبة', N'شرح مختصر يساعد العميل في اختيار الخدمة الأنسب حسب نوع الشحنة والوجهة والسرعة المطلوبة.'),
  (N'SHIPPING_GUIDES', N'GUIDES_TRACK_SHIPMENT', 8, N'كيفية تتبع الشحنة', N'شرح مختصر لطرق تتبع الشحنة وقراءة التحديثات الخاصة بها.'),
  (N'SHIPPING_GUIDES', N'GUIDES_PREPARE_INTL_SHIPMENT', 8, N'كيفية تجهيز شحنة دولية', N'شرح مختصر لتجهيز الشحنات الدولية من حيث الوثائق والتغليف والمتطلبات الأساسية.'),
  (N'SHIPPING_GUIDES', N'GUIDES_PREPARE_LOCAL_SHIPMENT', 8, N'كيفية تجهيز شحنة محلية', N'شرح مختصر لتجهيز الشحنات المحلية بشكل صحيح لتسريع عملية التوصيل.'),
  (N'SHIPPING_GUIDES', N'GUIDES_REQUEST_PICKUP', 8, N'كيفية طلب استلام من الموقع', N'شرح مختصر لطريقة طلب استلام الشحنة من موقع العميل وتنسيق الموعد.'),
  (N'SHIPPING_GUIDES', N'GUIDES_PRINT_AWB', 8, N'كيفية طباعة بوليصة الشحن', N'شرح مختصر لطريقة الحصول على بوليصة الشحن وتجهيزها للطباعة والاستخدام.'),
  (N'SHIPPING_GUIDES', N'GUIDES_ATTACH_DOCUMENTS', 8, N'كيفية إرفاق المستندات المطلوبة', N'شرح مختصر لطريقة إرفاق المستندات اللازمة مع الطلب أو مع الشحنة.'),
  (N'SHIPPING_GUIDES', N'GUIDES_DROP_OFF_BRANCH', 8, N'خطوات تسليم الشحنة للفرع', N'شرح مختصر لما يجب على العميل اتباعه عند تسليم الشحنة إلى الفرع.'),
  (N'SHIPPING_GUIDES', N'GUIDES_PICKUP_FROM_CUSTOMER', 8, N'خطوات الاستلام من العميل', N'شرح مختصر لإجراءات استلام الشحنة من العميل والتجهيز اللاحق لها.'),

  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_REQUIREMENTS', 8, N'متطلبات التخليص الجمركي', N'معلومات مختصرة حول المتطلبات الأساسية اللازمة لبدء التخليص الجمركي للشحنة.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_COMMERCIAL_INVOICE', 8, N'الفاتورة التجارية Commercial Invoice', N'معلومات مختصرة حول دور الفاتورة التجارية وأهميتها في المعاملة الجمركية.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_SHIPMENT_CONTENTS', 8, N'وصف محتويات الشحنة', N'معلومات مختصرة حول كيفية وصف محتويات الشحنة بطريقة صحيحة وواضحة.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_DECLARED_VALUE', 8, N'القيمة المصرّح عنها', N'معلومات مختصرة حول أهمية التصريح بالقيمة الصحيحة للشحنة وأثرها على الإجراءات الجمركية.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_DUTIES_TAXES', 8, N'الرسوم الجمركية والضرائب', N'معلومات مختصرة حول الرسوم الجمركية والضرائب وكيفية تقديرها بشكل عام.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_COMMERCIAL_SHIPMENTS', 8, N'الشحنات التجارية', N'معلومات مختصرة حول الشحنات التجارية ومتطلبات التوثيق والتخليص الخاصة بها.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_PERSONAL_SHIPMENTS', 8, N'الشحنات الشخصية', N'معلومات مختصرة حول الشحنات الشخصية وآلية التعامل معها في التخليص الجمركي.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_IMPORT_DOCS', 8, N'مستندات الاستيراد', N'معلومات مختصرة حول مستندات الاستيراد الأساسية المستخدمة في إجراءات التخليص.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_EXPORT_DOCS', 8, N'مستندات التصدير', N'معلومات مختصرة حول مستندات التصدير المطلوبة بحسب نوع الشحنة والوجهة.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_DELAY_REASONS', 8, N'أسباب تأخير التخليص', N'معلومات مختصرة حول أبرز أسباب تأخير التخليص الجمركي وكيفية تقليلها.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_EXTRA_DOC_COUNTRIES', 8, N'الدول التي تتطلب مستندات إضافية', N'معلومات مختصرة حول بعض الوجهات التي قد تتطلب وثائق إضافية قبل الشحن أو التخليص.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_PAY_DUTIES', 8, N'آلية دفع الرسوم الجمركية', N'معلومات مختصرة حول طريقة سداد الرسوم الجمركية والمسؤولية المالية المرتبطة بها.'),
  (N'CUSTOMS_CLEARANCE', N'CUSTOMS_CUSTOMER_RESPONSIBILITY', 8, N'مسؤولية العميل عن البيانات الجمركية', N'معلومات مختصرة حول مسؤولية العميل عن دقة البيانات الجمركية المرسلة مع الشحنة.'),

  (N'PACKAGING', N'PACKAGING_DOCUMENTS', 8, N'إرشادات تغليف المستندات', N'إرشادات مختصرة لتغليف المستندات بشكل يحافظ عليها أثناء النقل.'),
  (N'PACKAGING', N'PACKAGING_PACKAGES', 8, N'إرشادات تغليف الطرود', N'إرشادات مختصرة لتغليف الطرود بطريقة آمنة ومناسبة للشحن.'),
  (N'PACKAGING', N'PACKAGING_FRAGILE_ITEMS', 8, N'تغليف المواد القابلة للكسر', N'إرشادات مختصرة لتغليف المواد القابلة للكسر وتقليل احتمالية التلف.'),
  (N'PACKAGING', N'PACKAGING_ELECTRONICS', 8, N'تغليف الأجهزة الإلكترونية', N'إرشادات مختصرة لتغليف الأجهزة الإلكترونية مع مراعاة الحماية والعزل المناسب.'),
  (N'PACKAGING', N'PACKAGING_CLOTHES_LIGHT_ITEMS', 8, N'تغليف الملابس والمنتجات الخفيفة', N'إرشادات مختصرة لتغليف الملابس والمنتجات الخفيفة بطريقة مرتبة وآمنة.'),
  (N'PACKAGING', N'PACKAGING_LIQUIDS_SENSITIVE', 8, N'تغليف السوائل والمواد الحساسة', N'إرشادات مختصرة لتغليف السوائل والمواد الحساسة والاحتياطات المتعلقة بها.'),
  (N'PACKAGING', N'PACKAGING_RIGHT_CARTON', 8, N'استخدام الكرتون المناسب', N'إرشادات مختصرة لاختيار الكرتون المناسب بحسب الحجم والوزن وطبيعة الشحنة.'),
  (N'PACKAGING', N'PACKAGING_INTERNAL_PROTECTION', 8, N'استخدام مواد الحماية الداخلية', N'إرشادات مختصرة لاستخدام مواد الحماية الداخلية لتثبيت المحتويات وتقليل الحركة.'),
  (N'PACKAGING', N'PACKAGING_SEALING', 8, N'طريقة إغلاق الطرد بشكل آمن', N'إرشادات مختصرة لطريقة إغلاق الطرد بإحكام وتحضيره للنقل.'),
  (N'PACKAGING', N'PACKAGING_COMMON_MISTAKES', 8, N'الأخطاء الشائعة في التغليف', N'إرشادات مختصرة لأكثر أخطاء التغليف شيوعاً وكيفية تجنبها.'),
  (N'PACKAGING', N'PACKAGING_PALLET', 8, N'متى يجب استخدام Pallet؟', N'إرشادات مختصرة للحالات التي يوصى فيها باستخدام منصة Pallet للشحن.'),
  (N'PACKAGING', N'PACKAGING_ADDRESS_LABEL', 8, N'تعليمات كتابة العنوان على الشحنة', N'إرشادات مختصرة لكتابة عنوان الشحنة بشكل واضح وصحيح لتفادي التأخير.'),

  (N'PROHIBITED_ITEMS', N'PROHIBITED_LOCAL', 8, N'المواد المحظورة محلياً', N'معلومات مختصرة حول المواد الممنوعة من الشحن داخل النطاق المحلي.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_INTERNATIONAL', 8, N'المواد المحظورة دولياً', N'معلومات مختصرة حول المواد الممنوعة من الشحن الدولي بحسب الأنظمة المعمول بها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_DANGEROUS_GOODS', 8, N'المواد الخطرة Dangerous Goods', N'معلومات مختصرة حول المواد الخطرة وتصنيفاتها وقيود التعامل معها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_LIQUIDS_CHEMICALS', 8, N'السوائل والمواد الكيميائية', N'معلومات مختصرة حول قيود شحن السوائل والمواد الكيميائية ومتطلبات قبولها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_BATTERIES_ELECTRONICS', 8, N'البطاريات والأجهزة الإلكترونية', N'معلومات مختصرة حول شحن البطاريات والأجهزة الإلكترونية والقيود المرتبطة بها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_MEDICINES', 8, N'الأدوية والمستلزمات الطبية', N'معلومات مختصرة حول شحن الأدوية والمستلزمات الطبية والمتطلبات التنظيمية المرتبطة بها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_FOOD', 8, N'المواد الغذائية', N'معلومات مختصرة حول شحن المواد الغذائية والقيود المحتملة عليها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_CASH_PRECIOUS', 8, N'الأموال والمعادن الثمينة', N'معلومات مختصرة حول القيود المتعلقة بشحن الأموال والمعادن الثمينة.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_SENSITIVE_DOCS', 8, N'الوثائق الرسمية الحساسة', N'معلومات مختصرة حول التعامل مع الوثائق الرسمية الحساسة والقيود المرتبطة بها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_WEAPONS_SHARP', 8, N'الأسلحة والأدوات الحادة', N'معلومات مختصرة حول المواد المصنفة كأسلحة أو أدوات حادة وحظر شحنها.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_SPECIAL_APPROVALS', 8, N'المنتجات التي تحتاج موافقات خاصة', N'معلومات مختصرة حول المنتجات التي قد تتطلب موافقات مسبقة قبل الشحن.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_DIFFERENCE', 8, N'الفرق بين ممنوع ومقيّد', N'معلومات مختصرة توضح الفرق بين المواد الممنوعة والمواد المقيّدة.'),
  (N'PROHIBITED_ITEMS', N'PROHIBITED_WHAT_HAPPENS', 8, N'ماذا يحدث إذا تم إرسال مادة محظورة؟', N'معلومات مختصرة حول الإجراءات المتوقعة إذا كانت الشحنة تحتوي على مادة محظورة.'),

  (N'TRACKING_STATUS', N'TRACKING_HOW_TO_TRACK', 8, N'كيفية تتبع الشحنة', N'شرح مختصر لطريقة استخدام رقم التتبع ومتابعة تحديثات الشحنة.'),
  (N'TRACKING_STATUS', N'TRACKING_STATUS_EXPLANATION', 8, N'شرح حالات التتبع', N'شرح مختصر لمعاني حالات التتبع التي قد تظهر خلال رحلة الشحنة.'),
  (N'TRACKING_STATUS', N'TRACKING_CREATED', 7, N'تم إنشاء الشحنة', N'توضيح مختصر لمعنى حالة تم إنشاء الشحنة وما الذي يليها عادة.'),
  (N'TRACKING_STATUS', N'TRACKING_RECEIVED', 7, N'تم استلام الشحنة', N'توضيح مختصر لمعنى حالة تم استلام الشحنة من العميل أو الفرع.'),
  (N'TRACKING_STATUS', N'TRACKING_PROCESSING', 7, N'قيد المعالجة', N'توضيح مختصر لمعنى حالة قيد المعالجة والخطوات المرتبطة بها.'),
  (N'TRACKING_STATUS', N'TRACKING_OUT_FOR_DELIVERY', 7, N'خرجت للتوصيل', N'توضيح مختصر لمعنى حالة خرجت للتوصيل وما يمكن توقعه بعدها.'),
  (N'TRACKING_STATUS', N'TRACKING_DELIVERED', 7, N'تم التسليم', N'توضيح مختصر لمعنى حالة تم التسليم وإغلاق عملية الشحنة.'),
  (N'TRACKING_STATUS', N'TRACKING_FAILED_ATTEMPT', 7, N'محاولة تسليم فاشلة', N'توضيح مختصر لمعنى محاولة التسليم الفاشلة وما هي الخيارات المتاحة بعدها.'),
  (N'TRACKING_STATUS', N'TRACKING_IN_CLEARANCE', 7, N'الشحنة قيد التخليص', N'توضيح مختصر لمعنى وجود الشحنة في مرحلة التخليص الجمركي.'),
  (N'TRACKING_STATUS', N'TRACKING_NEEDS_INFO', 7, N'الشحنة بحاجة إلى معلومات إضافية', N'توضيح مختصر لمعنى طلب معلومات إضافية والبيانات التي قد تُطلب من العميل.'),
  (N'TRACKING_STATUS', N'TRACKING_DELAYED', 7, N'الشحنة متأخرة', N'توضيح مختصر لمعنى تأخر الشحنة والأسباب المحتملة وخطوات المتابعة.'),
  (N'TRACKING_STATUS', N'TRACKING_NO_STATUS', 7, N'ماذا أفعل إذا لم تظهر حالة التتبع؟', N'إرشادات مختصرة للتعامل مع حالة عدم ظهور أي تحديث في صفحة التتبع.'),
  (N'TRACKING_STATUS', N'TRACKING_UNCLEAR_STATUS', 7, N'ماذا أفعل إذا كانت حالة الشحنة غير واضحة؟', N'إرشادات مختصرة للتعامل مع حالة التتبع غير الواضحة وكيفية طلب التوضيح.'),

  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_OPEN_BUSINESS', 8, N'فتح حساب تجاري', N'معلومات مختصرة حول فتح الحساب التجاري والمتطلبات الأولية للبدء.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_TYPES', 8, N'أنواع الحسابات', N'معلومات مختصرة حول أنواع الحسابات المتاحة واستخدام كل نوع.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_PRICING_MECHANISM', 8, N'آلية التسعير للعملاء', N'معلومات مختصرة حول أسس التسعير والعوامل المؤثرة على الأسعار.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_PAYMENT_METHODS', 8, N'طرق الدفع المتاحة', N'معلومات مختصرة حول وسائل الدفع المعتمدة للطلبات والخدمات.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_CASH', 7, N'الدفع النقدي', N'معلومات مختصرة حول استخدام الدفع النقدي والحالات المناسبة له.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_POS', 7, N'الدفع عبر POS', N'معلومات مختصرة حول الدفع عبر نقاط البيع وآلية استخدامه.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_COD', 8, N'الدفع عند الاستلام COD', N'معلومات مختصرة حول خدمة الدفع عند الاستلام وآلية التحصيل والتسوية.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_MONTHLY_INVOICES', 7, N'الفواتير الشهرية', N'معلومات مختصرة حول إصدار الفواتير الشهرية ومراجعتها.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_STATEMENT', 7, N'كشف الحساب', N'معلومات مختصرة حول كشف الحساب ومكوناته وكيفية مراجعته.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_CREDIT_LIMITS', 7, N'الحدود الائتمانية', N'معلومات مختصرة حول الحدود الائتمانية وآلية تطبيقها على الحساب.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_SETTLEMENT', 7, N'آلية تسوية المبالغ', N'معلومات مختصرة حول تسوية المبالغ ومواعيدها والإجراءات المتعلقة بها.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_ADDITIONAL_FEES', 7, N'رسوم الخدمات الإضافية', N'معلومات مختصرة حول الرسوم الإضافية التي قد تنطبق على بعض الخدمات أو الطلبات.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_INVOICE_INQUIRY', 7, N'الاستفسار عن فاتورة', N'معلومات مختصرة حول آلية الاستفسار عن فاتورة أو تفاصيلها.'),
  (N'ACCOUNTS_PAYMENTS', N'ACCOUNTS_INVOICE_DISPUTE', 7, N'الاعتراض على فاتورة', N'معلومات مختصرة حول خطوات الاعتراض على الفاتورة وآلية مراجعتها.'),

  (N'COMPLAINTS_CLAIMS', N'CLAIMS_SUBMIT_COMPLAINT', 8, N'تقديم شكوى على شحنة', N'إرشادات مختصرة حول خطوات تقديم شكوى تتعلق بالشحنة أو الخدمة.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_COMPENSATION', 8, N'تقديم مطالبة تعويض', N'إرشادات مختصرة حول كيفية تقديم مطالبة تعويض والحالات المناسبة لذلك.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_DAMAGE', 8, N'مطالبة تلف الشحنة', N'إرشادات مختصرة حول تقديم مطالبة عند حدوث تلف في الشحنة.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_LOSS', 8, N'مطالبة فقدان الشحنة', N'إرشادات مختصرة حول تقديم مطالبة في حالة فقدان الشحنة.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_DELAY', 8, N'مطالبة تأخير الشحنة', N'إرشادات مختصرة حول رفع مطالبة بسبب تأخر الشحنة عن المدة المتوقعة.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_REQUIRED_DOCUMENTS', 7, N'المستندات المطلوبة للمطالبة', N'إرشادات مختصرة حول الوثائق التي قد تُطلب لدعم المطالبة أو الشكوى.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_PROCESSING_TIME', 7, N'مدة معالجة الشكوى', N'إرشادات مختصرة حول مدة معالجة الشكوى والعوامل التي قد تؤثر فيها.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_TRACK_STATUS', 7, N'متابعة حالة الشكوى', N'إرشادات مختصرة حول متابعة حالة الشكوى بعد تسجيلها.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_NOT_COVERED', 7, N'حالات لا تشملها المسؤولية', N'إرشادات مختصرة حول الحالات التي قد لا تكون مشمولة ضمن المسؤولية أو التعويض.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_CONTACT_CUSTOMER_SERVICE', 7, N'كيفية التواصل مع خدمة العملاء', N'إرشادات مختصرة حول قنوات التواصل مع خدمة العملاء لمتابعة الشكاوى.'),
  (N'COMPLAINTS_CLAIMS', N'CLAIMS_ESCALATION', 7, N'تصعيد الشكوى للإدارة المختصة', N'إرشادات مختصرة حول تصعيد الشكوى عند الحاجة إلى مراجعة أعلى.'),

  (N'FORMS_DOWNLOADS', N'FORMS_COMMERCIAL_INVOICE', 7, N'نموذج الفاتورة التجارية', N'معلومات مختصرة حول استخدام نموذج الفاتورة التجارية ومتى يكون مطلوباً.'),
  (N'FORMS_DOWNLOADS', N'FORMS_CUSTOMS_DECLARATION', 7, N'نموذج التصريح الجمركي', N'معلومات مختصرة حول استخدام نموذج التصريح الجمركي والبيانات التي يتضمنها.'),
  (N'FORMS_DOWNLOADS', N'FORMS_CLAIM_FORM', 7, N'نموذج المطالبة', N'معلومات مختصرة حول نموذج المطالبة ومتى يجب تعبئته وتقديمه.'),
  (N'FORMS_DOWNLOADS', N'FORMS_ACCOUNT_OPENING', 7, N'نموذج طلب فتح حساب', N'معلومات مختصرة حول نموذج فتح الحساب التجاري وأبرز الحقول المطلوبة.'),
  (N'FORMS_DOWNLOADS', N'FORMS_INTL_SHIPPING_REQUEST', 7, N'نموذج طلب شحن دولي', N'معلومات مختصرة حول نموذج طلب الشحن الدولي ومتى يتم استخدامه.'),
  (N'FORMS_DOWNLOADS', N'FORMS_HEAVY_SHIPPING_REQUEST', 7, N'نموذج طلب شحن ثقيل', N'معلومات مختصرة حول نموذج طلب الشحن الثقيل والبيانات المتعلقة بالشحنة.'),
  (N'FORMS_DOWNLOADS', N'FORMS_CUSTOMS_AUTHORIZATION', 7, N'نموذج تفويض التخليص الجمركي', N'معلومات مختصرة حول نموذج تفويض التخليص الجمركي واستخدامه.'),
  (N'FORMS_DOWNLOADS', N'FORMS_CONTENT_DECLARATION', 7, N'نموذج إقرار محتويات الشحنة', N'معلومات مختصرة حول نموذج إقرار المحتويات وأهمية تعبئته بدقة.'),
  (N'FORMS_DOWNLOADS', N'FORMS_CUSTOMER_COMPLAINT', 7, N'نموذج شكوى عميل', N'معلومات مختصرة حول نموذج شكوى العميل وآلية تقديمه.'),
  (N'FORMS_DOWNLOADS', N'FORMS_ACCOUNT_UPDATE', 7, N'نموذج تحديث بيانات الحساب', N'معلومات مختصرة حول نموذج تحديث بيانات الحساب ومتى يستخدم.'),
  (N'FORMS_DOWNLOADS', N'FORMS_PRICING_GUIDE', 7, N'دليل الأسعار والخدمات', N'معلومات مختصرة حول دليل الأسعار والخدمات وما يتضمنه من معلومات.'),
  (N'FORMS_DOWNLOADS', N'FORMS_PACKAGING_GUIDE', 7, N'دليل التغليف', N'معلومات مختصرة حول دليل التغليف والإرشادات الأساسية الواردة فيه.'),

  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_INDIVIDUALS', 7, N'خدمات الأفراد', N'معلومات مختصرة حول الخدمات المصممة لتلبية احتياجات الأفراد في الشحن والتوصيل.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_COMPANIES', 7, N'خدمات الشركات', N'معلومات مختصرة حول الخدمات اللوجستية المصممة للشركات وحساباتها التشغيلية.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_ECOMMERCE', 7, N'المتاجر الإلكترونية', N'معلومات مختصرة حول الخدمات المخصصة للمتاجر الإلكترونية وإدارة الطلبات والتوصيل.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_COMMERCIAL_SECTOR', 7, N'القطاع التجاري', N'معلومات مختصرة حول الحلول اللوجستية الداعمة لأعمال القطاع التجاري.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_INDUSTRIAL_SECTOR', 7, N'القطاع الصناعي', N'معلومات مختصرة حول الخدمات المناسبة لاحتياجات القطاع الصناعي والشحنات المرتبطة به.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_MEDICAL_SECTOR', 7, N'القطاع الطبي', N'معلومات مختصرة حول الخدمات المناسبة للقطاع الطبي ومتطلبات نقل المواد الحساسة.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_GOVERNMENT', 7, N'المؤسسات الحكومية', N'معلومات مختصرة حول الخدمات المناسبة لاحتياجات الجهات والمؤسسات الحكومية.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_EDUCATION', 7, N'المؤسسات التعليمية', N'معلومات مختصرة حول الخدمات اللوجستية الداعمة للمؤسسات التعليمية.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_CLEARANCE_COMPANIES', 7, N'شركات التخليص', N'معلومات مختصرة حول التعاون مع شركات التخليص واحتياجاتها التشغيلية.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_SHIPPING_DISTRIBUTION', 7, N'شركات الشحن والتوزيع', N'معلومات مختصرة حول الخدمات المقدمة لشركات الشحن والتوزيع والشركاء اللوجستيين.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_IMPORTERS_EXPORTERS', 7, N'المستوردون والمصدرون', N'معلومات مختصرة حول الخدمات المصممة للمستوردين والمصدرين وإجراءاتهم.'),
  (N'COMPANIES_INDUSTRIES', N'INDUSTRIES_CONTRACT_CUSTOMERS', 7, N'العملاء ذوو العقود', N'معلومات مختصرة حول مزايا وإجراءات العملاء المرتبطين بعقود خدمية.'),

  (N'GENERAL_FAQS', N'GENERAL_WORKING_HOURS', 7, N'ما هي ساعات العمل؟', N'إجابة مختصرة حول ساعات العمل الرسمية وأوقات استقبال العملاء.'),
  (N'GENERAL_FAQS', N'GENERAL_BRANCH_LOCATIONS', 7, N'أين تقع فروع واصل؟', N'إجابة مختصرة حول مواقع الفروع وكيفية الوصول إليها.'),
  (N'GENERAL_FAQS', N'GENERAL_CONTACT_SUPPORT', 7, N'كيف أتواصل مع خدمة العملاء؟', N'إجابة مختصرة حول وسائل التواصل المتاحة مع خدمة العملاء.'),
  (N'GENERAL_FAQS', N'GENERAL_TRACK_SHIPMENT', 8, N'كيف أتتبع شحنتي؟', N'إجابة مختصرة حول الطريقة الصحيحة لتتبع الشحنة باستخدام رقم التتبع.'),
  (N'GENERAL_FAQS', N'GENERAL_DELIVERY_TIME', 7, N'ما هي مدة التوصيل؟', N'إجابة مختصرة حول مدة التوصيل المتوقعة والعوامل التي قد تؤثر عليها.'),
  (N'GENERAL_FAQS', N'GENERAL_CHANGE_ADDRESS', 7, N'هل يمكن تغيير عنوان التسليم؟', N'إجابة مختصرة حول إمكانية تعديل عنوان التسليم وشروط ذلك.'),
  (N'GENERAL_FAQS', N'GENERAL_CANCEL_REQUEST', 7, N'هل يمكن إلغاء طلب الشحن؟', N'إجابة مختصرة حول شروط وإمكانية إلغاء طلب الشحن.'),
  (N'GENERAL_FAQS', N'GENERAL_HOME_PICKUP', 7, N'هل يوجد استلام من المنزل أو الشركة؟', N'إجابة مختصرة حول توفر خدمة الاستلام من المنزل أو مقر الشركة.'),
  (N'GENERAL_FAQS', N'GENERAL_SHIPPING_COST', 7, N'كيف أعرف تكلفة الشحن؟', N'إجابة مختصرة حول طريقة معرفة تكلفة الشحن والعوامل المؤثرة عليها.'),
  (N'GENERAL_FAQS', N'GENERAL_INSURANCE', 7, N'هل يوجد تأمين على الشحنة؟', N'إجابة مختصرة حول توفر التأمين على الشحنات وحدود التغطية المحتملة.'),
  (N'GENERAL_FAQS', N'GENERAL_DELAYED_SHIPMENT', 7, N'ماذا أفعل إذا تأخرت الشحنة؟', N'إجابة مختصرة حول الخطوات المقترحة عند تأخر الشحنة عن المتوقع.'),
  (N'GENERAL_FAQS', N'GENERAL_DAMAGED_SHIPMENT', 7, N'ماذا أفعل إذا وصلت الشحنة تالفة؟', N'إجابة مختصرة حول الخطوات الأولى الواجب اتباعها عند وصول الشحنة بحالة تلف.');

DECLARE @QuestionEnglish TABLE (
  intent_key NVARCHAR(200) NOT NULL,
  question_en NVARCHAR(2000) NOT NULL,
  answer_en NVARCHAR(MAX) NOT NULL
);

INSERT INTO @QuestionEnglish (intent_key, question_en, answer_en)
VALUES
  (N'SERVICES_INTERNATIONAL_SHIPPING', N'International Shipping', N'Brief information on international shipping service, how to use it, and basic requirements.'),
  (N'SERVICES_LOCAL_SHIPPING', N'Local Shipping', N'Brief information on local shipping service, delivery within local areas, and requirements to start.'),
  (N'SERVICES_HEAVY_CARGO', N'Heavy Cargo Shipping', N'Brief information on heavy cargo service, suitable shipment types, and preparation requirements.'),
  (N'SERVICES_CUSTOMS_CLEARANCE', N'Customs Clearance', N'Brief information on customs clearance service, required documents, and claim tracking.'),
  (N'SERVICES_NO_OBJECTION', N'No Objection Service', N'Brief information on no objection service, eligible beneficiaries, and submission process.'),
  (N'SERVICES_JORDANIAN_PASSPORTS', N'Jordanian Passport Services', N'Brief information on Jordanian passport services, pickup and delivery steps, and basic requirements.'),
  (N'SERVICES_US_EMBASSY_PASSPORT_DELIVERY', N'US Embassy Passport Delivery Service', N'Brief information on US Embassy passport delivery service and pickup/delivery procedures.'),
  (N'SERVICES_STORAGE_3PL', N'Storage and 3PL Services', N'Brief information on storage, logistics operations, inventory management, and distribution services.'),
  (N'SERVICES_CUSTOMER_PICKUP', N'Customer Pickup Service', N'Brief information on shipment pickup from customer location and scheduling procedures.'),
  (N'SERVICES_DOOR_DELIVERY', N'Door-to-Door Delivery Service', N'Brief information on delivery to final recipient address and available delivery options.'),
  (N'SERVICES_COD', N'Cash on Delivery (COD) Service', N'Brief information on COD service, collection process, and payment settlement.'),
  (N'SERVICES_DOCUMENTS', N'Documents Shipping Service', N'Brief information on documents and official files shipping and preparation requirements.'),
  (N'SERVICES_PACKAGES', N'Packages Shipping Service', N'Brief information on package shipping service, suitable weights, and transport options.'),
  (N'SERVICES_COMMERCIAL_GOODS', N'Commercial Goods Service', N'Brief information on commercial goods transport and required invoices and documentation.'),
  (N'POLICIES_INTL_SHIPPING', N'International Shipping Policy', N'Brief explanation of international shipping policy, scope of application, and related exceptions.'),
  (N'POLICIES_LOCAL_SHIPPING', N'Local Shipping Policy', N'Brief explanation of local shipping policy and delivery conditions within target areas.'),
  (N'POLICIES_PRICING_FEES', N'Pricing and Fees Policy', N'Brief explanation of pricing and fees calculation and factors affecting costs.'),
  (N'POLICIES_PACKAGING', N'Packaging Policy', N'Brief explanation of acceptable packaging requirements and customer responsibility for shipment preparation.'),
  (N'POLICIES_PROHIBITED_ITEMS', N'Prohibited Items Policy', N'Brief explanation of prohibited or restricted items and handling procedures during inspection.'),
  (N'POLICIES_LIABILITY_COMPENSATION', N'Liability and Compensation Policy', N'Brief explanation of liability limits, compensation cases, and related conditions.'),
  (N'POLICIES_COMPLAINTS', N'Complaints Submission Policy', N'Brief explanation of complaint filing steps, follow-up periods, and handling procedures.'),
  (N'POLICIES_REFUNDS', N'Refunds Policy', N'Brief explanation of acceptable refund cases and financial request review procedures.'),
  (N'POLICIES_PAYMENTS_COLLECTION', N'Payment and Collection Policy', N'Brief explanation of payment and collection mechanisms and regulatory requirements.'),
  (N'POLICIES_BUSINESS_ACCOUNTS', N'Business Accounts Policy', N'Brief explanation of business account opening and management conditions and related obligations.'),
  (N'POLICIES_PRIVACY_DATA', N'Privacy and Data Protection Policy', N'Brief explanation of customer data handling and personal information protection.'),
  (N'POLICIES_TERMS_OF_USE', N'Wassel Services Terms of Use', N'Brief explanation of general terms governing use of Wassel services.'),
  (N'POLICIES_DELAY_NON_DELIVERY', N'Delay or Non-Delivery Policy', N'Brief explanation of delay or non-delivery cases and handling and follow-up procedures.'),
  (N'POLICIES_INCORRECT_ADDRESS', N'Incorrect Address Policy', N'Brief explanation of handling incorrect or incomplete addresses.'),
  (N'POLICIES_TEMP_STORAGE', N'Temporary Package Storage Policy', N'Brief explanation of temporary storage conditions, duration, and related fees.'),
  (N'GUIDES_START_SHIPPING_REQUEST', N'How to Start a Shipping Request?', N'Brief guide to basic steps for starting a shipment from initial data entry to order confirmation.'),
  (N'GUIDES_PREPARE_SHIPMENT', N'Shipment Preparation Steps', N'Brief guide on properly preparing a shipment before delivery or pickup.'),
  (N'GUIDES_DOCUMENTS_VS_PACKAGES', N'Difference Between Documents and Packages Shipping', N'Brief guide on differences between documents and packages shipping in terms of requirements and handling.'),
  (N'GUIDES_VOLUMETRIC_WEIGHT', N'How to Calculate Volumetric Weight', N'Brief guide on calculating volumetric weight and its impact on shipment pricing.'),
  (N'GUIDES_CHOOSE_SERVICE', N'How to Choose the Right Service Type', N'Brief guide helping customers choose the appropriate service based on shipment type, destination, and speed required.'),
  (N'GUIDES_TRACK_SHIPMENT', N'How to Track a Shipment', N'Brief guide on tracking methods and reading shipment status updates.'),
  (N'GUIDES_PREPARE_INTL_SHIPMENT', N'How to Prepare an International Shipment', N'Brief guide on preparing international shipments regarding documents, packaging, and basic requirements.'),
  (N'GUIDES_PREPARE_LOCAL_SHIPMENT', N'How to Prepare a Local Shipment', N'Brief guide on properly preparing local shipments to expedite delivery.'),
  (N'GUIDES_REQUEST_PICKUP', N'How to Request Pickup from Location', N'Brief guide on requesting shipment pickup from customer location and scheduling.'),
  (N'GUIDES_PRINT_AWB', N'How to Print the Airway Bill', N'Brief guide on obtaining the airway bill and preparing it for printing and use.'),
  (N'GUIDES_ATTACH_DOCUMENTS', N'How to Attach Required Documents', N'Brief guide on attaching necessary documents with the request or with the shipment.'),
  (N'GUIDES_DROP_OFF_BRANCH', N'Steps for Handing Over Shipment to Branch', N'Brief guide on procedures to follow when delivering a shipment to the branch.'),
  (N'GUIDES_PICKUP_FROM_CUSTOMER', N'Pickup from Customer Procedures', N'Brief guide on procedures for picking up shipment from customer and subsequent preparation.'),
  (N'CUSTOMS_REQUIREMENTS', N'Customs Clearance Requirements', N'Brief information on basic requirements needed to initiate customs clearance for a shipment.'),
  (N'CUSTOMS_COMMERCIAL_INVOICE', N'Commercial Invoice', N'Brief information on the role and importance of commercial invoices in customs procedures.'),
  (N'CUSTOMS_SHIPMENT_CONTENTS', N'Description of Shipment Contents', N'Brief information on how to properly and clearly describe shipment contents.'),
  (N'CUSTOMS_DECLARED_VALUE', N'Declared Value', N'Brief information on importance of declaring correct value and its impact on customs procedures.'),
  (N'CUSTOMS_DUTIES_TAXES', N'Customs Duties and Taxes', N'Brief information on customs duties and taxes and general estimation methods.'),
  (N'CUSTOMS_COMMERCIAL_SHIPMENTS', N'Commercial Shipments', N'Brief information on commercial shipments and related documentation and clearance requirements.'),
  (N'CUSTOMS_PERSONAL_SHIPMENTS', N'Personal Shipments', N'Brief information on personal shipments and their handling in customs clearance.'),
  (N'CUSTOMS_IMPORT_DOCS', N'Import Documents', N'Brief information on basic import documents used in customs clearance procedures.'),
  (N'CUSTOMS_EXPORT_DOCS', N'Export Documents', N'Brief information on export documents required based on shipment type and destination.'),
  (N'CUSTOMS_DELAY_REASONS', N'Reasons for Customs Clearance Delays', N'Brief information on main reasons for customs clearance delays and how to minimize them.'),
  (N'CUSTOMS_EXTRA_DOC_COUNTRIES', N'Countries Requiring Additional Documents', N'Brief information on some destinations requiring additional documents before or during clearance.'),
  (N'CUSTOMS_PAY_DUTIES', N'How to Pay Customs Duties', N'Brief information on customs duty payment method and related financial responsibility.'),
  (N'CUSTOMS_CUSTOMER_RESPONSIBILITY', N'Customer Responsibility for Customs Data', N'Brief information on customer responsibility for accuracy of customs data sent with shipment.'),
  (N'PACKAGING_DOCUMENTS', N'Documents Packaging Guidelines', N'Brief guidelines on packaging documents to preserve them during transportation.'),
  (N'PACKAGING_PACKAGES', N'Packages Packaging Guidelines', N'Brief guidelines on safely packaging shipments in appropriate manner for shipping.'),
  (N'PACKAGING_FRAGILE_ITEMS', N'Packaging Fragile Items', N'Brief guidelines on packaging fragile items and minimizing breakage risk.'),
  (N'PACKAGING_ELECTRONICS', N'Packaging Electronics', N'Brief guidelines on packaging electronic devices with proper protection and insulation.'),
  (N'PACKAGING_CLOTHES_LIGHT_ITEMS', N'Packaging Clothes and Light Items', N'Brief guidelines on packaging clothes and light products in organized and safe manner.'),
  (N'PACKAGING_LIQUIDS_SENSITIVE', N'Packaging Liquids and Sensitive Materials', N'Brief guidelines on packaging liquids and sensitive materials with related precautions.'),
  (N'PACKAGING_RIGHT_CARTON', N'Using Appropriate Carton', N'Brief guidelines on choosing appropriate carton based on size, weight, and shipment nature.'),
  (N'PACKAGING_INTERNAL_PROTECTION', N'Using Internal Protection Materials', N'Brief guidelines on using internal protection materials to secure contents and reduce movement.'),
  (N'PACKAGING_SEALING', N'How to Securely Seal a Package', N'Brief guidelines on securely closing a package and preparing it for transportation.'),
  (N'PACKAGING_COMMON_MISTAKES', N'Common Packaging Mistakes', N'Brief guidelines on most common packaging errors and how to avoid them.'),
  (N'PACKAGING_PALLET', N'When to Use a Pallet', N'Brief guidelines on cases where using a pallet for shipping is recommended.'),
  (N'PACKAGING_ADDRESS_LABEL', N'Instructions for Writing Address on Shipment', N'Brief guidelines on writing shipment address clearly and correctly to avoid delays.'),
  (N'PROHIBITED_LOCAL', N'Locally Prohibited Items', N'Brief information on items prohibited from shipping within local scope.'),
  (N'PROHIBITED_INTERNATIONAL', N'Internationally Prohibited Items', N'Brief information on items prohibited from international shipping per applicable regulations.'),
  (N'PROHIBITED_DANGEROUS_GOODS', N'Dangerous Goods', N'Brief information on dangerous goods, their classifications, and handling restrictions.'),
  (N'PROHIBITED_LIQUIDS_CHEMICALS', N'Liquids and Chemical Materials', N'Brief information on restrictions for shipping liquids and chemical materials and acceptance requirements.'),
  (N'PROHIBITED_BATTERIES_ELECTRONICS', N'Batteries and Electronic Devices', N'Brief information on shipping batteries and electronic devices and related restrictions.'),
  (N'PROHIBITED_MEDICINES', N'Medicines and Medical Supplies', N'Brief information on shipping medicines and medical supplies and regulatory requirements.'),
  (N'PROHIBITED_FOOD', N'Food Items', N'Brief information on shipping food items and potential restrictions.'),
  (N'PROHIBITED_CASH_PRECIOUS', N'Cash and Precious Metals', N'Brief information on restrictions related to shipping cash and precious metals.'),
  (N'PROHIBITED_SENSITIVE_DOCS', N'Sensitive Official Documents', N'Brief information on handling sensitive official documents and related restrictions.'),
  (N'PROHIBITED_WEAPONS_SHARP', N'Weapons and Sharp Tools', N'Brief information on items classified as weapons or sharp tools and shipping prohibition.'),
  (N'PROHIBITED_SPECIAL_APPROVALS', N'Products Requiring Special Approvals', N'Brief information on products that may require prior approvals before shipping.'),
  (N'PROHIBITED_DIFFERENCE', N'Difference Between Prohibited and Restricted', N'Brief information clarifying the difference between prohibited and restricted items.'),
  (N'PROHIBITED_WHAT_HAPPENS', N'What Happens if Prohibited Item is Sent', N'Brief information on expected procedures if shipment contains prohibited item.'),
  (N'TRACKING_HOW_TO_TRACK', N'How to Track a Shipment', N'Brief guide on using tracking number and monitoring shipment updates.'),
  (N'TRACKING_STATUS_EXPLANATION', N'Explanation of Tracking Statuses', N'Brief guide on meanings of tracking statuses that may appear during shipment journey.'),
  (N'TRACKING_CREATED', N'Shipment Created', N'Brief explanation of shipment created status meaning and what typically follows.'),
  (N'TRACKING_RECEIVED', N'Shipment Received', N'Brief explanation of shipment received status from customer or branch.'),
  (N'TRACKING_PROCESSING', N'Processing', N'Brief explanation of processing status meaning and related steps.'),
  (N'TRACKING_OUT_FOR_DELIVERY', N'Out for Delivery', N'Brief explanation of out for delivery status meaning and what to expect afterward.'),
  (N'TRACKING_DELIVERED', N'Delivered', N'Brief explanation of delivered status meaning and shipment process closure.'),
  (N'TRACKING_FAILED_ATTEMPT', N'Failed Delivery Attempt', N'Brief explanation of failed delivery attempt meaning and available options afterward.'),
  (N'TRACKING_IN_CLEARANCE', N'Shipment in Customs Clearance', N'Brief explanation of shipment in customs clearance phase.'),
  (N'TRACKING_NEEDS_INFO', N'Shipment Requires Additional Information', N'Brief explanation of additional information request and what data may be requested from customer.'),
  (N'TRACKING_DELAYED', N'Shipment Delayed', N'Brief explanation of shipment delay meaning, potential causes, and follow-up steps.'),
  (N'TRACKING_NO_STATUS', N'What to Do if Tracking Status Does Not Appear', N'Brief guide on handling case where no tracking update appears on tracking page.'),
  (N'TRACKING_UNCLEAR_STATUS', N'What to Do if Shipment Status Is Unclear', N'Brief guide on handling unclear tracking status and how to request clarification.'),
  (N'ACCOUNTS_OPEN_BUSINESS', N'Open a Business Account', N'Brief information on opening business account and initial requirements to start.'),
  (N'ACCOUNTS_TYPES', N'Account Types', N'Brief information on available account types and use of each.'),
  (N'ACCOUNTS_PRICING_MECHANISM', N'Customer Pricing Mechanism', N'Brief information on pricing basis and factors affecting prices.'),
  (N'ACCOUNTS_PAYMENT_METHODS', N'Available Payment Methods', N'Brief information on accepted payment methods for orders and services.'),
  (N'ACCOUNTS_CASH', N'Cash Payment', N'Brief information on using cash payment and appropriate cases.'),
  (N'ACCOUNTS_POS', N'Payment via POS', N'Brief information on payment via point of sale and usage procedure.'),
  (N'ACCOUNTS_COD', N'Cash on Delivery Payment', N'Brief information on COD service and collection and settlement procedures.'),
  (N'ACCOUNTS_MONTHLY_INVOICES', N'Monthly Invoices', N'Brief information on monthly invoice issuance and review.'),
  (N'ACCOUNTS_STATEMENT', N'Account Statement', N'Brief information on account statement and its components and how to review it.'),
  (N'ACCOUNTS_CREDIT_LIMITS', N'Credit Limits', N'Brief information on credit limits and their application to account.'),
  (N'ACCOUNTS_SETTLEMENT', N'Amount Settlement Mechanism', N'Brief information on amount settlement and timing and related procedures.'),
  (N'ACCOUNTS_ADDITIONAL_FEES', N'Additional Service Fees', N'Brief information on additional fees that may apply to some services or orders.'),
  (N'ACCOUNTS_INVOICE_INQUIRY', N'Invoice Inquiry', N'Brief information on how to inquire about an invoice or its details.'),
  (N'ACCOUNTS_INVOICE_DISPUTE', N'Invoice Dispute', N'Brief information on steps for disputing an invoice and review procedures.'),
  (N'CLAIMS_SUBMIT_COMPLAINT', N'File a Complaint on Shipment', N'Brief guidance on steps for filing complaint related to shipment or service.'),
  (N'CLAIMS_COMPENSATION', N'File a Compensation Claim', N'Brief guidance on how to file compensation claim and appropriate cases.'),
  (N'CLAIMS_DAMAGE', N'Shipment Damage Claim', N'Brief guidance on filing claim when shipment damage occurs.'),
  (N'CLAIMS_LOSS', N'Shipment Loss Claim', N'Brief guidance on filing claim in case of shipment loss.'),
  (N'CLAIMS_DELAY', N'Shipment Delay Claim', N'Brief guidance on filing claim due to shipment delay beyond expected duration.'),
  (N'CLAIMS_REQUIRED_DOCUMENTS', N'Required Documents for Claim', N'Brief guidance on documents that may be requested to support claim or complaint.'),
  (N'CLAIMS_PROCESSING_TIME', N'Complaint Processing Duration', N'Brief guidance on complaint processing duration and factors that may affect it.'),
  (N'CLAIMS_TRACK_STATUS', N'Track Complaint Status', N'Brief guidance on tracking complaint status after filing.'),
  (N'CLAIMS_NOT_COVERED', N'Cases Not Covered by Liability', N'Brief guidance on cases that may not be covered under liability or compensation.'),
  (N'CLAIMS_CONTACT_CUSTOMER_SERVICE', N'How to Contact Customer Service', N'Brief guidance on customer service contact channels for complaint follow-up.'),
  (N'CLAIMS_ESCALATION', N'Escalate Complaint to Relevant Department', N'Brief guidance on escalating complaint when higher-level review is needed.'),
  (N'FORMS_COMMERCIAL_INVOICE', N'Commercial Invoice Form', N'Brief information on using commercial invoice form and when it is required.'),
  (N'FORMS_CUSTOMS_DECLARATION', N'Customs Declaration Form', N'Brief information on using customs declaration form and data it contains.'),
  (N'FORMS_CLAIM_FORM', N'Claim Form', N'Brief information on claim form and when to complete and submit it.'),
  (N'FORMS_ACCOUNT_OPENING', N'Account Opening Request Form', N'Brief information on business account opening form and main required fields.'),
  (N'FORMS_INTL_SHIPPING_REQUEST', N'International Shipping Request Form', N'Brief information on international shipping request form and when to use it.'),
  (N'FORMS_HEAVY_SHIPPING_REQUEST', N'Heavy Cargo Shipping Request Form', N'Brief information on heavy cargo shipping request form and related shipment data.'),
  (N'FORMS_CUSTOMS_AUTHORIZATION', N'Customs Clearance Authorization Form', N'Brief information on customs clearance authorization form and its use.'),
  (N'FORMS_CONTENT_DECLARATION', N'Shipment Content Declaration Form', N'Brief information on shipment content declaration form and importance of accurate completion.'),
  (N'FORMS_CUSTOMER_COMPLAINT', N'Customer Complaint Form', N'Brief information on customer complaint form and submission procedure.'),
  (N'FORMS_ACCOUNT_UPDATE', N'Account Data Update Form', N'Brief information on account data update form and when to use it.'),
  (N'FORMS_PRICING_GUIDE', N'Pricing and Services Guide', N'Brief information on pricing and services guide and information it contains.'),
  (N'FORMS_PACKAGING_GUIDE', N'Packaging Guide', N'Brief information on packaging guide and basic instructions contained in it.'),
  (N'INDUSTRIES_INDIVIDUALS', N'Services for Individuals', N'Brief information on services designed to meet individual shipping and delivery needs.'),
  (N'INDUSTRIES_COMPANIES', N'Services for Companies', N'Brief information on logistics services designed for companies and their operational accounts.'),
  (N'INDUSTRIES_ECOMMERCE', N'E-commerce Stores', N'Brief information on services tailored for e-commerce stores and order and delivery management.'),
  (N'INDUSTRIES_COMMERCIAL_SECTOR', N'Commercial Sector', N'Brief information on logistics solutions supporting commercial sector operations.'),
  (N'INDUSTRIES_INDUSTRIAL_SECTOR', N'Industrial Sector', N'Brief information on services suitable for industrial sector needs and related shipments.'),
  (N'INDUSTRIES_MEDICAL_SECTOR', N'Medical Sector', N'Brief information on services suitable for medical sector and sensitive material transport requirements.'),
  (N'INDUSTRIES_GOVERNMENT', N'Government Institutions', N'Brief information on services suitable for government agencies and institutions needs.'),
  (N'INDUSTRIES_EDUCATION', N'Educational Institutions', N'Brief information on logistics services supporting educational institutions.'),
  (N'INDUSTRIES_CLEARANCE_COMPANIES', N'Customs Clearance Companies', N'Brief information on cooperation with clearance companies and their operational needs.'),
  (N'INDUSTRIES_SHIPPING_DISTRIBUTION', N'Shipping and Distribution Companies', N'Brief information on services provided to shipping and distribution companies and logistics partners.'),
  (N'INDUSTRIES_IMPORTERS_EXPORTERS', N'Importers and Exporters', N'Brief information on services designed for importers and exporters and their procedures.'),
  (N'INDUSTRIES_CONTRACT_CUSTOMERS', N'Contract Customers', N'Brief information on benefits and procedures for customers with service contracts.'),
  (N'GENERAL_WORKING_HOURS', N'What Are Working Hours?', N'Brief answer on official working hours and customer reception times.'),
  (N'GENERAL_BRANCH_LOCATIONS', N'Where Are Wassel Branches Located?', N'Brief answer on branch locations and how to reach them.'),
  (N'GENERAL_CONTACT_SUPPORT', N'How Do I Contact Customer Service?', N'Brief answer on available channels to contact customer service.'),
  (N'GENERAL_TRACK_SHIPMENT', N'How Do I Track My Shipment?', N'Brief answer on correct method to track shipment using tracking number.'),
  (N'GENERAL_DELIVERY_TIME', N'What Is the Delivery Duration?', N'Brief answer on expected delivery duration and factors that may affect it.'),
  (N'GENERAL_CHANGE_ADDRESS', N'Can I Change the Delivery Address?', N'Brief answer on possibility of modifying delivery address and related conditions.'),
  (N'GENERAL_CANCEL_REQUEST', N'Can I Cancel a Shipping Request?', N'Brief answer on conditions and possibility of canceling shipping request.'),
  (N'GENERAL_HOME_PICKUP', N'Is Home or Business Pickup Available?', N'Brief answer on availability of pickup service from home or business premises.'),
  (N'GENERAL_SHIPPING_COST', N'How Do I Know the Shipping Cost?', N'Brief answer on method to determine shipping cost and factors affecting it.'),
  (N'GENERAL_INSURANCE', N'Is Shipment Insurance Available?', N'Brief answer on insurance availability on shipments and potential coverage limits.'),
  (N'GENERAL_DELAYED_SHIPMENT', N'What to Do if Shipment Is Delayed?', N'Brief answer on recommended steps when shipment is delayed beyond expected time.'),
  (N'GENERAL_DAMAGED_SHIPMENT', N'What to Do if Shipment Arrives Damaged?', N'Brief answer on initial steps to follow when shipment arrives damaged.');

DECLARE @Keywords TABLE (
  intent_key NVARCHAR(200) NOT NULL,
  language_code NVARCHAR(5) NOT NULL,
  keyword NVARCHAR(300) NOT NULL
);

INSERT INTO @Keywords (intent_key, language_code, keyword)
SELECT DISTINCT q.intent_key, N'ar', q.question_ar
FROM @Questions q
UNION
SELECT DISTINCT q.intent_key, N'en', qe.question_en
FROM @Questions q
JOIN @QuestionEnglish qe ON qe.intent_key = q.intent_key
UNION
SELECT DISTINCT q.intent_key, N'ar', t.name_ar
FROM @Questions q
JOIN @Topics t ON t.code = q.topic_code
UNION
SELECT DISTINCT q.intent_key, N'en', t.name_en
FROM @Questions q
JOIN @Topics t ON t.code = q.topic_code;

-- ============================================================
-- Explicit synonym keywords per intent_key (AR + EN)
-- ============================================================
INSERT INTO @Keywords (intent_key, language_code, keyword) VALUES

-- SERVICES_DOMESTIC_SHIPPING
(N'SERVICES_DOMESTIC_SHIPPING', N'ar', N'شحن داخلي'),
(N'SERVICES_DOMESTIC_SHIPPING', N'ar', N'توصيل محلي'),
(N'SERVICES_DOMESTIC_SHIPPING', N'ar', N'ارسال داخل البلاد'),
(N'SERVICES_DOMESTIC_SHIPPING', N'ar', N'شحن بالمملكة'),
(N'SERVICES_DOMESTIC_SHIPPING', N'ar', N'خدمة التوصيل'),
(N'SERVICES_DOMESTIC_SHIPPING', N'ar', N'ايصال طرد'),
(N'SERVICES_DOMESTIC_SHIPPING', N'en', N'domestic shipping'),
(N'SERVICES_DOMESTIC_SHIPPING', N'en', N'local delivery'),
(N'SERVICES_DOMESTIC_SHIPPING', N'en', N'internal shipping'),
(N'SERVICES_DOMESTIC_SHIPPING', N'en', N'nationwide delivery'),
(N'SERVICES_DOMESTIC_SHIPPING', N'en', N'parcel delivery'),

-- SERVICES_INTERNATIONAL_SHIPPING
(N'SERVICES_INTERNATIONAL_SHIPPING', N'ar', N'شحن خارجي'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'ar', N'شحن للخارج'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'ar', N'ارسالية دولية'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'ar', N'استيراد'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'ar', N'تصدير'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'ar', N'شحن عبر الحدود'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'ar', N'شحن خارج المملكة'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'en', N'international shipping'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'en', N'overseas shipping'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'en', N'cross-border'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'en', N'import'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'en', N'export'),
(N'SERVICES_INTERNATIONAL_SHIPPING', N'en', N'global shipping'),

-- SERVICES_EXPRESS_DELIVERY
(N'SERVICES_EXPRESS_DELIVERY', N'ar', N'توصيل سريع'),
(N'SERVICES_EXPRESS_DELIVERY', N'ar', N'شحن عاجل'),
(N'SERVICES_EXPRESS_DELIVERY', N'ar', N'ارسال يوم نفسه'),
(N'SERVICES_EXPRESS_DELIVERY', N'ar', N'اسرع توصيل'),
(N'SERVICES_EXPRESS_DELIVERY', N'ar', N'شحن فوري'),
(N'SERVICES_EXPRESS_DELIVERY', N'ar', N'طلب مستعجل'),
(N'SERVICES_EXPRESS_DELIVERY', N'en', N'express delivery'),
(N'SERVICES_EXPRESS_DELIVERY', N'en', N'same day delivery'),
(N'SERVICES_EXPRESS_DELIVERY', N'en', N'urgent shipping'),
(N'SERVICES_EXPRESS_DELIVERY', N'en', N'fast shipping'),
(N'SERVICES_EXPRESS_DELIVERY', N'en', N'next day delivery'),

-- SERVICES_COD
(N'SERVICES_COD', N'ar', N'كاش اون ديليفري'),
(N'SERVICES_COD', N'ar', N'الدفع عند الاستلام'),
(N'SERVICES_COD', N'ar', N'الدفع عند التسليم'),
(N'SERVICES_COD', N'ar', N'دفع نقدي عند الاستلام'),
(N'SERVICES_COD', N'ar', N'تحصيل الدفع'),
(N'SERVICES_COD', N'ar', N'COD'),
(N'SERVICES_COD', N'en', N'cash on delivery'),
(N'SERVICES_COD', N'en', N'COD'),
(N'SERVICES_COD', N'en', N'pay on receipt'),
(N'SERVICES_COD', N'en', N'collect on delivery'),
(N'SERVICES_COD', N'en', N'payment collection'),

-- SERVICES_HOME_PICKUP
(N'SERVICES_HOME_PICKUP', N'ar', N'استلام من المنزل'),
(N'SERVICES_HOME_PICKUP', N'ar', N'بيك اب'),
(N'SERVICES_HOME_PICKUP', N'ar', N'استلام من الموقع'),
(N'SERVICES_HOME_PICKUP', N'ar', N'ارسال من البيت'),
(N'SERVICES_HOME_PICKUP', N'ar', N'خدمة الاستلام'),
(N'SERVICES_HOME_PICKUP', N'ar', N'طلب استلام'),
(N'SERVICES_HOME_PICKUP', N'en', N'home pickup'),
(N'SERVICES_HOME_PICKUP', N'en', N'pickup service'),
(N'SERVICES_HOME_PICKUP', N'en', N'door pickup'),
(N'SERVICES_HOME_PICKUP', N'en', N'collection service'),
(N'SERVICES_HOME_PICKUP', N'en', N'request pickup'),

-- SERVICES_WAREHOUSING
(N'SERVICES_WAREHOUSING', N'ar', N'تخزين'),
(N'SERVICES_WAREHOUSING', N'ar', N'مستودع'),
(N'SERVICES_WAREHOUSING', N'ar', N'ايداع بضاعة'),
(N'SERVICES_WAREHOUSING', N'ar', N'حفظ البضائع'),
(N'SERVICES_WAREHOUSING', N'ar', N'تأجير مستودع'),
(N'SERVICES_WAREHOUSING', N'ar', N'ادارة المخزون'),
(N'SERVICES_WAREHOUSING', N'en', N'warehousing'),
(N'SERVICES_WAREHOUSING', N'en', N'storage'),
(N'SERVICES_WAREHOUSING', N'en', N'warehouse'),
(N'SERVICES_WAREHOUSING', N'en', N'inventory management'),
(N'SERVICES_WAREHOUSING', N'en', N'fulfilment'),

-- SERVICES_CUSTOMS_CLEARANCE
(N'SERVICES_CUSTOMS_CLEARANCE', N'ar', N'تخليص جمركي'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'ar', N'تخليص الجمارك'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'ar', N'اجراءات جمركية'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'ar', N'الجمرك'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'ar', N'فسح البضائع'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'ar', N'استيراد وتخليص'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'en', N'customs clearance'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'en', N'customs brokerage'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'en', N'import clearance'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'en', N'customs procedures'),
(N'SERVICES_CUSTOMS_CLEARANCE', N'en', N'duty clearance'),

-- SERVICES_FREIGHT
(N'SERVICES_FREIGHT', N'ar', N'شحن بضائع'),
(N'SERVICES_FREIGHT', N'ar', N'نقل بضائع'),
(N'SERVICES_FREIGHT', N'ar', N'شحن ثقيل'),
(N'SERVICES_FREIGHT', N'ar', N'شحن بالطائرة'),
(N'SERVICES_FREIGHT', N'ar', N'شحن بحري'),
(N'SERVICES_FREIGHT', N'ar', N'شحن بري'),
(N'SERVICES_FREIGHT', N'ar', N'لوجستيات'),
(N'SERVICES_FREIGHT', N'en', N'freight'),
(N'SERVICES_FREIGHT', N'en', N'cargo'),
(N'SERVICES_FREIGHT', N'en', N'air freight'),
(N'SERVICES_FREIGHT', N'en', N'sea freight'),
(N'SERVICES_FREIGHT', N'en', N'road freight'),
(N'SERVICES_FREIGHT', N'en', N'logistics'),
(N'SERVICES_FREIGHT', N'en', N'bulk shipping'),

-- SERVICES_ECOMMERCE
(N'SERVICES_ECOMMERCE', N'ar', N'متجر الكتروني'),
(N'SERVICES_ECOMMERCE', N'ar', N'تجارة الكترونية'),
(N'SERVICES_ECOMMERCE', N'ar', N'شحن الطلبات'),
(N'SERVICES_ECOMMERCE', N'ar', N'تسليم الطلبات'),
(N'SERVICES_ECOMMERCE', N'ar', N'حلول التجزئة'),
(N'SERVICES_ECOMMERCE', N'ar', N'مرتجعات المتجر'),
(N'SERVICES_ECOMMERCE', N'en', N'e-commerce'),
(N'SERVICES_ECOMMERCE', N'en', N'online store'),
(N'SERVICES_ECOMMERCE', N'en', N'order fulfillment'),
(N'SERVICES_ECOMMERCE', N'en', N'ecommerce shipping'),
(N'SERVICES_ECOMMERCE', N'en', N'retail delivery'),
(N'SERVICES_ECOMMERCE', N'en', N'returns management'),

-- SERVICES_BULK_DELIVERY
(N'SERVICES_BULK_DELIVERY', N'ar', N'توزيع بالجملة'),
(N'SERVICES_BULK_DELIVERY', N'ar', N'توصيل كميات كبيرة'),
(N'SERVICES_BULK_DELIVERY', N'ar', N'شحن جماعي'),
(N'SERVICES_BULK_DELIVERY', N'ar', N'شحن دفعة واحدة'),
(N'SERVICES_BULK_DELIVERY', N'ar', N'توزيع بضائع'),
(N'SERVICES_BULK_DELIVERY', N'en', N'bulk delivery'),
(N'SERVICES_BULK_DELIVERY', N'en', N'mass distribution'),
(N'SERVICES_BULK_DELIVERY', N'en', N'wholesale shipping'),
(N'SERVICES_BULK_DELIVERY', N'en', N'large quantity delivery'),

-- SERVICES_RETURNS
(N'SERVICES_RETURNS', N'ar', N'مرتجعات'),
(N'SERVICES_RETURNS', N'ar', N'ارجاع طرد'),
(N'SERVICES_RETURNS', N'ar', N'ارجاع بضاعة'),
(N'SERVICES_RETURNS', N'ar', N'ارجاع شحنة'),
(N'SERVICES_RETURNS', N'ar', N'استرجاع'),
(N'SERVICES_RETURNS', N'ar', N'استرداد'),
(N'SERVICES_RETURNS', N'en', N'returns'),
(N'SERVICES_RETURNS', N'en', N'reverse logistics'),
(N'SERVICES_RETURNS', N'en', N'return shipment'),
(N'SERVICES_RETURNS', N'en', N'refund pickup'),
(N'SERVICES_RETURNS', N'en', N'return parcel'),

-- SERVICES_CORPORATE
(N'SERVICES_CORPORATE', N'ar', N'حساب تجاري'),
(N'SERVICES_CORPORATE', N'ar', N'خدمات الشركات'),
(N'SERVICES_CORPORATE', N'ar', N'عقد شركة'),
(N'SERVICES_CORPORATE', N'ar', N'حلول اعمال'),
(N'SERVICES_CORPORATE', N'ar', N'اشتراك مؤسسي'),
(N'SERVICES_CORPORATE', N'en', N'corporate account'),
(N'SERVICES_CORPORATE', N'en', N'business solutions'),
(N'SERVICES_CORPORATE', N'en', N'enterprise shipping'),
(N'SERVICES_CORPORATE', N'en', N'company contract'),
(N'SERVICES_CORPORATE', N'en', N'B2B'),

-- SERVICES_PACKAGING
(N'SERVICES_PACKAGING', N'ar', N'تغليف'),
(N'SERVICES_PACKAGING', N'ar', N'تعبئة'),
(N'SERVICES_PACKAGING', N'ar', N'تغليف احترافي'),
(N'SERVICES_PACKAGING', N'ar', N'خدمة التعبئة والتغليف'),
(N'SERVICES_PACKAGING', N'ar', N'كرتون'),
(N'SERVICES_PACKAGING', N'ar', N'صندوق شحن'),
(N'SERVICES_PACKAGING', N'en', N'packaging'),
(N'SERVICES_PACKAGING', N'en', N'packing service'),
(N'SERVICES_PACKAGING', N'en', N'wrapping'),
(N'SERVICES_PACKAGING', N'en', N'shipping box'),
(N'SERVICES_PACKAGING', N'en', N'protective packaging'),

-- SERVICES_TRACK_SHIPMENT
(N'SERVICES_TRACK_SHIPMENT', N'ar', N'تتبع'),
(N'SERVICES_TRACK_SHIPMENT', N'ar', N'تتبع الشحنة'),
(N'SERVICES_TRACK_SHIPMENT', N'ar', N'اين طردي'),
(N'SERVICES_TRACK_SHIPMENT', N'ar', N'رقم التتبع'),
(N'SERVICES_TRACK_SHIPMENT', N'ar', N'متى يصل طردي'),
(N'SERVICES_TRACK_SHIPMENT', N'ar', N'مكان الشحنة'),
(N'SERVICES_TRACK_SHIPMENT', N'en', N'track shipment'),
(N'SERVICES_TRACK_SHIPMENT', N'en', N'tracking number'),
(N'SERVICES_TRACK_SHIPMENT', N'en', N'where is my package'),
(N'SERVICES_TRACK_SHIPMENT', N'en', N'shipment status'),
(N'SERVICES_TRACK_SHIPMENT', N'en', N'parcel tracking'),

-- TRACKING_STATUS_*
(N'TRACKING_STATUS_RECEIVED', N'ar', N'تم استلام الشحنة'),
(N'TRACKING_STATUS_RECEIVED', N'ar', N'استلام المرسل'),
(N'TRACKING_STATUS_RECEIVED', N'ar', N'وصلت الشحنة للمستودع'),
(N'TRACKING_STATUS_RECEIVED', N'en', N'shipment received'),
(N'TRACKING_STATUS_RECEIVED', N'en', N'picked up'),
(N'TRACKING_STATUS_RECEIVED', N'en', N'parcel collected'),

(N'TRACKING_STATUS_IN_TRANSIT', N'ar', N'قيد الشحن'),
(N'TRACKING_STATUS_IN_TRANSIT', N'ar', N'في الطريق'),
(N'TRACKING_STATUS_IN_TRANSIT', N'ar', N'جاري التوصيل'),
(N'TRACKING_STATUS_IN_TRANSIT', N'ar', N'الشحنة متحركة'),
(N'TRACKING_STATUS_IN_TRANSIT', N'en', N'in transit'),
(N'TRACKING_STATUS_IN_TRANSIT', N'en', N'on the way'),
(N'TRACKING_STATUS_IN_TRANSIT', N'en', N'out for delivery'),
(N'TRACKING_STATUS_IN_TRANSIT', N'en', N'moving'),

(N'TRACKING_STATUS_OUT_FOR_DELIVERY', N'ar', N'خرج للتسليم'),
(N'TRACKING_STATUS_OUT_FOR_DELIVERY', N'ar', N'المندوب في الطريق'),
(N'TRACKING_STATUS_OUT_FOR_DELIVERY', N'ar', N'سيصل قريباً'),
(N'TRACKING_STATUS_OUT_FOR_DELIVERY', N'en', N'out for delivery'),
(N'TRACKING_STATUS_OUT_FOR_DELIVERY', N'en', N'driver en route'),
(N'TRACKING_STATUS_OUT_FOR_DELIVERY', N'en', N'arriving soon'),

(N'TRACKING_STATUS_DELIVERED', N'ar', N'تم التسليم'),
(N'TRACKING_STATUS_DELIVERED', N'ar', N'تسلمت الشحنة'),
(N'TRACKING_STATUS_DELIVERED', N'ar', N'وصل الطرد'),
(N'TRACKING_STATUS_DELIVERED', N'en', N'delivered'),
(N'TRACKING_STATUS_DELIVERED', N'en', N'shipment delivered'),
(N'TRACKING_STATUS_DELIVERED', N'en', N'package received'),

(N'TRACKING_STATUS_FAILED_DELIVERY', N'ar', N'فشل التسليم'),
(N'TRACKING_STATUS_FAILED_DELIVERY', N'ar', N'لم يتم التسليم'),
(N'TRACKING_STATUS_FAILED_DELIVERY', N'ar', N'لم يجد المستلم'),
(N'TRACKING_STATUS_FAILED_DELIVERY', N'ar', N'غائب عند التسليم'),
(N'TRACKING_STATUS_FAILED_DELIVERY', N'en', N'failed delivery'),
(N'TRACKING_STATUS_FAILED_DELIVERY', N'en', N'delivery attempt failed'),
(N'TRACKING_STATUS_FAILED_DELIVERY', N'en', N'recipient not available'),

(N'TRACKING_STATUS_RETURNED', N'ar', N'شحنة مرتجعة'),
(N'TRACKING_STATUS_RETURNED', N'ar', N'رجعت الشحنة'),
(N'TRACKING_STATUS_RETURNED', N'ar', N'تم الارجاع'),
(N'TRACKING_STATUS_RETURNED', N'en', N'returned'),
(N'TRACKING_STATUS_RETURNED', N'en', N'shipment returned'),
(N'TRACKING_STATUS_RETURNED', N'en', N'return to sender'),

(N'TRACKING_STATUS_ON_HOLD', N'ar', N'موقوفة'),
(N'TRACKING_STATUS_ON_HOLD', N'ar', N'محتجزة'),
(N'TRACKING_STATUS_ON_HOLD', N'ar', N'شحنة موقفة'),
(N'TRACKING_STATUS_ON_HOLD', N'en', N'on hold'),
(N'TRACKING_STATUS_ON_HOLD', N'en', N'shipment held'),
(N'TRACKING_STATUS_ON_HOLD', N'en', N'suspended'),

(N'TRACKING_STATUS_CUSTOMS_HOLD', N'ar', N'محتجزة جمركياً'),
(N'TRACKING_STATUS_CUSTOMS_HOLD', N'ar', N'موقوفة بالجمرك'),
(N'TRACKING_STATUS_CUSTOMS_HOLD', N'ar', N'فحص جمركي'),
(N'TRACKING_STATUS_CUSTOMS_HOLD', N'en', N'customs hold'),
(N'TRACKING_STATUS_CUSTOMS_HOLD', N'en', N'held at customs'),
(N'TRACKING_STATUS_CUSTOMS_HOLD', N'en', N'customs inspection'),

(N'TRACKING_STATUS_DELAYED', N'ar', N'تأخر الشحنة'),
(N'TRACKING_STATUS_DELAYED', N'ar', N'الشحنة متأخرة'),
(N'TRACKING_STATUS_DELAYED', N'ar', N'لم تصل في الوقت'),
(N'TRACKING_STATUS_DELAYED', N'en', N'delayed'),
(N'TRACKING_STATUS_DELAYED', N'en', N'late shipment'),
(N'TRACKING_STATUS_DELAYED', N'en', N'shipment delay'),

(N'TRACKING_STATUS_SORTING', N'ar', N'فرز'),
(N'TRACKING_STATUS_SORTING', N'ar', N'مركز الفرز'),
(N'TRACKING_STATUS_SORTING', N'ar', N'قيد الفرز'),
(N'TRACKING_STATUS_SORTING', N'en', N'sorting'),
(N'TRACKING_STATUS_SORTING', N'en', N'sorting facility'),
(N'TRACKING_STATUS_SORTING', N'en', N'hub sorting'),

(N'TRACKING_STATUS_CANCELLED', N'ar', N'ملغاة'),
(N'TRACKING_STATUS_CANCELLED', N'ar', N'تم الالغاء'),
(N'TRACKING_STATUS_CANCELLED', N'ar', N'طلب ملغي'),
(N'TRACKING_STATUS_CANCELLED', N'en', N'cancelled'),
(N'TRACKING_STATUS_CANCELLED', N'en', N'order cancelled'),
(N'TRACKING_STATUS_CANCELLED', N'en', N'shipment cancelled'),

(N'TRACKING_STATUS_RESCHEDULED', N'ar', N'اعادة جدولة'),
(N'TRACKING_STATUS_RESCHEDULED', N'ar', N'تغيير موعد التسليم'),
(N'TRACKING_STATUS_RESCHEDULED', N'ar', N'تأجيل التسليم'),
(N'TRACKING_STATUS_RESCHEDULED', N'en', N'rescheduled'),
(N'TRACKING_STATUS_RESCHEDULED', N'en', N'delivery rescheduled'),
(N'TRACKING_STATUS_RESCHEDULED', N'en', N'new delivery date'),

(N'TRACKING_STATUS_PARTIAL_DELIVERY', N'ar', N'توصيل جزئي'),
(N'TRACKING_STATUS_PARTIAL_DELIVERY', N'ar', N'وصل جزء فقط'),
(N'TRACKING_STATUS_PARTIAL_DELIVERY', N'ar', N'ناقص من الطلب'),
(N'TRACKING_STATUS_PARTIAL_DELIVERY', N'en', N'partial delivery'),
(N'TRACKING_STATUS_PARTIAL_DELIVERY', N'en', N'incomplete delivery'),
(N'TRACKING_STATUS_PARTIAL_DELIVERY', N'en', N'missing items'),

-- PACKAGING_*
(N'PACKAGING_CORRECT_PACKING', N'ar', N'طريقة التغليف'),
(N'PACKAGING_CORRECT_PACKING', N'ar', N'التعبئة الصحيحة'),
(N'PACKAGING_CORRECT_PACKING', N'ar', N'كيف اغلف الطرد'),
(N'PACKAGING_CORRECT_PACKING', N'en', N'how to pack'),
(N'PACKAGING_CORRECT_PACKING', N'en', N'correct packaging'),
(N'PACKAGING_CORRECT_PACKING', N'en', N'packing instructions'),

(N'PACKAGING_SIZES', N'ar', N'مقاسات الكراتين'),
(N'PACKAGING_SIZES', N'ar', N'احجام الصندوق'),
(N'PACKAGING_SIZES', N'ar', N'مقاس الطرد'),
(N'PACKAGING_SIZES', N'en', N'box sizes'),
(N'PACKAGING_SIZES', N'en', N'packaging dimensions'),
(N'PACKAGING_SIZES', N'en', N'parcel size'),

(N'PACKAGING_FRAGILE', N'ar', N'تغليف قابل للكسر'),
(N'PACKAGING_FRAGILE', N'ar', N'زجاج'),
(N'PACKAGING_FRAGILE', N'ar', N'بضاعة هشة'),
(N'PACKAGING_FRAGILE', N'ar', N'حساس'),
(N'PACKAGING_FRAGILE', N'en', N'fragile packaging'),
(N'PACKAGING_FRAGILE', N'en', N'fragile items'),
(N'PACKAGING_FRAGILE', N'en', N'glass'),
(N'PACKAGING_FRAGILE', N'en', N'sensitive goods'),

(N'PACKAGING_WEIGHT_LIMITS', N'ar', N'وزن الطرد'),
(N'PACKAGING_WEIGHT_LIMITS', N'ar', N'الوزن المسموح'),
(N'PACKAGING_WEIGHT_LIMITS', N'ar', N'حد الوزن'),
(N'PACKAGING_WEIGHT_LIMITS', N'en', N'weight limit'),
(N'PACKAGING_WEIGHT_LIMITS', N'en', N'maximum weight'),
(N'PACKAGING_WEIGHT_LIMITS', N'en', N'package weight'),

(N'PACKAGING_LIQUIDS', N'ar', N'شحن سوائل'),
(N'PACKAGING_LIQUIDS', N'ar', N'تغليف السوائل'),
(N'PACKAGING_LIQUIDS', N'ar', N'عبوات سائلة'),
(N'PACKAGING_LIQUIDS', N'en', N'liquid shipment'),
(N'PACKAGING_LIQUIDS', N'en', N'shipping liquids'),
(N'PACKAGING_LIQUIDS', N'en', N'packing bottles'),

(N'PACKAGING_ELECTRONICS', N'ar', N'تغليف الكترونيات'),
(N'PACKAGING_ELECTRONICS', N'ar', N'شحن اجهزة'),
(N'PACKAGING_ELECTRONICS', N'ar', N'حماية الاجهزة'),
(N'PACKAGING_ELECTRONICS', N'en', N'electronics packaging'),
(N'PACKAGING_ELECTRONICS', N'en', N'shipping devices'),
(N'PACKAGING_ELECTRONICS', N'en', N'tech items'),

(N'PACKAGING_DOCUMENTS', N'ar', N'شحن وثائق'),
(N'PACKAGING_DOCUMENTS', N'ar', N'ارسال مستندات'),
(N'PACKAGING_DOCUMENTS', N'ar', N'وثائق رسمية'),
(N'PACKAGING_DOCUMENTS', N'en', N'document shipping'),
(N'PACKAGING_DOCUMENTS', N'en', N'shipping documents'),
(N'PACKAGING_DOCUMENTS', N'en', N'official papers'),

(N'PACKAGING_TAPE_SEAL', N'ar', N'لصق الكرتون'),
(N'PACKAGING_TAPE_SEAL', N'ar', N'ختم الطرد'),
(N'PACKAGING_TAPE_SEAL', N'ar', N'اغلاق الصندوق'),
(N'PACKAGING_TAPE_SEAL', N'en', N'sealing'),
(N'PACKAGING_TAPE_SEAL', N'en', N'tape'),
(N'PACKAGING_TAPE_SEAL', N'en', N'box seal'),

(N'PACKAGING_LABELING', N'ar', N'ملصق الشحن'),
(N'PACKAGING_LABELING', N'ar', N'تعليق البيانات'),
(N'PACKAGING_LABELING', N'ar', N'بيانات المستلم'),
(N'PACKAGING_LABELING', N'en', N'shipping label'),
(N'PACKAGING_LABELING', N'en', N'labeling'),
(N'PACKAGING_LABELING', N'en', N'address label'),

(N'PACKAGING_MULTIPLE_ITEMS', N'ar', N'طرد متعدد القطع'),
(N'PACKAGING_MULTIPLE_ITEMS', N'ar', N'اكثر من قطعة في الصندوق'),
(N'PACKAGING_MULTIPLE_ITEMS', N'en', N'multiple items'),
(N'PACKAGING_MULTIPLE_ITEMS', N'en', N'multi-piece shipment'),

(N'PACKAGING_REUSING_BOXES', N'ar', N'اعادة استخدام الكرتون'),
(N'PACKAGING_REUSING_BOXES', N'ar', N'صندوق مستعمل'),
(N'PACKAGING_REUSING_BOXES', N'en', N'reusing boxes'),
(N'PACKAGING_REUSING_BOXES', N'en', N'recycled packaging'),

(N'PACKAGING_OVER_BOXING', N'ar', N'تغليف مضاعف'),
(N'PACKAGING_OVER_BOXING', N'ar', N'صندوق داخل صندوق'),
(N'PACKAGING_OVER_BOXING', N'en', N'double boxing'),
(N'PACKAGING_OVER_BOXING', N'en', N'over-boxing'),

(N'PACKAGING_CUSTOM_BOXES', N'ar', N'صناديق مخصصة'),
(N'PACKAGING_CUSTOM_BOXES', N'ar', N'كراتين بشعار'),
(N'PACKAGING_CUSTOM_BOXES', N'en', N'custom boxes'),
(N'PACKAGING_CUSTOM_BOXES', N'en', N'branded packaging'),

-- PROHIBITED_ITEMS_*
(N'PROHIBITED_ITEMS_GENERAL', N'ar', N'ممنوعات الشحن'),
(N'PROHIBITED_ITEMS_GENERAL', N'ar', N'اشياء لا يمكن شحنها'),
(N'PROHIBITED_ITEMS_GENERAL', N'ar', N'قائمة المحظورات'),
(N'PROHIBITED_ITEMS_GENERAL', N'en', N'prohibited items'),
(N'PROHIBITED_ITEMS_GENERAL', N'en', N'banned shipments'),
(N'PROHIBITED_ITEMS_GENERAL', N'en', N'restricted goods'),

(N'PROHIBITED_ITEMS_WEAPONS', N'ar', N'اسلحة'),
(N'PROHIBITED_ITEMS_WEAPONS', N'ar', N'ذخيرة'),
(N'PROHIBITED_ITEMS_WEAPONS', N'ar', N'ممنوعات امنية'),
(N'PROHIBITED_ITEMS_WEAPONS', N'en', N'weapons'),
(N'PROHIBITED_ITEMS_WEAPONS', N'en', N'firearms'),
(N'PROHIBITED_ITEMS_WEAPONS', N'en', N'ammunition'),

(N'PROHIBITED_ITEMS_DRUGS', N'ar', N'مخدرات'),
(N'PROHIBITED_ITEMS_DRUGS', N'ar', N'عقاقير ممنوعة'),
(N'PROHIBITED_ITEMS_DRUGS', N'en', N'drugs'),
(N'PROHIBITED_ITEMS_DRUGS', N'en', N'narcotics'),
(N'PROHIBITED_ITEMS_DRUGS', N'en', N'controlled substances'),

(N'PROHIBITED_ITEMS_HAZARDOUS', N'ar', N'مواد خطرة'),
(N'PROHIBITED_ITEMS_HAZARDOUS', N'ar', N'مواد كيميائية'),
(N'PROHIBITED_ITEMS_HAZARDOUS', N'ar', N'مواد قابلة للاشتعال'),
(N'PROHIBITED_ITEMS_HAZARDOUS', N'en', N'hazardous materials'),
(N'PROHIBITED_ITEMS_HAZARDOUS', N'en', N'dangerous goods'),
(N'PROHIBITED_ITEMS_HAZARDOUS', N'en', N'chemicals'),
(N'PROHIBITED_ITEMS_HAZARDOUS', N'en', N'flammable'),

(N'PROHIBITED_ITEMS_PERISHABLES', N'ar', N'مواد غذائية قابلة للتلف'),
(N'PROHIBITED_ITEMS_PERISHABLES', N'ar', N'اكل طازج'),
(N'PROHIBITED_ITEMS_PERISHABLES', N'ar', N'طعام'),
(N'PROHIBITED_ITEMS_PERISHABLES', N'en', N'perishable food'),
(N'PROHIBITED_ITEMS_PERISHABLES', N'en', N'fresh food'),
(N'PROHIBITED_ITEMS_PERISHABLES', N'en', N'food items'),

(N'PROHIBITED_ITEMS_ANIMALS', N'ar', N'حيوانات حية'),
(N'PROHIBITED_ITEMS_ANIMALS', N'ar', N'حيوانات اليفة'),
(N'PROHIBITED_ITEMS_ANIMALS', N'en', N'live animals'),
(N'PROHIBITED_ITEMS_ANIMALS', N'en', N'pets'),
(N'PROHIBITED_ITEMS_ANIMALS', N'en', N'livestock'),

(N'PROHIBITED_ITEMS_COUNTERFEIT', N'ar', N'بضاعة مقلدة'),
(N'PROHIBITED_ITEMS_COUNTERFEIT', N'ar', N'تقليد ماركات'),
(N'PROHIBITED_ITEMS_COUNTERFEIT', N'en', N'counterfeit goods'),
(N'PROHIBITED_ITEMS_COUNTERFEIT', N'en', N'fake products'),
(N'PROHIBITED_ITEMS_COUNTERFEIT', N'en', N'pirated items'),

(N'PROHIBITED_ITEMS_CASH', N'ar', N'نقود'),
(N'PROHIBITED_ITEMS_CASH', N'ar', N'عملة'),
(N'PROHIBITED_ITEMS_CASH', N'en', N'cash'),
(N'PROHIBITED_ITEMS_CASH', N'en', N'currency'),
(N'PROHIBITED_ITEMS_CASH', N'en', N'banknotes'),

(N'PROHIBITED_ITEMS_TOBACCO', N'ar', N'سجائر'),
(N'PROHIBITED_ITEMS_TOBACCO', N'ar', N'تبغ'),
(N'PROHIBITED_ITEMS_TOBACCO', N'en', N'tobacco'),
(N'PROHIBITED_ITEMS_TOBACCO', N'en', N'cigarettes'),
(N'PROHIBITED_ITEMS_TOBACCO', N'en', N'vaping'),

(N'PROHIBITED_ITEMS_BATTERIES', N'ar', N'بطاريات ليثيوم'),
(N'PROHIBITED_ITEMS_BATTERIES', N'ar', N'بطاريات'),
(N'PROHIBITED_ITEMS_BATTERIES', N'en', N'lithium batteries'),
(N'PROHIBITED_ITEMS_BATTERIES', N'en', N'batteries'),

(N'PROHIBITED_ITEMS_RELIGIOUS', N'ar', N'مواد مسيئة للدين'),
(N'PROHIBITED_ITEMS_RELIGIOUS', N'ar', N'محتوى ديني مخالف'),
(N'PROHIBITED_ITEMS_RELIGIOUS', N'en', N'offensive religious material'),
(N'PROHIBITED_ITEMS_RELIGIOUS', N'en', N'prohibited content'),

(N'PROHIBITED_ITEMS_HIGH_VALUE', N'ar', N'مجوهرات'),
(N'PROHIBITED_ITEMS_HIGH_VALUE', N'ar', N'ذهب'),
(N'PROHIBITED_ITEMS_HIGH_VALUE', N'ar', N'بضاعة عالية القيمة'),
(N'PROHIBITED_ITEMS_HIGH_VALUE', N'en', N'high value goods'),
(N'PROHIBITED_ITEMS_HIGH_VALUE', N'en', N'jewelry'),
(N'PROHIBITED_ITEMS_HIGH_VALUE', N'en', N'gold'),

(N'PROHIBITED_ITEMS_EXCEPTION_PROCESS', N'ar', N'استثناء من الممنوعات'),
(N'PROHIBITED_ITEMS_EXCEPTION_PROCESS', N'ar', N'تصريح خاص'),
(N'PROHIBITED_ITEMS_EXCEPTION_PROCESS', N'en', N'exception process'),
(N'PROHIBITED_ITEMS_EXCEPTION_PROCESS', N'en', N'special permit'),
(N'PROHIBITED_ITEMS_EXCEPTION_PROCESS', N'en', N'waiver'),

-- CUSTOMS_CLEARANCE_*
(N'CUSTOMS_WHAT_IS', N'ar', N'ما هو التخليص الجمركي'),
(N'CUSTOMS_WHAT_IS', N'ar', N'شرح الجمارك'),
(N'CUSTOMS_WHAT_IS', N'en', N'what is customs clearance'),
(N'CUSTOMS_WHAT_IS', N'en', N'customs explained'),

(N'CUSTOMS_REQUIRED_DOCS', N'ar', N'وثائق الجمارك'),
(N'CUSTOMS_REQUIRED_DOCS', N'ar', N'مستندات التخليص'),
(N'CUSTOMS_REQUIRED_DOCS', N'ar', N'فاتورة جمركية'),
(N'CUSTOMS_REQUIRED_DOCS', N'en', N'customs documents'),
(N'CUSTOMS_REQUIRED_DOCS', N'en', N'clearance paperwork'),
(N'CUSTOMS_REQUIRED_DOCS', N'en', N'commercial invoice'),

(N'CUSTOMS_DUTIES_TAXES', N'ar', N'رسوم جمركية'),
(N'CUSTOMS_DUTIES_TAXES', N'ar', N'ضريبة استيراد'),
(N'CUSTOMS_DUTIES_TAXES', N'ar', N'رسوم الاستيراد'),
(N'CUSTOMS_DUTIES_TAXES', N'en', N'customs duties'),
(N'CUSTOMS_DUTIES_TAXES', N'en', N'import tax'),
(N'CUSTOMS_DUTIES_TAXES', N'en', N'tariffs'),

(N'CUSTOMS_CLEARANCE_TIME', N'ar', N'مدة التخليص الجمركي'),
(N'CUSTOMS_CLEARANCE_TIME', N'ar', N'كم يستغرق الجمرك'),
(N'CUSTOMS_CLEARANCE_TIME', N'en', N'customs clearance time'),
(N'CUSTOMS_CLEARANCE_TIME', N'en', N'how long customs takes'),

(N'CUSTOMS_PROHIBITED_IMPORTS', N'ar', N'ممنوعات الاستيراد'),
(N'CUSTOMS_PROHIBITED_IMPORTS', N'ar', N'مواد غير قابلة للاستيراد'),
(N'CUSTOMS_PROHIBITED_IMPORTS', N'en', N'prohibited imports'),
(N'CUSTOMS_PROHIBITED_IMPORTS', N'en', N'import restrictions'),

(N'CUSTOMS_PERSONAL_EFFECTS', N'ar', N'مقتنيات شخصية'),
(N'CUSTOMS_PERSONAL_EFFECTS', N'ar', N'امتعة شخصية'),
(N'CUSTOMS_PERSONAL_EFFECTS', N'en', N'personal effects'),
(N'CUSTOMS_PERSONAL_EFFECTS', N'en', N'personal belongings'),

(N'CUSTOMS_COMMERCIAL_SHIPMENTS', N'ar', N'شحنات تجارية'),
(N'CUSTOMS_COMMERCIAL_SHIPMENTS', N'ar', N'بضاعة للبيع'),
(N'CUSTOMS_COMMERCIAL_SHIPMENTS', N'en', N'commercial shipments'),
(N'CUSTOMS_COMMERCIAL_SHIPMENTS', N'en', N'goods for sale'),

(N'CUSTOMS_HS_CODES', N'ar', N'كود جمركي'),
(N'CUSTOMS_HS_CODES', N'ar', N'رقم HS'),
(N'CUSTOMS_HS_CODES', N'ar', N'تصنيف بضاعة'),
(N'CUSTOMS_HS_CODES', N'en', N'HS code'),
(N'CUSTOMS_HS_CODES', N'en', N'harmonized code'),
(N'CUSTOMS_HS_CODES', N'en', N'tariff classification'),

(N'CUSTOMS_VALUATION', N'ar', N'قيمة البضاعة للجمارك'),
(N'CUSTOMS_VALUATION', N'ar', N'تقييم جمركي'),
(N'CUSTOMS_VALUATION', N'en', N'customs valuation'),
(N'CUSTOMS_VALUATION', N'en', N'declared value'),

(N'CUSTOMS_DELAYS', N'ar', N'تأخر بالجمرك'),
(N'CUSTOMS_DELAYS', N'ar', N'تأخر تخليص'),
(N'CUSTOMS_DELAYS', N'en', N'customs delay'),
(N'CUSTOMS_DELAYS', N'en', N'clearance delay'),

(N'CUSTOMS_CERTIFICATES', N'ar', N'شهادات المنشأ'),
(N'CUSTOMS_CERTIFICATES', N'ar', N'شهادة المطابقة'),
(N'CUSTOMS_CERTIFICATES', N'en', N'certificates'),
(N'CUSTOMS_CERTIFICATES', N'en', N'certificate of origin'),
(N'CUSTOMS_CERTIFICATES', N'en', N'compliance certificate'),

(N'CUSTOMS_AGENT_ROLE', N'ar', N'دور المخلص الجمركي'),
(N'CUSTOMS_AGENT_ROLE', N'ar', N'مخلص جمركي'),
(N'CUSTOMS_AGENT_ROLE', N'en', N'customs agent'),
(N'CUSTOMS_AGENT_ROLE', N'en', N'customs broker'),

(N'CUSTOMS_RETURN_SHIPMENTS', N'ar', N'ارجاع من الجمرك'),
(N'CUSTOMS_RETURN_SHIPMENTS', N'ar', N'مرتجع جمركي'),
(N'CUSTOMS_RETURN_SHIPMENTS', N'en', N'customs return'),
(N'CUSTOMS_RETURN_SHIPMENTS', N'en', N'return from customs'),

-- ACCOUNTS_PAYMENTS_*
(N'ACCOUNTS_CREATE_ACCOUNT', N'ar', N'انشاء حساب'),
(N'ACCOUNTS_CREATE_ACCOUNT', N'ar', N'تسجيل جديد'),
(N'ACCOUNTS_CREATE_ACCOUNT', N'ar', N'فتح حساب'),
(N'ACCOUNTS_CREATE_ACCOUNT', N'en', N'create account'),
(N'ACCOUNTS_CREATE_ACCOUNT', N'en', N'register'),
(N'ACCOUNTS_CREATE_ACCOUNT', N'en', N'sign up'),

(N'ACCOUNTS_LOGIN', N'ar', N'تسجيل دخول'),
(N'ACCOUNTS_LOGIN', N'ar', N'دخول الحساب'),
(N'ACCOUNTS_LOGIN', N'ar', N'اسم المستخدم وكلمة المرور'),
(N'ACCOUNTS_LOGIN', N'en', N'login'),
(N'ACCOUNTS_LOGIN', N'en', N'sign in'),
(N'ACCOUNTS_LOGIN', N'en', N'account access'),

(N'ACCOUNTS_FORGOT_PASSWORD', N'ar', N'نسيت كلمة المرور'),
(N'ACCOUNTS_FORGOT_PASSWORD', N'ar', N'استعادة كلمة المرور'),
(N'ACCOUNTS_FORGOT_PASSWORD', N'ar', N'اعادة تعيين كلمة المرور'),
(N'ACCOUNTS_FORGOT_PASSWORD', N'en', N'forgot password'),
(N'ACCOUNTS_FORGOT_PASSWORD', N'en', N'reset password'),
(N'ACCOUNTS_FORGOT_PASSWORD', N'en', N'password recovery'),

(N'ACCOUNTS_UPDATE_INFO', N'ar', N'تحديث بيانات الحساب'),
(N'ACCOUNTS_UPDATE_INFO', N'ar', N'تعديل معلوماتي'),
(N'ACCOUNTS_UPDATE_INFO', N'en', N'update account'),
(N'ACCOUNTS_UPDATE_INFO', N'en', N'edit profile'),

(N'ACCOUNTS_CLOSE_ACCOUNT', N'ar', N'اغلاق الحساب'),
(N'ACCOUNTS_CLOSE_ACCOUNT', N'ar', N'حذف الحساب'),
(N'ACCOUNTS_CLOSE_ACCOUNT', N'en', N'close account'),
(N'ACCOUNTS_CLOSE_ACCOUNT', N'en', N'delete account'),
(N'ACCOUNTS_CLOSE_ACCOUNT', N'en', N'deactivate'),

(N'ACCOUNTS_PAYMENT_METHODS', N'ar', N'طرق الدفع'),
(N'ACCOUNTS_PAYMENT_METHODS', N'ar', N'كيف ادفع'),
(N'ACCOUNTS_PAYMENT_METHODS', N'ar', N'دفع الكتروني'),
(N'ACCOUNTS_PAYMENT_METHODS', N'en', N'payment methods'),
(N'ACCOUNTS_PAYMENT_METHODS', N'en', N'how to pay'),
(N'ACCOUNTS_PAYMENT_METHODS', N'en', N'online payment'),

(N'ACCOUNTS_INVOICE', N'ar', N'فاتورة'),
(N'ACCOUNTS_INVOICE', N'ar', N'ايصال دفع'),
(N'ACCOUNTS_INVOICE', N'ar', N'طلب فاتورة'),
(N'ACCOUNTS_INVOICE', N'en', N'invoice'),
(N'ACCOUNTS_INVOICE', N'en', N'billing'),
(N'ACCOUNTS_INVOICE', N'en', N'receipt'),

(N'ACCOUNTS_WALLET', N'ar', N'محفظة'),
(N'ACCOUNTS_WALLET', N'ar', N'رصيد حسابي'),
(N'ACCOUNTS_WALLET', N'ar', N'شارج المحفظة'),
(N'ACCOUNTS_WALLET', N'en', N'wallet'),
(N'ACCOUNTS_WALLET', N'en', N'account balance'),
(N'ACCOUNTS_WALLET', N'en', N'top up'),

(N'ACCOUNTS_CREDIT', N'ar', N'ائتمان'),
(N'ACCOUNTS_CREDIT', N'ar', N'خط ائتمان'),
(N'ACCOUNTS_CREDIT', N'ar', N'شراء بالاجل'),
(N'ACCOUNTS_CREDIT', N'en', N'credit'),
(N'ACCOUNTS_CREDIT', N'en', N'credit line'),
(N'ACCOUNTS_CREDIT', N'en', N'deferred payment'),

(N'ACCOUNTS_SUBSCRIPTION', N'ar', N'اشتراك'),
(N'ACCOUNTS_SUBSCRIPTION', N'ar', N'خطة اشتراك'),
(N'ACCOUNTS_SUBSCRIPTION', N'ar', N'خطة سنوية'),
(N'ACCOUNTS_SUBSCRIPTION', N'en', N'subscription'),
(N'ACCOUNTS_SUBSCRIPTION', N'en', N'subscription plan'),
(N'ACCOUNTS_SUBSCRIPTION', N'en', N'monthly plan'),

(N'ACCOUNTS_REFUND', N'ar', N'استرداد مبلغ'),
(N'ACCOUNTS_REFUND', N'ar', N'رد فلوس'),
(N'ACCOUNTS_REFUND', N'ar', N'مطالبة باسترداد'),
(N'ACCOUNTS_REFUND', N'en', N'refund'),
(N'ACCOUNTS_REFUND', N'en', N'money back'),
(N'ACCOUNTS_REFUND', N'en', N'refund request'),

(N'ACCOUNTS_CORPORATE_BILLING', N'ar', N'فواتير مؤسسية'),
(N'ACCOUNTS_CORPORATE_BILLING', N'ar', N'فوترة الشركات'),
(N'ACCOUNTS_CORPORATE_BILLING', N'en', N'corporate billing'),
(N'ACCOUNTS_CORPORATE_BILLING', N'en', N'business invoicing'),

(N'ACCOUNTS_TRANSACTION_HISTORY', N'ar', N'سجل المعاملات'),
(N'ACCOUNTS_TRANSACTION_HISTORY', N'ar', N'تاريخ الدفعات'),
(N'ACCOUNTS_TRANSACTION_HISTORY', N'en', N'transaction history'),
(N'ACCOUNTS_TRANSACTION_HISTORY', N'en', N'payment history'),

(N'ACCOUNTS_PAYMENT_ISSUE', N'ar', N'مشكلة في الدفع'),
(N'ACCOUNTS_PAYMENT_ISSUE', N'ar', N'الدفع لم يتم'),
(N'ACCOUNTS_PAYMENT_ISSUE', N'ar', N'فشل الدفع'),
(N'ACCOUNTS_PAYMENT_ISSUE', N'en', N'payment issue'),
(N'ACCOUNTS_PAYMENT_ISSUE', N'en', N'failed payment'),
(N'ACCOUNTS_PAYMENT_ISSUE', N'en', N'payment error'),

-- SHIPPING_GUIDES_*
(N'SHIPPING_HOW_TO_SHIP', N'ar', N'كيف ارسل طرد'),
(N'SHIPPING_HOW_TO_SHIP', N'ar', N'خطوات الشحن'),
(N'SHIPPING_HOW_TO_SHIP', N'en', N'how to ship'),
(N'SHIPPING_HOW_TO_SHIP', N'en', N'shipping steps'),
(N'SHIPPING_HOW_TO_SHIP', N'en', N'send a package'),

(N'SHIPPING_RATES', N'ar', N'تسعيرة الشحن'),
(N'SHIPPING_RATES', N'ar', N'اسعار الشحن'),
(N'SHIPPING_RATES', N'ar', N'كم تكلفة الشحن'),
(N'SHIPPING_RATES', N'en', N'shipping rates'),
(N'SHIPPING_RATES', N'en', N'shipping prices'),
(N'SHIPPING_RATES', N'en', N'shipping cost'),

(N'SHIPPING_WEIGHT_CALC', N'ar', N'حساب الوزن'),
(N'SHIPPING_WEIGHT_CALC', N'ar', N'وزن حجمي'),
(N'SHIPPING_WEIGHT_CALC', N'ar', N'الوزن الفعلي'),
(N'SHIPPING_WEIGHT_CALC', N'en', N'weight calculation'),
(N'SHIPPING_WEIGHT_CALC', N'en', N'volumetric weight'),
(N'SHIPPING_WEIGHT_CALC', N'en', N'dimensional weight'),

(N'SHIPPING_INSURANCE', N'ar', N'تامين الشحن'),
(N'SHIPPING_INSURANCE', N'ar', N'تامين البضاعة'),
(N'SHIPPING_INSURANCE', N'ar', N'حماية الطرد'),
(N'SHIPPING_INSURANCE', N'en', N'shipping insurance'),
(N'SHIPPING_INSURANCE', N'en', N'cargo insurance'),
(N'SHIPPING_INSURANCE', N'en', N'shipment protection'),

(N'SHIPPING_SPECIAL_HANDLING', N'ar', N'معالجة خاصة'),
(N'SHIPPING_SPECIAL_HANDLING', N'ar', N'شحن متخصص'),
(N'SHIPPING_SPECIAL_HANDLING', N'en', N'special handling'),
(N'SHIPPING_SPECIAL_HANDLING', N'en', N'dedicated handling'),

(N'SHIPPING_PACKAGING_TIPS', N'ar', N'نصائح التغليف'),
(N'SHIPPING_PACKAGING_TIPS', N'ar', N'ارشادات التعبئة'),
(N'SHIPPING_PACKAGING_TIPS', N'en', N'packaging tips'),
(N'SHIPPING_PACKAGING_TIPS', N'en', N'packing advice'),

(N'SHIPPING_MULTIPLE_PARCELS', N'ar', N'ارسال اكثر من طرد'),
(N'SHIPPING_MULTIPLE_PARCELS', N'ar', N'شحن جماعي'),
(N'SHIPPING_MULTIPLE_PARCELS', N'en', N'multiple parcels'),
(N'SHIPPING_MULTIPLE_PARCELS', N'en', N'multi-shipment'),
(N'SHIPPING_MULTIPLE_PARCELS', N'en', N'batch shipping'),

(N'SHIPPING_RESTRICTED_ZONES', N'ar', N'مناطق لا يصلها التوصيل'),
(N'SHIPPING_RESTRICTED_ZONES', N'ar', N'مناطق بعيدة'),
(N'SHIPPING_RESTRICTED_ZONES', N'ar', N'تغطية التوصيل'),
(N'SHIPPING_RESTRICTED_ZONES', N'en', N'restricted zones'),
(N'SHIPPING_RESTRICTED_ZONES', N'en', N'delivery coverage'),
(N'SHIPPING_RESTRICTED_ZONES', N'en', N'remote areas'),

(N'SHIPPING_DELIVERY_PROOF', N'ar', N'اثبات التسليم'),
(N'SHIPPING_DELIVERY_PROOF', N'ar', N'توقيع المستلم'),
(N'SHIPPING_DELIVERY_PROOF', N'en', N'proof of delivery'),
(N'SHIPPING_DELIVERY_PROOF', N'en', N'delivery confirmation'),
(N'SHIPPING_DELIVERY_PROOF', N'en', N'signed delivery'),

(N'SHIPPING_SCHEDULE_PICKUP', N'ar', N'حجز موعد استلام'),
(N'SHIPPING_SCHEDULE_PICKUP', N'ar', N'جدولة الاستلام'),
(N'SHIPPING_SCHEDULE_PICKUP', N'en', N'schedule pickup'),
(N'SHIPPING_SCHEDULE_PICKUP', N'en', N'book pickup'),
(N'SHIPPING_SCHEDULE_PICKUP', N'en', N'pickup appointment'),

(N'SHIPPING_WAYBILL', N'ar', N'بوليصة شحن'),
(N'SHIPPING_WAYBILL', N'ar', N'وصل شحن'),
(N'SHIPPING_WAYBILL', N'ar', N'air waybill'),
(N'SHIPPING_WAYBILL', N'en', N'waybill'),
(N'SHIPPING_WAYBILL', N'en', N'air waybill'),
(N'SHIPPING_WAYBILL', N'en', N'shipping bill'),

(N'SHIPPING_CHANGE_DESTINATION', N'ar', N'تغيير عنوان التسليم'),
(N'SHIPPING_CHANGE_DESTINATION', N'ar', N'تعديل مكان التوصيل'),
(N'SHIPPING_CHANGE_DESTINATION', N'en', N'change delivery address'),
(N'SHIPPING_CHANGE_DESTINATION', N'en', N'redirect shipment'),

(N'SHIPPING_CANCEL', N'ar', N'الغاء طلب الشحن'),
(N'SHIPPING_CANCEL', N'ar', N'الغاء الارسالية'),
(N'SHIPPING_CANCEL', N'en', N'cancel shipment'),
(N'SHIPPING_CANCEL', N'en', N'cancel order'),

-- POLICIES_TERMS_*
(N'POLICY_DELIVERY_POLICY', N'ar', N'سياسة التوصيل'),
(N'POLICY_DELIVERY_POLICY', N'ar', N'شروط التوصيل'),
(N'POLICY_DELIVERY_POLICY', N'en', N'delivery policy'),
(N'POLICY_DELIVERY_POLICY', N'en', N'terms of delivery'),

(N'POLICY_RETURNS_POLICY', N'ar', N'سياسة الاسترجاع'),
(N'POLICY_RETURNS_POLICY', N'ar', N'شروط المرتجعات'),
(N'POLICY_RETURNS_POLICY', N'en', N'returns policy'),
(N'POLICY_RETURNS_POLICY', N'en', N'refund policy'),

(N'POLICY_PRIVACY', N'ar', N'سياسة الخصوصية'),
(N'POLICY_PRIVACY', N'ar', N'حماية البيانات'),
(N'POLICY_PRIVACY', N'en', N'privacy policy'),
(N'POLICY_PRIVACY', N'en', N'data protection'),

(N'POLICY_TERMS_OF_SERVICE', N'ar', N'الشروط والاحكام'),
(N'POLICY_TERMS_OF_SERVICE', N'ar', N'اتفاقية المستخدم'),
(N'POLICY_TERMS_OF_SERVICE', N'en', N'terms of service'),
(N'POLICY_TERMS_OF_SERVICE', N'en', N'user agreement'),

(N'POLICY_DAMAGE_LIABILITY', N'ar', N'المسؤولية عن الاضرار'),
(N'POLICY_DAMAGE_LIABILITY', N'ar', N'تعويض الضرر'),
(N'POLICY_DAMAGE_LIABILITY', N'en', N'damage liability'),
(N'POLICY_DAMAGE_LIABILITY', N'en', N'loss compensation'),

(N'POLICY_COMPENSATION', N'ar', N'التعويض'),
(N'POLICY_COMPENSATION', N'ar', N'مطالبة تعويض'),
(N'POLICY_COMPENSATION', N'en', N'compensation'),
(N'POLICY_COMPENSATION', N'en', N'claim compensation'),

(N'POLICY_SLA', N'ar', N'مستوى الخدمة'),
(N'POLICY_SLA', N'ar', N'ضمان الخدمة'),
(N'POLICY_SLA', N'en', N'SLA'),
(N'POLICY_SLA', N'en', N'service level agreement'),

(N'POLICY_FORCE_MAJEURE', N'ar', N'قوة قاهرة'),
(N'POLICY_FORCE_MAJEURE', N'ar', N'ظروف طارئة'),
(N'POLICY_FORCE_MAJEURE', N'en', N'force majeure'),
(N'POLICY_FORCE_MAJEURE', N'en', N'emergency conditions'),

(N'POLICY_PROHIBITED_SHIPMENTS', N'ar', N'شروط الشحنات الممنوعة'),
(N'POLICY_PROHIBITED_SHIPMENTS', N'en', N'prohibited shipment policy'),
(N'POLICY_PROHIBITED_SHIPMENTS', N'en', N'banned goods policy'),

(N'POLICY_PRICE_CHANGES', N'ar', N'تغيير الاسعار'),
(N'POLICY_PRICE_CHANGES', N'ar', N'تحديث التسعيرة'),
(N'POLICY_PRICE_CHANGES', N'en', N'price changes'),
(N'POLICY_PRICE_CHANGES', N'en', N'rate updates'),

(N'POLICY_DISPUTE', N'ar', N'نزاع'),
(N'POLICY_DISPUTE', N'ar', N'فض نزاع'),
(N'POLICY_DISPUTE', N'en', N'dispute'),
(N'POLICY_DISPUTE', N'en', N'dispute resolution'),

(N'POLICY_ACCOUNT_SUSPENSION', N'ar', N'تعليق الحساب'),
(N'POLICY_ACCOUNT_SUSPENSION', N'ar', N'ايقاف الحساب'),
(N'POLICY_ACCOUNT_SUSPENSION', N'en', N'account suspension'),
(N'POLICY_ACCOUNT_SUSPENSION', N'en', N'account banned'),

(N'POLICY_COD_POLICY', N'ar', N'سياسة الدفع عند الاستلام'),
(N'POLICY_COD_POLICY', N'ar', N'شروط COD'),
(N'POLICY_COD_POLICY', N'en', N'COD policy'),
(N'POLICY_COD_POLICY', N'en', N'cash on delivery terms'),

(N'POLICY_THIRD_PARTY', N'ar', N'طرف ثالث'),
(N'POLICY_THIRD_PARTY', N'ar', N'شركاء الشحن'),
(N'POLICY_THIRD_PARTY', N'en', N'third party'),
(N'POLICY_THIRD_PARTY', N'en', N'delivery partners'),

(N'POLICY_CHANGES_NOTICE', N'ar', N'اشعار تغيير السياسة'),
(N'POLICY_CHANGES_NOTICE', N'ar', N'تحديث الشروط'),
(N'POLICY_CHANGES_NOTICE', N'en', N'policy changes'),
(N'POLICY_CHANGES_NOTICE', N'en', N'terms update'),

-- COMPLAINTS_CLAIMS_*
(N'COMPLAINTS_SUBMIT', N'ar', N'تقديم شكوى'),
(N'COMPLAINTS_SUBMIT', N'ar', N'ابلاغ عن مشكلة'),
(N'COMPLAINTS_SUBMIT', N'ar', N'شكاوى'),
(N'COMPLAINTS_SUBMIT', N'en', N'submit complaint'),
(N'COMPLAINTS_SUBMIT', N'en', N'file a complaint'),
(N'COMPLAINTS_SUBMIT', N'en', N'report issue'),

(N'COMPLAINTS_LOST_SHIPMENT', N'ar', N'شحنة ضائعة'),
(N'COMPLAINTS_LOST_SHIPMENT', N'ar', N'لم تصل الشحنة'),
(N'COMPLAINTS_LOST_SHIPMENT', N'ar', N'فقدت طردي'),
(N'COMPLAINTS_LOST_SHIPMENT', N'en', N'lost shipment'),
(N'COMPLAINTS_LOST_SHIPMENT', N'en', N'missing package'),
(N'COMPLAINTS_LOST_SHIPMENT', N'en', N'parcel not arrived'),

(N'COMPLAINTS_DAMAGED', N'ar', N'طرد تالف'),
(N'COMPLAINTS_DAMAGED', N'ar', N'بضاعة متضررة'),
(N'COMPLAINTS_DAMAGED', N'ar', N'ضرر في الشحنة'),
(N'COMPLAINTS_DAMAGED', N'en', N'damaged shipment'),
(N'COMPLAINTS_DAMAGED', N'en', N'broken package'),
(N'COMPLAINTS_DAMAGED', N'en', N'goods damaged'),

(N'COMPLAINTS_WRONG_DELIVERY', N'ar', N'توصيل خاطئ'),
(N'COMPLAINTS_WRONG_DELIVERY', N'ar', N'وصل لشخص ثاني'),
(N'COMPLAINTS_WRONG_DELIVERY', N'ar', N'خطأ في التوصيل'),
(N'COMPLAINTS_WRONG_DELIVERY', N'en', N'wrong delivery'),
(N'COMPLAINTS_WRONG_DELIVERY', N'en', N'misdelivery'),
(N'COMPLAINTS_WRONG_DELIVERY', N'en', N'delivered to wrong address'),

(N'COMPLAINTS_DELAYED', N'ar', N'شكوى تأخير'),
(N'COMPLAINTS_DELAYED', N'ar', N'التسليم تأخر'),
(N'COMPLAINTS_DELAYED', N'en', N'delay complaint'),
(N'COMPLAINTS_DELAYED', N'en', N'late delivery complaint'),

(N'COMPLAINTS_DRIVER_BEHAVIOR', N'ar', N'تصرف المندوب'),
(N'COMPLAINTS_DRIVER_BEHAVIOR', N'ar', N'سوء تصرف السائق'),
(N'COMPLAINTS_DRIVER_BEHAVIOR', N'en', N'driver behavior'),
(N'COMPLAINTS_DRIVER_BEHAVIOR', N'en', N'courier complaint'),

(N'COMPLAINTS_OVERCHARGED', N'ar', N'سعر زيادة'),
(N'COMPLAINTS_OVERCHARGED', N'ar', N'تحصيل زيادة'),
(N'COMPLAINTS_OVERCHARGED', N'en', N'overcharged'),
(N'COMPLAINTS_OVERCHARGED', N'en', N'wrong charge'),

(N'COMPLAINTS_TRACKING_ERROR', N'ar', N'خطأ في التتبع'),
(N'COMPLAINTS_TRACKING_ERROR', N'ar', N'معلومات التتبع غلط'),
(N'COMPLAINTS_TRACKING_ERROR', N'en', N'tracking error'),
(N'COMPLAINTS_TRACKING_ERROR', N'en', N'wrong tracking info'),

(N'COMPLAINTS_ESCALATION', N'ar', N'تصعيد الشكوى'),
(N'COMPLAINTS_ESCALATION', N'ar', N'مدير خدمة العملاء'),
(N'COMPLAINTS_ESCALATION', N'en', N'escalate complaint'),
(N'COMPLAINTS_ESCALATION', N'en', N'speak to manager'),

(N'COMPLAINTS_STATUS_UPDATE', N'ar', N'متابعة الشكوى'),
(N'COMPLAINTS_STATUS_UPDATE', N'ar', N'وين وصلت شكواي'),
(N'COMPLAINTS_STATUS_UPDATE', N'en', N'complaint status'),
(N'COMPLAINTS_STATUS_UPDATE', N'en', N'follow up complaint'),

(N'COMPLAINTS_RESOLUTION_TIME', N'ar', N'متى تحل المشكلة'),
(N'COMPLAINTS_RESOLUTION_TIME', N'ar', N'وقت حل الشكوى'),
(N'COMPLAINTS_RESOLUTION_TIME', N'en', N'resolution time'),
(N'COMPLAINTS_RESOLUTION_TIME', N'en', N'complaint resolution'),

-- FORMS_DOWNLOADS_*
(N'FORMS_SHIPPING_REQUEST', N'ar', N'نموذج طلب شحن'),
(N'FORMS_SHIPPING_REQUEST', N'ar', N'استمارة شحن'),
(N'FORMS_SHIPPING_REQUEST', N'en', N'shipping request form'),
(N'FORMS_SHIPPING_REQUEST', N'en', N'shipment order form'),

(N'FORMS_INTL_SHIPPING_REQUEST', N'ar', N'نموذج شحن دولي'),
(N'FORMS_INTL_SHIPPING_REQUEST', N'ar', N'استمارة شحن خارجي'),
(N'FORMS_INTL_SHIPPING_REQUEST', N'en', N'international shipping form'),

(N'FORMS_HEAVY_SHIPPING_REQUEST', N'ar', N'نموذج شحن ثقيل'),
(N'FORMS_HEAVY_SHIPPING_REQUEST', N'ar', N'استمارة بضائع ثقيلة'),
(N'FORMS_HEAVY_SHIPPING_REQUEST', N'en', N'heavy cargo form'),
(N'FORMS_HEAVY_SHIPPING_REQUEST', N'en', N'heavy shipment form'),

(N'FORMS_CUSTOMS_AUTHORIZATION', N'ar', N'تفويض تخليص جمركي'),
(N'FORMS_CUSTOMS_AUTHORIZATION', N'ar', N'نموذج جمرك'),
(N'FORMS_CUSTOMS_AUTHORIZATION', N'en', N'customs authorization form'),
(N'FORMS_CUSTOMS_AUTHORIZATION', N'en', N'clearance authorization'),

(N'FORMS_CONTENT_DECLARATION', N'ar', N'اعلان محتوى'),
(N'FORMS_CONTENT_DECLARATION', N'ar', N'بيان المحتويات'),
(N'FORMS_CONTENT_DECLARATION', N'en', N'content declaration form'),
(N'FORMS_CONTENT_DECLARATION', N'en', N'shipment contents'),

(N'FORMS_CUSTOMER_COMPLAINT', N'ar', N'نموذج شكوى'),
(N'FORMS_CUSTOMER_COMPLAINT', N'ar', N'استمارة شكوى'),
(N'FORMS_CUSTOMER_COMPLAINT', N'en', N'complaint form'),
(N'FORMS_CUSTOMER_COMPLAINT', N'en', N'feedback form'),

(N'FORMS_ACCOUNT_UPDATE', N'ar', N'نموذج تحديث بيانات'),
(N'FORMS_ACCOUNT_UPDATE', N'ar', N'تعديل بيانات الحساب'),
(N'FORMS_ACCOUNT_UPDATE', N'en', N'account update form'),
(N'FORMS_ACCOUNT_UPDATE', N'en', N'profile update form'),

(N'FORMS_PRICING_GUIDE', N'ar', N'دليل التسعيرة'),
(N'FORMS_PRICING_GUIDE', N'ar', N'قائمة الاسعار'),
(N'FORMS_PRICING_GUIDE', N'en', N'pricing guide'),
(N'FORMS_PRICING_GUIDE', N'en', N'rate card'),

(N'FORMS_PACKAGING_GUIDE', N'ar', N'دليل التغليف'),
(N'FORMS_PACKAGING_GUIDE', N'ar', N'ارشادات التعبئة'),
(N'FORMS_PACKAGING_GUIDE', N'en', N'packaging guide'),
(N'FORMS_PACKAGING_GUIDE', N'en', N'packing instructions'),

-- COMPANIES_INDUSTRIES_*
(N'INDUSTRIES_INDIVIDUALS', N'ar', N'افراد'),
(N'INDUSTRIES_INDIVIDUALS', N'ar', N'عملاء افراد'),
(N'INDUSTRIES_INDIVIDUALS', N'ar', N'شحن للأشخاص'),
(N'INDUSTRIES_INDIVIDUALS', N'en', N'individuals'),
(N'INDUSTRIES_INDIVIDUALS', N'en', N'personal shipping'),
(N'INDUSTRIES_INDIVIDUALS', N'en', N'consumer shipping'),

(N'INDUSTRIES_COMPANIES', N'ar', N'شركات'),
(N'INDUSTRIES_COMPANIES', N'ar', N'عملاء تجاريون'),
(N'INDUSTRIES_COMPANIES', N'ar', N'حساب شركة'),
(N'INDUSTRIES_COMPANIES', N'en', N'companies'),
(N'INDUSTRIES_COMPANIES', N'en', N'business accounts'),
(N'INDUSTRIES_COMPANIES', N'en', N'corporate clients'),

(N'INDUSTRIES_ECOMMERCE', N'ar', N'متاجر الكترونية'),
(N'INDUSTRIES_ECOMMERCE', N'ar', N'بيع اون لاين'),
(N'INDUSTRIES_ECOMMERCE', N'ar', N'سلة'),
(N'INDUSTRIES_ECOMMERCE', N'ar', N'زد'),
(N'INDUSTRIES_ECOMMERCE', N'en', N'e-commerce'),
(N'INDUSTRIES_ECOMMERCE', N'en', N'online stores'),
(N'INDUSTRIES_ECOMMERCE', N'en', N'marketplace'),

(N'INDUSTRIES_COMMERCIAL_SECTOR', N'ar', N'القطاع التجاري'),
(N'INDUSTRIES_COMMERCIAL_SECTOR', N'ar', N'تجار'),
(N'INDUSTRIES_COMMERCIAL_SECTOR', N'en', N'commercial sector'),
(N'INDUSTRIES_COMMERCIAL_SECTOR', N'en', N'traders'),

(N'INDUSTRIES_INDUSTRIAL_SECTOR', N'ar', N'قطاع صناعي'),
(N'INDUSTRIES_INDUSTRIAL_SECTOR', N'ar', N'مصانع'),
(N'INDUSTRIES_INDUSTRIAL_SECTOR', N'en', N'industrial sector'),
(N'INDUSTRIES_INDUSTRIAL_SECTOR', N'en', N'manufacturing'),

(N'INDUSTRIES_MEDICAL_SECTOR', N'ar', N'قطاع طبي'),
(N'INDUSTRIES_MEDICAL_SECTOR', N'ar', N'مستشفيات'),
(N'INDUSTRIES_MEDICAL_SECTOR', N'ar', N'شحن طبي'),
(N'INDUSTRIES_MEDICAL_SECTOR', N'en', N'medical sector'),
(N'INDUSTRIES_MEDICAL_SECTOR', N'en', N'healthcare'),
(N'INDUSTRIES_MEDICAL_SECTOR', N'en', N'medical shipping'),

(N'INDUSTRIES_GOVERNMENT', N'ar', N'جهات حكومية'),
(N'INDUSTRIES_GOVERNMENT', N'ar', N'مؤسسات حكومية'),
(N'INDUSTRIES_GOVERNMENT', N'en', N'government'),
(N'INDUSTRIES_GOVERNMENT', N'en', N'public sector'),

(N'INDUSTRIES_EDUCATION', N'ar', N'مدارس'),
(N'INDUSTRIES_EDUCATION', N'ar', N'جامعات'),
(N'INDUSTRIES_EDUCATION', N'ar', N'قطاع تعليمي'),
(N'INDUSTRIES_EDUCATION', N'en', N'education'),
(N'INDUSTRIES_EDUCATION', N'en', N'schools'),
(N'INDUSTRIES_EDUCATION', N'en', N'universities'),

(N'INDUSTRIES_CLEARANCE_COMPANIES', N'ar', N'شركات تخليص جمركي'),
(N'INDUSTRIES_CLEARANCE_COMPANIES', N'ar', N'وكلاء جمارك'),
(N'INDUSTRIES_CLEARANCE_COMPANIES', N'en', N'clearance companies'),
(N'INDUSTRIES_CLEARANCE_COMPANIES', N'en', N'customs agents'),

(N'INDUSTRIES_SHIPPING_DISTRIBUTION', N'ar', N'شركات توزيع'),
(N'INDUSTRIES_SHIPPING_DISTRIBUTION', N'ar', N'شركات شحن'),
(N'INDUSTRIES_SHIPPING_DISTRIBUTION', N'en', N'shipping companies'),
(N'INDUSTRIES_SHIPPING_DISTRIBUTION', N'en', N'distribution companies'),

(N'INDUSTRIES_IMPORTERS_EXPORTERS', N'ar', N'مستوردون'),
(N'INDUSTRIES_IMPORTERS_EXPORTERS', N'ar', N'مصدرون'),
(N'INDUSTRIES_IMPORTERS_EXPORTERS', N'ar', N'استيراد وتصدير'),
(N'INDUSTRIES_IMPORTERS_EXPORTERS', N'en', N'importers'),
(N'INDUSTRIES_IMPORTERS_EXPORTERS', N'en', N'exporters'),
(N'INDUSTRIES_IMPORTERS_EXPORTERS', N'en', N'import export'),

(N'INDUSTRIES_CONTRACT_CUSTOMERS', N'ar', N'عملاء عقود'),
(N'INDUSTRIES_CONTRACT_CUSTOMERS', N'ar', N'اتفاقيات خاصة'),
(N'INDUSTRIES_CONTRACT_CUSTOMERS', N'en', N'contract customers'),
(N'INDUSTRIES_CONTRACT_CUSTOMERS', N'en', N'contracted clients'),

-- GENERAL_FAQS_*
(N'GENERAL_WORKING_HOURS', N'ar', N'اوقات العمل'),
(N'GENERAL_WORKING_HOURS', N'ar', N'ساعات الدوام'),
(N'GENERAL_WORKING_HOURS', N'ar', N'متى تفتحون'),
(N'GENERAL_WORKING_HOURS', N'en', N'working hours'),
(N'GENERAL_WORKING_HOURS', N'en', N'office hours'),
(N'GENERAL_WORKING_HOURS', N'en', N'when are you open'),

(N'GENERAL_BRANCH_LOCATIONS', N'ar', N'مواقع الفروع'),
(N'GENERAL_BRANCH_LOCATIONS', N'ar', N'فين الفرع'),
(N'GENERAL_BRANCH_LOCATIONS', N'ar', N'عناوين الفروع'),
(N'GENERAL_BRANCH_LOCATIONS', N'en', N'branch locations'),
(N'GENERAL_BRANCH_LOCATIONS', N'en', N'nearest branch'),
(N'GENERAL_BRANCH_LOCATIONS', N'en', N'office locations'),

(N'GENERAL_CONTACT_SUPPORT', N'ar', N'تواصل مع الدعم'),
(N'GENERAL_CONTACT_SUPPORT', N'ar', N'رقم خدمة العملاء'),
(N'GENERAL_CONTACT_SUPPORT', N'ar', N'ارقام واصل'),
(N'GENERAL_CONTACT_SUPPORT', N'en', N'contact support'),
(N'GENERAL_CONTACT_SUPPORT', N'en', N'customer service number'),
(N'GENERAL_CONTACT_SUPPORT', N'en', N'help desk'),

(N'GENERAL_TRACK_SHIPMENT', N'ar', N'تتبع شحنة'),
(N'GENERAL_TRACK_SHIPMENT', N'ar', N'اين طردي'),
(N'GENERAL_TRACK_SHIPMENT', N'ar', N'كيف اتابع شحنتي'),
(N'GENERAL_TRACK_SHIPMENT', N'en', N'track shipment'),
(N'GENERAL_TRACK_SHIPMENT', N'en', N'where is my order'),
(N'GENERAL_TRACK_SHIPMENT', N'en', N'shipment tracking'),

(N'GENERAL_DELIVERY_TIME', N'ar', N'مدة التوصيل'),
(N'GENERAL_DELIVERY_TIME', N'ar', N'كم يستغرق التوصيل'),
(N'GENERAL_DELIVERY_TIME', N'ar', N'متى يصل الطرد'),
(N'GENERAL_DELIVERY_TIME', N'en', N'delivery time'),
(N'GENERAL_DELIVERY_TIME', N'en', N'how long delivery'),
(N'GENERAL_DELIVERY_TIME', N'en', N'estimated delivery'),

(N'GENERAL_CHANGE_ADDRESS', N'ar', N'تغيير العنوان'),
(N'GENERAL_CHANGE_ADDRESS', N'ar', N'تعديل عنوان التسليم'),
(N'GENERAL_CHANGE_ADDRESS', N'en', N'change address'),
(N'GENERAL_CHANGE_ADDRESS', N'en', N'update delivery address'),
(N'GENERAL_CHANGE_ADDRESS', N'en', N'redirect delivery'),

(N'GENERAL_CANCEL_REQUEST', N'ar', N'الغاء طلب'),
(N'GENERAL_CANCEL_REQUEST', N'ar', N'كيف الغي الارسالية'),
(N'GENERAL_CANCEL_REQUEST', N'en', N'cancel request'),
(N'GENERAL_CANCEL_REQUEST', N'en', N'cancel order'),
(N'GENERAL_CANCEL_REQUEST', N'en', N'how to cancel'),

(N'GENERAL_HOME_PICKUP', N'ar', N'استلام من البيت'),
(N'GENERAL_HOME_PICKUP', N'ar', N'توصيل من المنزل'),
(N'GENERAL_HOME_PICKUP', N'en', N'home pickup'),
(N'GENERAL_HOME_PICKUP', N'en', N'door to door'),
(N'GENERAL_HOME_PICKUP', N'en', N'pickup from home'),

(N'GENERAL_SHIPPING_COST', N'ar', N'تكلفة الشحن'),
(N'GENERAL_SHIPPING_COST', N'ar', N'سعر الارسالية'),
(N'GENERAL_SHIPPING_COST', N'ar', N'احسب سعر الشحن'),
(N'GENERAL_SHIPPING_COST', N'en', N'shipping cost'),
(N'GENERAL_SHIPPING_COST', N'en', N'shipping fee'),
(N'GENERAL_SHIPPING_COST', N'en', N'calculate shipping'),

(N'GENERAL_INSURANCE', N'ar', N'تامين البضاعة'),
(N'GENERAL_INSURANCE', N'ar', N'تامين الطرد'),
(N'GENERAL_INSURANCE', N'en', N'insurance'),
(N'GENERAL_INSURANCE', N'en', N'shipment insurance'),
(N'GENERAL_INSURANCE', N'en', N'cargo coverage'),

(N'GENERAL_DELAYED_SHIPMENT', N'ar', N'الشحنة تأخرت'),
(N'GENERAL_DELAYED_SHIPMENT', N'ar', N'لم يصل طردي في الموعد'),
(N'GENERAL_DELAYED_SHIPMENT', N'en', N'delayed shipment'),
(N'GENERAL_DELAYED_SHIPMENT', N'en', N'late delivery'),
(N'GENERAL_DELAYED_SHIPMENT', N'en', N'shipment not on time'),

(N'GENERAL_DAMAGED_SHIPMENT', N'ar', N'الشحنة وصلت تالفة'),
(N'GENERAL_DAMAGED_SHIPMENT', N'ar', N'بضاعة تضررت'),
(N'GENERAL_DAMAGED_SHIPMENT', N'en', N'damaged shipment'),
(N'GENERAL_DAMAGED_SHIPMENT', N'en', N'broken goods'),
(N'GENERAL_DAMAGED_SHIPMENT', N'en', N'package arrived damaged');

INSERT INTO kb_questions (topic_id, intent_key, priority, is_active)
SELECT t.id, q.intent_key, q.priority, 1
FROM @Questions q
JOIN kb_topics t ON t.code = q.topic_code
WHERE NOT EXISTS (
  SELECT 1 FROM kb_questions existing WHERE existing.intent_key = q.intent_key
);

INSERT INTO kb_question_translations (question_id, language_code, question_text)
SELECT kq.id, N'ar', src.question_ar
FROM @Questions src
JOIN kb_questions kq ON kq.intent_key = src.intent_key
WHERE NOT EXISTS (
  SELECT 1 FROM kb_question_translations qt
  WHERE qt.question_id = kq.id AND qt.language_code = N'ar'
);

INSERT INTO kb_question_translations (question_id, language_code, question_text)
SELECT kq.id, N'en', src.question_en
FROM @QuestionEnglish src
JOIN kb_questions kq ON kq.intent_key = src.intent_key
WHERE NOT EXISTS (
  SELECT 1 FROM kb_question_translations qt
  WHERE qt.question_id = kq.id AND qt.language_code = N'en'
);

INSERT INTO kb_answer_translations (question_id, language_code, answer_text)
SELECT kq.id, N'ar', src.answer_ar
FROM @Questions src
JOIN kb_questions kq ON kq.intent_key = src.intent_key
WHERE NOT EXISTS (
  SELECT 1 FROM kb_answer_translations atx
  WHERE atx.question_id = kq.id AND atx.language_code = N'ar'
);

INSERT INTO kb_answer_translations (question_id, language_code, answer_text)
SELECT kq.id, N'en', src.answer_en
FROM @QuestionEnglish src
JOIN kb_questions kq ON kq.intent_key = src.intent_key
WHERE NOT EXISTS (
  SELECT 1 FROM kb_answer_translations atx
  WHERE atx.question_id = kq.id AND atx.language_code = N'en'
);

INSERT INTO kb_question_keywords (question_id, language_code, keyword)
SELECT kq.id, kw.language_code, kw.keyword
FROM @Keywords kw
JOIN kb_questions kq ON kq.intent_key = kw.intent_key
WHERE NOT EXISTS (
  SELECT 1 FROM kb_question_keywords existing
  WHERE existing.question_id = kq.id
    AND existing.language_code = kw.language_code
    AND existing.keyword = kw.keyword
);

PRINT '=== Resources KB catalog seed complete ===';