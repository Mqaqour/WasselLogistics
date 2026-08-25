-- ============================================================
-- Migration 008: Resource Category Cards
-- Controls the visual cards shown on the Resources page.
-- Run against wasselwebdb (Azure SQL / SQL Server).
-- Idempotent: safe to re-run.
-- ============================================================

IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_categories]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[resource_categories] (
        [id]             INT IDENTITY(1,1)  NOT NULL,
        [code]           NVARCHAR(100)      NOT NULL,
        [title_ar]       NVARCHAR(255)      NOT NULL,
        [title_en]       NVARCHAR(255)      NULL,
        [description_ar] NVARCHAR(MAX)      NULL,
        [description_en] NVARCHAR(MAX)      NULL,
        [image_url]      NVARCHAR(MAX)      NULL,
        [sort_order]     INT                NOT NULL CONSTRAINT [DF_rc_sort_order]  DEFAULT 0,
        [is_active]      BIT                NOT NULL CONSTRAINT [DF_rc_is_active]   DEFAULT 1,
        [created_at]     DATETIME2          NOT NULL CONSTRAINT [DF_rc_created_at]  DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_resource_categories]      PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_resource_categories_code] UNIQUE NONCLUSTERED ([code])
    );
    PRINT 'Table resource_categories created.';
END
ELSE PRINT 'Table resource_categories already exists — skipped.';
GO

-- Seed with the existing hardcoded cards (skip if already present)
IF NOT EXISTS (SELECT 1 FROM [dbo].[resource_categories] WHERE code = 'services')
BEGIN
    INSERT INTO [dbo].[resource_categories] (code, title_ar, title_en, description_ar, description_en, image_url, sort_order, is_active) VALUES
      (N'services',          N'الخدمات',              N'Services',                    N'تعرّف على جميع خدمات الشحن والخدمات اللوجستية المتاحة للأفراد والشركات.',    N'Explore all shipping and logistics services available for individuals and businesses.',  N'/assets/services.png',          1,  1),
      (N'shipping-guides',   N'أدلة الشحن',           N'Shipping Guides',             N'أدلة خطوة بخطوة لمساعدتك في تجهيز الشحنات وطلبها وتسليمها بسهولة.',        N'Step-by-step guides to help you prepare, book, and deliver shipments smoothly.',         N'/assets/shipping-guides.png',   2,  1),
      (N'tracking-status',   N'التتبع وحالة الشحنة',  N'Tracking & Shipment Status',  N'تعرّف على آلية التتبع ومعاني حالات الشحنة المختلفة.',                       N'Learn how tracking works and what each shipment status means.',                          NULL,                             3,  1),
      (N'packaging',         N'التغليف',              N'Packaging',                   N'أفضل الممارسات لتغليف الشحنات بشكل آمن واحترافي.',                           N'Best practices for packing shipments safely and professionally.',                        N'/assets/packaging.png',         4,  1),
      (N'prohibited-items',  N'المواد المحظورة',      N'Prohibited & Restricted Items',N'اطّلع على المواد الممنوعة والمقيّدة قبل إنشاء شحنتك.',                    N'Check restricted and prohibited items before creating your shipment.',                   N'/assets/prohibited-items.png',  5,  1),
      (N'customs-clearance', N'الجمارك والتخليص',     N'Customs & Clearance',         N'كل ما يتعلق بالمستندات الجمركية والرسوم ومتطلبات التخليص.',                 N'Everything related to customs paperwork, duties, and clearance requirements.',           N'/assets/customs-clearance.png', 6,  1),
      (N'accounts-payments', N'الحسابات والدفع',      N'Accounts & Payments',         N'معلومات عن الحسابات والفوترة وطرق الدفع والإجراءات المالية.',               N'Information about accounts, invoicing, payment methods, and financial processes.',       N'/assets/accounts-payments.png', 7,  1),
      (N'policies-terms',    N'السياسات والشروط',     N'Policies & Terms',            N'راجع السياسات التشغيلية وشروط الخدمة والتزامات العميل.',                    N'Review the operational policies, service terms, and customer obligations.',              N'/assets/policies-terms.png',    8,  1),
      (N'complaints-claims', N'الشكاوى والمطالبات',  N'Complaints & Claims',         N'اعرف الإجراء الصحيح لتقديم الشكاوى والتصعيد والمطالبات.',                  N'Find the right process for complaints, escalations, and compensation claims.',           NULL,                             9,  1),
      (N'forms-downloads',   N'النماذج والتنزيلات',  N'Forms & Downloads',           N'الوصول إلى أهم النماذج والقوالب والملفات القابلة للتنزيل.',                 N'Access the most important forms, templates, and downloadable resources.',                NULL,                             10, 1),
      (N'general-questions', N'أسئلة عامة',           N'General Questions',           N'إجابات سريعة على الأسئلة العامة حول الفروع والتوصيل والدعم وغيرها.',        N'Quick answers to common questions about branches, delivery, support, and more.',         NULL,                             11, 1);
    PRINT 'resource_categories seeded.';
END
ELSE PRINT 'resource_categories seed already present — skipped.';
GO
