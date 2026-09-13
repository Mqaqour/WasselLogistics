-- ============================================================
-- Migration 025: Widen novica_applications.craft_type + add website column
-- The craft-type picker on /novica became multi-select, so craft_type now
-- stores a comma-separated list (e.g. 'embroidery,pottery') instead of a
-- single value — NVARCHAR(50) is no longer wide enough. Also adds an
-- optional 'website' column for the applicant's existing site/page.
-- Safe to run whether or not 024 already created the table with the old
-- (narrower) column — every statement below is a no-op if already applied.
-- ============================================================
IF EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[novica_applications]') AND type = 'U'
)
BEGIN
    IF EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID(N'[dbo].[novica_applications]')
          AND name = 'craft_type' AND max_length < 600 -- NVARCHAR stores 2 bytes/char
    )
    BEGIN
        ALTER TABLE [dbo].[novica_applications] ALTER COLUMN [craft_type] NVARCHAR(300) NOT NULL;
        PRINT 'novica_applications.craft_type widened to NVARCHAR(300).';
    END

    IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID(N'[dbo].[novica_applications]') AND name = 'website'
    )
    BEGIN
        ALTER TABLE [dbo].[novica_applications] ADD [website] NVARCHAR(500) NULL;
        PRINT 'novica_applications.website added.';
    END
END
ELSE PRINT 'Table novica_applications does not exist yet — run migration 024 first.';
GO
