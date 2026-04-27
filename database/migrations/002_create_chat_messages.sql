-- ============================================================
-- Migration 002: Create chat_messages table
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[chat_messages]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[chat_messages] (
        [id]                  BIGINT IDENTITY(1,1)    NOT NULL,
        [session_id]          NVARCHAR(100)           NOT NULL,
        [contact_id]          NVARCHAR(50)            NOT NULL,
        [message_id]          NVARCHAR(100)           NOT NULL,
        [respond_message_id]  NVARCHAR(100)           NULL,
        [sender_type]         NVARCHAR(30)            NOT NULL,  -- visitor | agent | system
        [message_type]        NVARCHAR(30)            NOT NULL CONSTRAINT [DF_chat_messages_message_type] DEFAULT 'text',
        [message_text]        NVARCHAR(MAX)           NULL,
        [attachment_url]      NVARCHAR(1000)          NULL,
        [status]              NVARCHAR(30)            NOT NULL CONSTRAINT [DF_chat_messages_status] DEFAULT 'sent',
        [raw_payload]         NVARCHAR(MAX)           NULL,
        [created_at]          DATETIME2               NOT NULL CONSTRAINT [DF_chat_messages_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_chat_messages]          PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_chat_messages_msg_id]   UNIQUE NONCLUSTERED ([message_id])
    );

    CREATE NONCLUSTERED INDEX [IX_chat_messages_session_id]  ON [dbo].[chat_messages] ([session_id]);
    CREATE NONCLUSTERED INDEX [IX_chat_messages_contact_id]  ON [dbo].[chat_messages] ([contact_id]);
    CREATE NONCLUSTERED INDEX [IX_chat_messages_sender_type] ON [dbo].[chat_messages] ([sender_type]);

    PRINT 'Table chat_messages created.';
END
ELSE
BEGIN
    PRINT 'Table chat_messages already exists. Skipped.';
END
GO
