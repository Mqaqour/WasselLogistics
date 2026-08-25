-- ============================================================
-- Migration 004: Questions Knowledge Base
-- Run this script against wasselwebdb (Azure SQL / SQL Server).
-- All tables are prefixed with [kb_] to avoid collisions.
-- The script is idempotent: safe to re-run.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. kb_topics
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_topics]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_topics] (
        [id]         INT IDENTITY(1,1) NOT NULL,
        [code]       NVARCHAR(100)     NOT NULL,
        [is_active]  BIT               NOT NULL CONSTRAINT [DF_kb_topics_is_active]  DEFAULT 1,
        [created_at] DATETIME2         NOT NULL CONSTRAINT [DF_kb_topics_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_kb_topics]      PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_kb_topics_code] UNIQUE NONCLUSTERED ([code])
    );
    CREATE NONCLUSTERED INDEX [IX_kb_topics_code] ON [dbo].[kb_topics] ([code]);
    PRINT 'Table kb_topics created.';
END
ELSE PRINT 'Table kb_topics already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 2. kb_topic_translations
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_topic_translations]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_topic_translations] (
        [id]            INT IDENTITY(1,1) NOT NULL,
        [topic_id]      INT               NOT NULL,
        [language_code] NVARCHAR(5)       NOT NULL,
        [name]          NVARCHAR(500)     NOT NULL,
        [description]   NVARCHAR(2000)    NULL,

        CONSTRAINT [PK_kb_topic_translations]       PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_kb_topic_trans_topic]        FOREIGN KEY ([topic_id])
            REFERENCES [dbo].[kb_topics] ([id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_kb_topic_trans_lang] ON [dbo].[kb_topic_translations] ([language_code]);
    PRINT 'Table kb_topic_translations created.';
END
ELSE PRINT 'Table kb_topic_translations already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 3. kb_questions
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_questions]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_questions] (
        [id]         INT IDENTITY(1,1) NOT NULL,
        [topic_id]   INT               NOT NULL,
        [intent_key] NVARCHAR(200)     NOT NULL,
        [priority]   INT               NOT NULL CONSTRAINT [DF_kb_questions_priority]   DEFAULT 5,
        [is_active]  BIT               NOT NULL CONSTRAINT [DF_kb_questions_is_active]  DEFAULT 1,
        [created_at] DATETIME2         NOT NULL CONSTRAINT [DF_kb_questions_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_kb_questions]        PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_kb_questions_intent] UNIQUE NONCLUSTERED ([intent_key]),
        CONSTRAINT [FK_kb_questions_topic]  FOREIGN KEY ([topic_id])
            REFERENCES [dbo].[kb_topics] ([id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_kb_questions_intent_key] ON [dbo].[kb_questions] ([intent_key]);
    PRINT 'Table kb_questions created.';
END
ELSE PRINT 'Table kb_questions already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 4. kb_question_translations
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_question_translations]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_question_translations] (
        [id]            INT IDENTITY(1,1) NOT NULL,
        [question_id]   INT               NOT NULL,
        [language_code] NVARCHAR(5)       NOT NULL,
        [question_text] NVARCHAR(2000)    NOT NULL,

        CONSTRAINT [PK_kb_question_translations]    PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_kb_question_trans_question]  FOREIGN KEY ([question_id])
            REFERENCES [dbo].[kb_questions] ([id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_kb_question_trans_lang] ON [dbo].[kb_question_translations] ([language_code]);
    PRINT 'Table kb_question_translations created.';
END
ELSE PRINT 'Table kb_question_translations already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 5. kb_answer_translations
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_answer_translations]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_answer_translations] (
        [id]            INT IDENTITY(1,1) NOT NULL,
        [question_id]   INT               NOT NULL,
        [language_code] NVARCHAR(5)       NOT NULL,
        [answer_text]   NVARCHAR(MAX)     NOT NULL,

        CONSTRAINT [PK_kb_answer_translations]    PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_kb_answer_trans_question]  FOREIGN KEY ([question_id])
            REFERENCES [dbo].[kb_questions] ([id]) ON DELETE CASCADE
    );
    PRINT 'Table kb_answer_translations created.';
END
ELSE PRINT 'Table kb_answer_translations already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 6. kb_tags
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_tags]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_tags] (
        [id]            INT IDENTITY(1,1) NOT NULL,
        [language_code] NVARCHAR(5)       NOT NULL,
        [name]          NVARCHAR(200)     NOT NULL,

        CONSTRAINT [PK_kb_tags] PRIMARY KEY CLUSTERED ([id] ASC)
    );
    CREATE NONCLUSTERED INDEX [IX_kb_tags_lang] ON [dbo].[kb_tags] ([language_code]);
    PRINT 'Table kb_tags created.';
END
ELSE PRINT 'Table kb_tags already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 7. kb_question_tags  (junction table)
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_question_tags]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_question_tags] (
        [question_id] INT NOT NULL,
        [tag_id]      INT NOT NULL,

        CONSTRAINT [PK_kb_question_tags]    PRIMARY KEY CLUSTERED ([question_id], [tag_id]),
        CONSTRAINT [FK_kb_qtags_question]   FOREIGN KEY ([question_id])
            REFERENCES [dbo].[kb_questions] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_kb_qtags_tag]        FOREIGN KEY ([tag_id])
            REFERENCES [dbo].[kb_tags] ([id])
    );
    PRINT 'Table kb_question_tags created.';
END
ELSE PRINT 'Table kb_question_tags already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 8. kb_question_keywords
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_question_keywords]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_question_keywords] (
        [id]            INT IDENTITY(1,1) NOT NULL,
        [question_id]   INT               NOT NULL,
        [language_code] NVARCHAR(5)       NOT NULL,
        [keyword]       NVARCHAR(300)     NOT NULL,

        CONSTRAINT [PK_kb_question_keywords]    PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_kb_keywords_question]    FOREIGN KEY ([question_id])
            REFERENCES [dbo].[kb_questions] ([id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_kb_keywords_keyword] ON [dbo].[kb_question_keywords] ([keyword]);
    PRINT 'Table kb_question_keywords created.';
END
ELSE PRINT 'Table kb_question_keywords already exists — skipped.';
GO

-- ──────────────────────────────────────────────
-- 9. kb_suggestion_logs
-- ──────────────────────────────────────────────
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[kb_suggestion_logs]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[kb_suggestion_logs] (
        [id]                    BIGINT IDENTITY(1,1) NOT NULL,
        [user_input]            NVARCHAR(1000)       NOT NULL,
        [detected_language]     NVARCHAR(5)          NOT NULL,
        [suggested_question_id] INT                  NULL,
        [created_at]            DATETIME2            NOT NULL CONSTRAINT [DF_kb_sugg_logs_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_kb_suggestion_logs]      PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_kb_sugg_logs_question]   FOREIGN KEY ([suggested_question_id])
            REFERENCES [dbo].[kb_questions] ([id]) ON DELETE SET NULL
    );
    PRINT 'Table kb_suggestion_logs created.';
END
ELSE PRINT 'Table kb_suggestion_logs already exists — skipped.';
GO

PRINT '=== Migration 004 complete ===';
GO
