IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[shipping_request_logs]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[shipping_request_logs] (
        [id]                    BIGINT IDENTITY(1,1) NOT NULL,
        [request_type]          NVARCHAR(20)        NOT NULL,
        [customer_name]         NVARCHAR(200)       NOT NULL,
        [customer_phone]        NVARCHAR(50)        NOT NULL,
        [customer_email]        NVARCHAR(200)       NULL,
        [is_document]           BIT                 NOT NULL,
        [weight]                DECIMAL(10,2)       NOT NULL,
        [pkg_length]            INT                 NULL,
        [pkg_width]             INT                 NULL,
        [pkg_height]            INT                 NULL,
        [origin_country]        NVARCHAR(100)       NULL,
        [origin_city]           NVARCHAR(100)       NULL,
        [origin_zip]            NVARCHAR(50)        NULL,
        [dest_country]          NVARCHAR(100)       NULL,
        [dest_city]             NVARCHAR(100)       NULL,
        [dest_zip]              NVARCHAR(50)        NULL,
        [provider]              NVARCHAR(100)       NULL,
        [service]               NVARCHAR(100)       NULL,
        [price]                 DECIMAL(10,2)       NULL,
        [currency]              NVARCHAR(10)        NULL,
        [delivery_estimate]     NVARCHAR(200)       NULL,
        [language]              NVARCHAR(10)        NULL,
        [email_delivery_status] NVARCHAR(20)        NOT NULL CONSTRAINT [DF_shipping_request_logs_email_delivery_status] DEFAULT N'pending',
        [email_error]           NVARCHAR(MAX)       NULL,
        [created_at]            DATETIME2           NOT NULL CONSTRAINT [DF_shipping_request_logs_created_at] DEFAULT SYSDATETIME(),
        [updated_at]            DATETIME2           NOT NULL CONSTRAINT [DF_shipping_request_logs_updated_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_shipping_request_logs] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_shipping_request_logs_created_at] ON [dbo].[shipping_request_logs] ([created_at] DESC);
    CREATE NONCLUSTERED INDEX [IX_shipping_request_logs_customer_phone] ON [dbo].[shipping_request_logs] ([customer_phone]);

    PRINT 'Table shipping_request_logs created.';
END
ELSE PRINT 'Table shipping_request_logs already exists — skipped.';
GO
