IF OBJECT_ID(N'[dbo].[contact_message_logs]', N'U') IS NOT NULL
BEGIN
    UPDATE [dbo].[contact_message_logs]
    SET [ai_answer] = N'AI response unavailable at time of submission.'
    WHERE [ai_answer] IS NULL;

    UPDATE [dbo].[contact_message_logs]
    SET [ai_related_topics] = N'[]'
    WHERE [ai_related_topics] IS NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints
        WHERE name = N'DF_contact_logs_ai_answer'
          AND parent_object_id = OBJECT_ID(N'[dbo].[contact_message_logs]')
    )
    BEGIN
        ALTER TABLE [dbo].[contact_message_logs]
            ADD CONSTRAINT [DF_contact_logs_ai_answer]
            DEFAULT N'AI response unavailable at time of submission.' FOR [ai_answer];
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints
        WHERE name = N'DF_contact_logs_ai_related_topics'
          AND parent_object_id = OBJECT_ID(N'[dbo].[contact_message_logs]')
    )
    BEGIN
        ALTER TABLE [dbo].[contact_message_logs]
            ADD CONSTRAINT [DF_contact_logs_ai_related_topics]
            DEFAULT N'[]' FOR [ai_related_topics];
    END

    ALTER TABLE [dbo].[contact_message_logs]
        ALTER COLUMN [ai_answer] NVARCHAR(MAX) NOT NULL;

    ALTER TABLE [dbo].[contact_message_logs]
        ALTER COLUMN [ai_related_topics] NVARCHAR(MAX) NOT NULL;

    PRINT 'contact_message_logs AI columns set to NOT NULL with defaults.';
END
ELSE
BEGIN
    PRINT 'Table contact_message_logs does not exist — skipped.';
END
GO
