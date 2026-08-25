IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[contact_message_logs]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[contact_message_logs] (
        [id]                    BIGINT IDENTITY(1,1) NOT NULL,
        [topic]                 NVARCHAR(100)       NOT NULL,
        [name]                  NVARCHAR(200)       NOT NULL,
        [mobile]                NVARCHAR(50)        NOT NULL,
        [email]                 NVARCHAR(200)       NULL,
        [message]               NVARCHAR(MAX)       NOT NULL,
        [tracking_number]       NVARCHAR(100)       NULL,
        [passport_number]       NVARCHAR(100)       NULL,
        [language]              NVARCHAR(10)        NULL,
        [ai_answer]             NVARCHAR(MAX)       NULL,
        [ai_related_topics]     NVARCHAR(MAX)       NULL,
        [email_delivery_status] NVARCHAR(20)        NOT NULL CONSTRAINT [DF_contact_logs_email_delivery_status] DEFAULT N'pending',
        [email_error]           NVARCHAR(MAX)       NULL,
        [created_at]            DATETIME2           NOT NULL CONSTRAINT [DF_contact_logs_created_at] DEFAULT SYSDATETIME(),
        [updated_at]            DATETIME2           NOT NULL CONSTRAINT [DF_contact_logs_updated_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_contact_message_logs] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_contact_message_logs_created_at] ON [dbo].[contact_message_logs] ([created_at] DESC);
    CREATE NONCLUSTERED INDEX [IX_contact_message_logs_mobile] ON [dbo].[contact_message_logs] ([mobile]);

    PRINT 'Table contact_message_logs created.';
END
ELSE PRINT 'Table contact_message_logs already exists — skipped.';
GO