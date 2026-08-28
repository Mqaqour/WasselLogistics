IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[system_settings]') AND type = 'U'
)
BEGIN
    -- Generic key/value store for admin-editable runtime settings — lets the admin
    -- change things like notification recipient emails from the portal instead of
    -- editing .env and redeploying. Missing keys fall back to the .env default in code.
    CREATE TABLE [dbo].[system_settings] (
        [setting_key]   NVARCHAR(100) NOT NULL,
        [setting_value] NVARCHAR(MAX) NOT NULL,
        [updated_at]    DATETIME2     NOT NULL CONSTRAINT [DF_system_settings_updated_at] DEFAULT SYSDATETIME(),
        [updated_by]    NVARCHAR(200) NULL,

        CONSTRAINT [PK_system_settings] PRIMARY KEY CLUSTERED ([setting_key] ASC)
    );

    PRINT 'Table system_settings created.';
END
ELSE PRINT 'Table system_settings already exists — skipped.';
GO
