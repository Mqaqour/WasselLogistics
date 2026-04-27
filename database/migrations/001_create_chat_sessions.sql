-- ============================================================
-- Migration 001: Create chat_sessions table
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[chat_sessions]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[chat_sessions] (
        [id]                  BIGINT IDENTITY(1,1)    NOT NULL,
        [session_id]          NVARCHAR(100)           NOT NULL,
        [contact_id]          NVARCHAR(50)            NOT NULL,
        [phone]               NVARCHAR(30)            NOT NULL,
        [first_name]          NVARCHAR(100)           NULL,
        [last_name]           NVARCHAR(100)           NULL,
        [email]               NVARCHAR(150)           NULL,
        [service_type]        NVARCHAR(100)           NULL,
        [tracking_number]     NVARCHAR(100)           NULL,
        [language]            NVARCHAR(10)            NOT NULL CONSTRAINT [DF_chat_sessions_language] DEFAULT 'ar',
        [status]              NVARCHAR(50)            NOT NULL CONSTRAINT [DF_chat_sessions_status]   DEFAULT 'open',
        [assigned_department] NVARCHAR(100)           NULL,
        [created_at]          DATETIME2               NOT NULL CONSTRAINT [DF_chat_sessions_created_at] DEFAULT SYSDATETIME(),
        [updated_at]          DATETIME2               NOT NULL CONSTRAINT [DF_chat_sessions_updated_at] DEFAULT SYSDATETIME(),
        [closed_at]           DATETIME2               NULL,

        CONSTRAINT [PK_chat_sessions]         PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_chat_sessions_session] UNIQUE NONCLUSTERED ([session_id])
    );

    CREATE NONCLUSTERED INDEX [IX_chat_sessions_contact_id] ON [dbo].[chat_sessions] ([contact_id]);
    CREATE NONCLUSTERED INDEX [IX_chat_sessions_phone]      ON [dbo].[chat_sessions] ([phone]);
    CREATE NONCLUSTERED INDEX [IX_chat_sessions_status]     ON [dbo].[chat_sessions] ([status]);

    PRINT 'Table chat_sessions created.';
END
ELSE
BEGIN
    PRINT 'Table chat_sessions already exists. Skipped.';
END
GO
