-- ============================================================
-- Migration 003: Create chat_events table
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[chat_events]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[chat_events] (
        [id]          BIGINT IDENTITY(1,1)    NOT NULL,
        [session_id]  NVARCHAR(100)           NULL,
        [contact_id]  NVARCHAR(50)            NULL,
        [event_type]  NVARCHAR(100)           NOT NULL,
        [raw_payload] NVARCHAR(MAX)           NULL,
        [created_at]  DATETIME2               NOT NULL CONSTRAINT [DF_chat_events_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_chat_events] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_chat_events_session_id]  ON [dbo].[chat_events] ([session_id]);
    CREATE NONCLUSTERED INDEX [IX_chat_events_contact_id]  ON [dbo].[chat_events] ([contact_id]);
    CREATE NONCLUSTERED INDEX [IX_chat_events_event_type]  ON [dbo].[chat_events] ([event_type]);

    PRINT 'Table chat_events created.';
END
ELSE
BEGIN
    PRINT 'Table chat_events already exists. Skipped.';
END
GO
