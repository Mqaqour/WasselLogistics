-- ============================================================
-- Migration 022: Create business_account_requests table
-- Backs the "Open Account" wizard launched from the floating action bar. Each
-- submission is a corporate lead the sales team follows up on from the portal
-- (/admin/business-accounts) — status moves new -> contacted -> approved/rejected.
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[business_account_requests]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[business_account_requests] (
        [id]                    BIGINT IDENTITY(1,1) NOT NULL,
        -- JSON array of the selected service ids, e.g. ["domestic","customs"]
        [services]              NVARCHAR(MAX)        NULL,
        [company_name]          NVARCHAR(200)       NOT NULL,
        [company_reg_no]        NVARCHAR(100)       NULL,
        [industry]              NVARCHAR(100)       NULL,
        [website]               NVARCHAR(200)       NULL,
        [monthly_volume_band]   NVARCHAR(50)        NULL,
        [contact_name]          NVARCHAR(200)       NOT NULL,
        [contact_role]          NVARCHAR(100)       NULL,
        [contact_email]         NVARCHAR(200)       NOT NULL,
        [contact_phone]         NVARCHAR(50)        NOT NULL,
        [pickup_city]           NVARCHAR(100)       NULL,
        [pickup_area]           NVARCHAR(200)       NULL,
        [destinations]          NVARCHAR(MAX)       NULL,
        [notes]                 NVARCHAR(MAX)       NULL,
        [language]              NVARCHAR(10)        NULL,
        [status]                NVARCHAR(20)        NOT NULL CONSTRAINT [DF_business_account_requests_status] DEFAULT N'new',
        [email_delivery_status] NVARCHAR(20)        NOT NULL CONSTRAINT [DF_business_account_requests_email_status] DEFAULT N'pending',
        [email_error]           NVARCHAR(MAX)       NULL,
        [created_at]            DATETIME2           NOT NULL CONSTRAINT [DF_business_account_requests_created_at] DEFAULT SYSDATETIME(),
        [updated_at]            DATETIME2           NOT NULL CONSTRAINT [DF_business_account_requests_updated_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_business_account_requests] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_business_account_requests_created_at] ON [dbo].[business_account_requests] ([created_at] DESC);
    CREATE NONCLUSTERED INDEX [IX_business_account_requests_status]     ON [dbo].[business_account_requests] ([status]);

    PRINT 'Table business_account_requests created.';
END
ELSE PRINT 'Table business_account_requests already exists — skipped.';
GO
