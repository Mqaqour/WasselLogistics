-- ============================================================
-- Migration 021: Resource Sections
-- Persistent sections inside each resource card. Titles remain in
-- resource_sub_items and reference a section by its localized name.
-- ============================================================

IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sections]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[resource_sections] (
        [id]            INT IDENTITY(1,1) NOT NULL,
        [category_code] NVARCHAR(100)     NOT NULL,
        [title_ar]      NVARCHAR(200)     NOT NULL,
        [title_en]      NVARCHAR(200)     NULL,
        [sort_order]    INT               NOT NULL CONSTRAINT [DF_resource_sections_sort_order] DEFAULT 0,
        [is_active]     BIT               NOT NULL CONSTRAINT [DF_resource_sections_is_active] DEFAULT 1,
        [created_at]    DATETIME2         NOT NULL CONSTRAINT [DF_resource_sections_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_resource_sections] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_resource_sections_category_title_ar] UNIQUE ([category_code], [title_ar])
    );

    CREATE INDEX [IX_resource_sections_category_code]
        ON [dbo].[resource_sections] ([category_code], [sort_order]);
    PRINT 'Table resource_sections created.';
END
ELSE PRINT 'Table resource_sections already exists - skipped.';
GO
