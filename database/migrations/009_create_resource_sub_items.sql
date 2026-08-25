-- ============================================================
-- Migration 009: Resource Sub-Items
-- The clickable topic cards shown inside each resource group.
-- Run against wasselwebdb (Azure SQL / SQL Server).
-- Idempotent: safe to re-run.
-- ============================================================

IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sub_items]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[resource_sub_items] (
        [id]            INT IDENTITY(1,1)  NOT NULL,
        [category_code] NVARCHAR(100)      NOT NULL,
        [title_ar]      NVARCHAR(500)      NOT NULL,
        [title_en]      NVARCHAR(500)      NULL,
        [sort_order]    INT                NOT NULL CONSTRAINT [DF_rsi_sort_order] DEFAULT 0,
        [is_active]     BIT                NOT NULL CONSTRAINT [DF_rsi_is_active]  DEFAULT 1,
        [created_at]    DATETIME2          NOT NULL CONSTRAINT [DF_rsi_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_resource_sub_items] PRIMARY KEY CLUSTERED ([id] ASC)
    );
    CREATE INDEX [IX_rsi_category_code] ON [dbo].[resource_sub_items] ([category_code]);
    PRINT 'Table resource_sub_items created.';
END
ELSE PRINT 'Table resource_sub_items already exists — skipped.';
GO

-- ── services ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'services')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'services', N'الشحن الدولي',                                N'International Shipping',                1),
      (N'services', N'الشحن المحلي',                                N'Domestic Shipping',                     2),
      (N'services', N'الشحن الثقيل / Cargo',                       N'Heavy Shipping / Cargo',                3),
      (N'services', N'التخليص الجمركي',                             N'Customs Clearance',                     4),
      (N'services', N'خدمة عدم الممانعة',                           N'No-Objection Service',                  5),
      (N'services', N'خدمات الجوازات الأردنية',                     N'Jordanian Passport Services',           6),
      (N'services', N'خدمة توصيل جوازات السفارة الأمريكية',         N'US Embassy Passport Delivery Service',  7),
      (N'services', N'خدمات التخزين والـ 3PL',                      N'Storage and 3PL Services',              8),
      (N'services', N'خدمة الاستلام من العميل',                     N'Customer Pickup Service',               9),
      (N'services', N'خدمة التوصيل للباب',                          N'Door Delivery Service',                10),
      (N'services', N'خدمة الدفع عند الاستلام COD',                 N'Cash on Delivery (COD)',               11),
      (N'services', N'خدمة المستندات Documents',                    N'Documents Service',                    12),
      (N'services', N'خدمة الطرود Packages',                        N'Packages Service',                     13),
      (N'services', N'خدمة البضائع التجارية',                       N'Commercial Goods Service',             14);
    PRINT 'services sub-items seeded.';
END
GO

-- ── shipping-guides ───────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'shipping-guides')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'shipping-guides', N'كيف أبدأ طلب شحن؟',                    N'How do I start a shipping request?',         1),
      (N'shipping-guides', N'خطوات تجهيز الشحنة',                    N'Shipment preparation steps',                 2),
      (N'shipping-guides', N'الفرق بين شحن المستندات والطرود',        N'Difference between document and package shipping', 3),
      (N'shipping-guides', N'كيفية حساب الوزن الحجمي',               N'How to calculate volumetric weight',         4),
      (N'shipping-guides', N'كيفية اختيار نوع الخدمة المناسبة',      N'How to choose the right service type',       5),
      (N'shipping-guides', N'كيفية تتبع الشحنة',                     N'How to track a shipment',                    6),
      (N'shipping-guides', N'كيفية تجهيز شحنة دولية',                N'How to prepare an international shipment',   7),
      (N'shipping-guides', N'كيفية تجهيز شحنة محلية',                N'How to prepare a domestic shipment',         8),
      (N'shipping-guides', N'كيفية طلب استلام من الموقع',             N'How to request pickup from location',        9),
      (N'shipping-guides', N'كيفية طباعة بوليصة الشحن',              N'How to print a shipping waybill',           10),
      (N'shipping-guides', N'كيفية إرفاق المستندات المطلوبة',        N'How to attach required documents',          11),
      (N'shipping-guides', N'خطوات تسليم الشحنة للفرع',              N'Shipment drop-off steps at branch',         12),
      (N'shipping-guides', N'خطوات الاستلام من العميل',               N'Customer pickup steps',                     13);
    PRINT 'shipping-guides sub-items seeded.';
END
GO

-- ── tracking-status ───────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'tracking-status')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'tracking-status', N'كيفية تتبع الشحنة',                             N'How to track a shipment',                        1),
      (N'tracking-status', N'شرح حالات التتبع',                              N'Shipment status explanation',                    2),
      (N'tracking-status', N'تم إنشاء الشحنة',                               N'Shipment created',                               3),
      (N'tracking-status', N'تم استلام الشحنة',                              N'Shipment received',                              4),
      (N'tracking-status', N'قيد المعالجة',                                  N'In processing',                                  5),
      (N'tracking-status', N'خرجت للتوصيل',                                  N'Out for delivery',                               6),
      (N'tracking-status', N'تم التسليم',                                    N'Delivered',                                      7),
      (N'tracking-status', N'محاولة تسليم فاشلة',                            N'Failed delivery attempt',                        8),
      (N'tracking-status', N'الشحنة قيد التخليص',                            N'Shipment in customs clearance',                  9),
      (N'tracking-status', N'الشحنة بحاجة إلى معلومات إضافية',              N'Shipment needs additional information',          10),
      (N'tracking-status', N'الشحنة متأخرة',                                 N'Shipment delayed',                              11),
      (N'tracking-status', N'ماذا أفعل إذا لم تظهر حالة التتبع؟',           N'What if tracking status does not appear?',      12),
      (N'tracking-status', N'ماذا أفعل إذا كانت حالة الشحنة غير واضحة؟',   N'What if shipment status is unclear?',           13);
    PRINT 'tracking-status sub-items seeded.';
END
GO

-- ── packaging ─────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'packaging')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'packaging', N'إرشادات تغليف المستندات',          N'Document packaging guidelines',             1),
      (N'packaging', N'إرشادات تغليف الطرود',              N'Package packaging guidelines',              2),
      (N'packaging', N'تغليف المواد القابلة للكسر',        N'Fragile items packaging',                   3),
      (N'packaging', N'تغليف الأجهزة الإلكترونية',         N'Electronics packaging',                     4),
      (N'packaging', N'تغليف الملابس والمنتجات الخفيفة',   N'Clothing and light products packaging',     5),
      (N'packaging', N'تغليف السوائل والمواد الحساسة',     N'Liquids and sensitive materials packaging', 6),
      (N'packaging', N'استخدام الكرتون المناسب',           N'Using the right carton',                    7),
      (N'packaging', N'استخدام مواد الحماية الداخلية',     N'Using internal protective materials',       8),
      (N'packaging', N'طريقة إغلاق الطرد بشكل آمن',       N'How to seal parcel securely',               9),
      (N'packaging', N'الأخطاء الشائعة في التغليف',        N'Common packaging mistakes',                10),
      (N'packaging', N'متى يجب استخدام Pallet؟',           N'When should a pallet be used?',            11),
      (N'packaging', N'تعليمات كتابة العنوان على الشحنة',  N'How to write address on shipment',         12);
    PRINT 'packaging sub-items seeded.';
END
GO

-- ── prohibited-items ──────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'prohibited-items')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'prohibited-items', N'المواد المحظورة محلياً',                   N'Locally prohibited items',                 1),
      (N'prohibited-items', N'المواد المحظورة دولياً',                   N'Internationally prohibited items',         2),
      (N'prohibited-items', N'المواد الخطرة Dangerous Goods',            N'Dangerous goods',                          3),
      (N'prohibited-items', N'السوائل والمواد الكيميائية',               N'Liquids and chemicals',                    4),
      (N'prohibited-items', N'البطاريات والأجهزة الإلكترونية',           N'Batteries and electronics',               5),
      (N'prohibited-items', N'الأدوية والمستلزمات الطبية',               N'Medicines and medical supplies',           6),
      (N'prohibited-items', N'المواد الغذائية',                           N'Food items',                               7),
      (N'prohibited-items', N'الأموال والمعادن الثمينة',                 N'Cash and precious metals',                 8),
      (N'prohibited-items', N'الوثائق الرسمية الحساسة',                  N'Sensitive official documents',             9),
      (N'prohibited-items', N'الأسلحة والأدوات الحادة',                  N'Weapons and sharp tools',                 10),
      (N'prohibited-items', N'المنتجات التي تحتاج موافقات خاصة',        N'Products requiring special approvals',    11),
      (N'prohibited-items', N'الفرق بين ممنوع ومقيّد',                   N'Difference between prohibited and restricted', 12),
      (N'prohibited-items', N'ماذا يحدث إذا تم إرسال مادة محظورة؟',    N'What happens if a prohibited item is shipped?', 13);
    PRINT 'prohibited-items sub-items seeded.';
END
GO

-- ── customs-clearance ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'customs-clearance')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'customs-clearance', N'متطلبات التخليص الجمركي',                    N'Customs clearance requirements',                  1),
      (N'customs-clearance', N'الفاتورة التجارية Commercial Invoice',        N'Commercial invoice',                              2),
      (N'customs-clearance', N'وصف محتويات الشحنة',                         N'Shipment contents description',                   3),
      (N'customs-clearance', N'القيمة المصرّح عنها',                        N'Declared value',                                  4),
      (N'customs-clearance', N'الرسوم الجمركية والضرائب',                   N'Customs duties and taxes',                        5),
      (N'customs-clearance', N'الشحنات التجارية',                           N'Commercial shipments',                            6),
      (N'customs-clearance', N'الشحنات الشخصية',                            N'Personal shipments',                              7),
      (N'customs-clearance', N'مستندات الاستيراد',                          N'Import documents',                                8),
      (N'customs-clearance', N'مستندات التصدير',                            N'Export documents',                                9),
      (N'customs-clearance', N'أسباب تأخير التخليص',                       N'Reasons for customs delays',                     10),
      (N'customs-clearance', N'الدول التي تتطلب مستندات إضافية',           N'Countries requiring additional documents',       11),
      (N'customs-clearance', N'آلية دفع الرسوم الجمركية',                  N'How to pay customs fees',                        12),
      (N'customs-clearance', N'مسؤولية العميل عن البيانات الجمركية',       N'Customer responsibility for customs data',       13);
    PRINT 'customs-clearance sub-items seeded.';
END
GO

-- ── accounts-payments ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'accounts-payments')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'accounts-payments', N'فتح حساب تجاري',                 N'Open a business account',           1),
      (N'accounts-payments', N'أنواع الحسابات',                  N'Account types',                     2),
      (N'accounts-payments', N'آلية التسعير للعملاء',            N'Customer pricing mechanism',         3),
      (N'accounts-payments', N'طرق الدفع المتاحة',               N'Available payment methods',          4),
      (N'accounts-payments', N'الدفع النقدي',                    N'Cash payment',                      5),
      (N'accounts-payments', N'الدفع عبر POS',                   N'POS payment',                       6),
      (N'accounts-payments', N'الدفع عند الاستلام COD',          N'Cash on delivery (COD)',             7),
      (N'accounts-payments', N'الفواتير الشهرية',                N'Monthly invoices',                  8),
      (N'accounts-payments', N'كشف الحساب',                      N'Account statement',                 9),
      (N'accounts-payments', N'الحدود الائتمانية',               N'Credit limits',                    10),
      (N'accounts-payments', N'آلية تسوية المبالغ',              N'Amount settlement mechanism',      11),
      (N'accounts-payments', N'رسوم الخدمات الإضافية',           N'Additional service fees',          12),
      (N'accounts-payments', N'الاستفسار عن فاتورة',             N'Invoice inquiry',                  13),
      (N'accounts-payments', N'الاعتراض على فاتورة',             N'Invoice dispute',                  14);
    PRINT 'accounts-payments sub-items seeded.';
END
GO

-- ── policies-terms ────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'policies-terms')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'policies-terms', N'سياسة الشحن الدولي',                   N'International shipping policy',          1),
      (N'policies-terms', N'سياسة الشحن المحلي',                   N'Domestic shipping policy',               2),
      (N'policies-terms', N'سياسة الأسعار والرسوم',                N'Pricing and fees policy',                3),
      (N'policies-terms', N'سياسة التغليف',                        N'Packaging policy',                       4),
      (N'policies-terms', N'سياسة المواد المحظورة',                N'Prohibited items policy',                5),
      (N'policies-terms', N'سياسة المسؤولية والتعويض',             N'Liability and compensation policy',      6),
      (N'policies-terms', N'سياسة تقديم الشكاوى',                  N'Complaint submission policy',            7),
      (N'policies-terms', N'سياسة الاسترداد',                      N'Refund policy',                          8),
      (N'policies-terms', N'سياسة الدفع والتحصيل',                 N'Payment and collection policy',          9),
      (N'policies-terms', N'سياسة الحسابات التجارية',              N'Business accounts policy',              10),
      (N'policies-terms', N'سياسة الخصوصية وحماية البيانات',      N'Privacy and data protection policy',    11),
      (N'policies-terms', N'شروط استخدام خدمات واصل',             N'Wassel services terms of use',          12),
      (N'policies-terms', N'سياسة التأخير أو عدم التسليم',         N'Delay or non-delivery policy',          13),
      (N'policies-terms', N'سياسة العناوين غير الصحيحة',           N'Incorrect addresses policy',            14),
      (N'policies-terms', N'سياسة التخزين المؤقت للطرود',          N'Temporary parcel storage policy',       15);
    PRINT 'policies-terms sub-items seeded.';
END
GO

-- ── complaints-claims ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'complaints-claims')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'complaints-claims', N'تقديم شكوى على شحنة',                    N'Submit a shipment complaint',          1),
      (N'complaints-claims', N'تقديم مطالبة تعويض',                     N'Submit a compensation claim',          2),
      (N'complaints-claims', N'مطالبة تلف الشحنة',                      N'Damaged shipment claim',               3),
      (N'complaints-claims', N'مطالبة فقدان الشحنة',                    N'Lost shipment claim',                  4),
      (N'complaints-claims', N'مطالبة تأخير الشحنة',                    N'Delayed shipment claim',               5),
      (N'complaints-claims', N'المستندات المطلوبة للمطالبة',             N'Required claim documents',             6),
      (N'complaints-claims', N'مدة معالجة الشكوى',                      N'Complaint processing duration',        7),
      (N'complaints-claims', N'متابعة حالة الشكوى',                     N'Track complaint status',               8),
      (N'complaints-claims', N'حالات لا تشملها المسؤولية',              N'Cases not covered by liability',       9),
      (N'complaints-claims', N'كيفية التواصل مع خدمة العملاء',          N'How to contact customer service',     10),
      (N'complaints-claims', N'تصعيد الشكوى للإدارة المختصة',           N'Escalate complaint to management',    11);
    PRINT 'complaints-claims sub-items seeded.';
END
GO

-- ── forms-downloads ───────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'forms-downloads')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'forms-downloads', N'نموذج الفاتورة التجارية',              N'Commercial invoice form',                  1),
      (N'forms-downloads', N'نموذج التصريح الجمركي',                N'Customs declaration form',                 2),
      (N'forms-downloads', N'نموذج المطالبة',                       N'Claim form',                               3),
      (N'forms-downloads', N'نموذج طلب فتح حساب',                   N'Account opening request form',             4),
      (N'forms-downloads', N'نموذج طلب شحن دولي',                   N'International shipping request form',      5),
      (N'forms-downloads', N'نموذج طلب شحن ثقيل',                   N'Heavy shipping request form',              6),
      (N'forms-downloads', N'نموذج تفويض التخليص الجمركي',          N'Customs clearance authorization form',     7),
      (N'forms-downloads', N'نموذج إقرار محتويات الشحنة',           N'Shipment contents declaration form',       8),
      (N'forms-downloads', N'نموذج شكوى عميل',                      N'Customer complaint form',                  9),
      (N'forms-downloads', N'نموذج تحديث بيانات الحساب',            N'Account data update form',                10),
      (N'forms-downloads', N'دليل الأسعار والخدمات',                N'Pricing and services guide',              11),
      (N'forms-downloads', N'دليل التغليف',                          N'Packaging guide',                         12);
    PRINT 'forms-downloads sub-items seeded.';
END
GO

-- ── general-questions ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_sub_items] WHERE category_code = 'general-questions')
BEGIN
    INSERT INTO [dbo].[resource_sub_items] (category_code, title_ar, title_en, sort_order) VALUES
      (N'general-questions', N'ما هي ساعات العمل؟',                    N'What are working hours?',                      1),
      (N'general-questions', N'أين تقع فروع واصل؟',                    N'Where are Wassel branches located?',           2),
      (N'general-questions', N'كيف أتواصل مع خدمة العملاء؟',           N'How do I contact customer service?',           3),
      (N'general-questions', N'كيف أتتبع شحنتي؟',                      N'How do I track my shipment?',                  4),
      (N'general-questions', N'ما هي مدة التوصيل؟',                    N'What is the delivery duration?',               5),
      (N'general-questions', N'هل يمكن تغيير عنوان التسليم؟',          N'Can I change the delivery address?',           6),
      (N'general-questions', N'هل يمكن إلغاء طلب الشحن؟',             N'Can I cancel the shipping request?',           7),
      (N'general-questions', N'هل يوجد استلام من المنزل أو الشركة؟',   N'Is there pickup from home or company?',        8),
      (N'general-questions', N'كيف أعرف تكلفة الشحن؟',                N'How do I know shipping cost?',                 9),
      (N'general-questions', N'هل يوجد تأمين على الشحنة؟',            N'Is there shipment insurance?',                10),
      (N'general-questions', N'ماذا أفعل إذا تأخرت الشحنة؟',          N'What should I do if shipment is delayed?',    11),
      (N'general-questions', N'ماذا أفعل إذا وصلت الشحنة تالفة؟',     N'What should I do if shipment arrives damaged?', 12);
    PRINT 'general-questions sub-items seeded.';
END
GO
