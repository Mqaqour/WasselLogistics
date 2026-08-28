-- ============================================================
-- Migration 020: Add section grouping to resource sub-items
--
-- Restructuring the Resources page to a FedEx-style two-level model:
-- a handful of action-oriented top-level categories, each internally
-- grouped into labeled sections (e.g. "إرسال شحنة" contains the
-- sections "أنواع الخدمة", "أدلة الشحن", "التغليف", etc.) instead of
-- one flat grid of cards per category.
-- ============================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sub_items]') AND name = 'section_ar'
)
BEGIN
    ALTER TABLE [dbo].[resource_sub_items] ADD [section_ar] NVARCHAR(200) NULL;
    PRINT 'Column section_ar added to resource_sub_items.';
END
ELSE PRINT 'Column section_ar already exists — skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sub_items]') AND name = 'section_en'
)
BEGIN
    ALTER TABLE [dbo].[resource_sub_items] ADD [section_en] NVARCHAR(200) NULL;
    PRINT 'Column section_en added to resource_sub_items.';
END
ELSE PRINT 'Column section_en already exists — skipped.';
GO
