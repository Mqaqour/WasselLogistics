IF COL_LENGTH(N'dbo.kb_questions', N'is_revised') IS NULL
BEGIN
    ALTER TABLE [dbo].[kb_questions]
    ADD [is_revised] BIT NOT NULL
        CONSTRAINT [DF_kb_questions_is_revised] DEFAULT 0;

    PRINT 'Column kb_questions.is_revised added.';
END
ELSE
BEGIN
    PRINT 'Column kb_questions.is_revised already exists - skipped.';
END;
