-- ============================================================
-- Migration 024: Create novica_applications table
-- Backs the artisan application form on /novica (Wassel x Novica
-- partnership) — Palestinian craftspeople applying to sell on Novica's
-- global marketplace. Each submission is a lead followed up by the
-- Novica/Wassel team — status moves new -> contacted -> approved/rejected.
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[novica_applications]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[novica_applications] (
        [id]                    BIGINT IDENTITY(1,1) NOT NULL,
        [full_name]             NVARCHAR(200)       NOT NULL,
        [project_name]          NVARCHAR(200)       NULL,
        [city]                  NVARCHAR(100)       NOT NULL,
        [mobile]                NVARCHAR(50)        NOT NULL,
        [email]                 NVARCHAR(200)       NOT NULL,
        -- Comma-separated list of CRAFT_TYPES values — the picker allows multiple selections.
        [craft_type]            NVARCHAR(300)       NOT NULL,
        [craft_type_other]      NVARCHAR(200)       NULL,
        [has_samples]           NVARCHAR(3)         NOT NULL,
        [sells_online]          NVARCHAR(3)         NOT NULL,
        [sells_online_where]    NVARCHAR(300)       NULL,
        [website]               NVARCHAR(500)       NULL,
        [notes]                 NVARCHAR(MAX)       NULL,
        [language]              NVARCHAR(10)        NULL,
        [status]                NVARCHAR(20)        NOT NULL CONSTRAINT [DF_novica_applications_status] DEFAULT N'new',
        [email_delivery_status] NVARCHAR(20)        NOT NULL CONSTRAINT [DF_novica_applications_email_status] DEFAULT N'pending',
        [email_error]           NVARCHAR(MAX)       NULL,
        [created_at]            DATETIME2           NOT NULL CONSTRAINT [DF_novica_applications_created_at] DEFAULT SYSDATETIME(),
        [updated_at]            DATETIME2           NOT NULL CONSTRAINT [DF_novica_applications_updated_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_novica_applications] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_novica_applications_created_at] ON [dbo].[novica_applications] ([created_at] DESC);
    CREATE NONCLUSTERED INDEX [IX_novica_applications_status]     ON [dbo].[novica_applications] ([status]);

    PRINT 'Table novica_applications created.';
END
ELSE PRINT 'Table novica_applications already exists — skipped.';
GO
