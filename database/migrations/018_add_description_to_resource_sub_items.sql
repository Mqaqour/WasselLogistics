-- ============================================================
-- Migration 018: Add admin-editable descriptions to resource sub-items
-- Previously the description shown under each sub-item card on the public
-- Resources page was hardcoded in the frontend (itemDescriptions in
-- Resources.tsx), keyed by an exact title-text match — not admin-editable
-- and silently falling back to generic text if a title changed at all.
-- This adds real columns so KB Admin can manage them like everything else.
-- ============================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sub_items]') AND name = 'description_ar'
)
BEGIN
    ALTER TABLE [dbo].[resource_sub_items] ADD [description_ar] NVARCHAR(1000) NULL;
    PRINT 'Column description_ar added to resource_sub_items.';
END
ELSE PRINT 'Column description_ar already exists — skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sub_items]') AND name = 'description_en'
)
BEGIN
    ALTER TABLE [dbo].[resource_sub_items] ADD [description_en] NVARCHAR(1000) NULL;
    PRINT 'Column description_en added to resource_sub_items.';
END
ELSE PRINT 'Column description_en already exists — skipped.';
GO

-- Backfill the "services" category with the descriptions that were previously
-- hardcoded in Resources.tsx, so this migration doesn't lose that content.
-- NOTE: sqlcmd's default input codepage mangles the Arabic literals below when
-- run via `sqlcmd -i` on Windows (the WHERE clauses silently match 0 rows) —
-- this backfill was actually applied via a small Node script using the mssql
-- driver instead, which handles UTF-8 correctly. Kept here for schema history;
-- if re-running this file with sqlcmd, use a UTF-8-aware client for this part.
UPDATE [dbo].[resource_sub_items] SET description_ar = N'خدمة مخصصة لنقل الشحنات بين الدول مع متابعة المتطلبات والإجراءات اللازمة.', description_en = N'A tailored service for moving shipments across countries with the required procedures in place.' WHERE category_code = N'services' AND title_ar = N'الشحن الدولي' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'حل سريع ومرن لتوصيل الشحنات داخل المدن والمناطق المحلية بكفاءة.', description_en = N'A fast and flexible option for delivering shipments across local cities and areas.' WHERE category_code = N'services' AND title_ar = N'الشحن المحلي' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'خدمة للشحنات الكبيرة أو الثقيلة التي تحتاج ترتيبات نقل وتجهيز خاصة.', description_en = N'Built for oversized or heavy shipments that require special handling and transport planning.' WHERE category_code = N'services' AND title_ar = N'الشحن الثقيل / Cargo' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'إنجاز معاملات التخليص الجمركي وتجهيز المستندات لتسريع عبور الشحنة.', description_en = N'Support for customs processing and paperwork to help your shipment move faster.' WHERE category_code = N'services' AND title_ar = N'التخليص الجمركي' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'مساعدة في إصدار ومتابعة مستندات عدم الممانعة المطلوبة لبعض الشحنات.', description_en = N'Assistance with obtaining and following up on no-objection documents for eligible shipments.' WHERE category_code = N'services' AND title_ar = N'خدمة عدم الممانعة' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'خدمات مخصصة لاستلام وتسليم ومعالجة معاملات الجوازات الأردنية.', description_en = N'Dedicated handling for receiving, delivering, and processing Jordanian passport-related requests.' WHERE category_code = N'services' AND title_ar = N'خدمات الجوازات الأردنية' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'تنسيق وتسليم جوازات السفارة الأمريكية بطريقة آمنة ومنظمة.', description_en = N'Secure coordination and delivery service for US embassy passports.' WHERE category_code = N'services' AND title_ar = N'خدمة توصيل جوازات السفارة الأمريكية' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'حلول تخزين وتشغيل لوجستي متكاملة لإدارة المخزون والتوزيع.', description_en = N'Integrated storage and third-party logistics solutions for inventory and distribution.' WHERE category_code = N'services' AND title_ar = N'خدمات التخزين والـ 3PL' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'استلام الشحنة من موقع العميل مباشرة لتسهيل بدء عملية الشحن.', description_en = N'We collect the shipment directly from the customer location to simplify the process.' WHERE category_code = N'services' AND title_ar = N'خدمة الاستلام من العميل' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'إيصال الشحنة إلى عنوان المستلم النهائي بسرعة وراحة أكبر.', description_en = N'A convenient service that delivers shipments directly to the final recipient address.' WHERE category_code = N'services' AND title_ar = N'خدمة التوصيل للباب' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'خدمة تحصيل قيمة الشحنة عند التسليم وتحويلها وفق آلية متفق عليها.', description_en = N'Collect shipment payments upon delivery and transfer them through an agreed settlement process.' WHERE category_code = N'services' AND title_ar = N'خدمة الدفع عند الاستلام COD' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'شحن المستندات والملفات الرسمية بسرعة مع عناية خاصة بحساسيتها.', description_en = N'Fast and careful shipping for official documents and sensitive paperwork.' WHERE category_code = N'services' AND title_ar = N'خدمة المستندات Documents' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'خدمة مخصصة للطرود بمختلف الأحجام مع خيارات شحن مناسبة.', description_en = N'A dedicated parcel service for different package sizes with suitable shipping options.' WHERE category_code = N'services' AND title_ar = N'خدمة الطرود Packages' AND description_ar IS NULL;
UPDATE [dbo].[resource_sub_items] SET description_ar = N'نقل البضائع التجارية مع مراعاة احتياجات الشركات والفواتير والوثائق.', description_en = N'Transport solutions for commercial goods with business-focused documentation support.' WHERE category_code = N'services' AND title_ar = N'خدمة البضائع التجارية' AND description_ar IS NULL;
PRINT 'Backfilled descriptions for services sub-items.';
GO
