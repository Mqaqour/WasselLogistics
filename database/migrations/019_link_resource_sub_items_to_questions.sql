-- ============================================================
-- Migration 019: Link resource sub-items directly to KB questions
--
-- Previously a sub-item card had no real connection to the knowledge base —
-- clicking it ran a free-text search using the card's title as the query,
-- hoping it happened to match a real kb_questions row closely enough. That's
-- fragile (a title edit silently breaks the match) and forces admins to
-- maintain the same content twice (a KB question, and a similar-but-separate
-- card). This adds a direct, optional link so a card can point at an exact
-- question instead of guessing.
-- ============================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sub_items]') AND name = 'question_id'
)
BEGIN
    ALTER TABLE [dbo].[resource_sub_items] ADD [question_id] INT NULL;
    PRINT 'Column question_id added to resource_sub_items.';
END
ELSE PRINT 'Column question_id already exists — skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys WHERE name = 'FK_resource_sub_items_question'
)
BEGIN
    ALTER TABLE [dbo].[resource_sub_items]
        ADD CONSTRAINT [FK_resource_sub_items_question]
        FOREIGN KEY ([question_id]) REFERENCES [dbo].[kb_questions] ([id])
        ON DELETE SET NULL;
    PRINT 'FK_resource_sub_items_question created (deleting a question unlinks its card instead of failing/cascading).';
END
ELSE PRINT 'FK_resource_sub_items_question already exists — skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'[dbo].[resource_sub_items]') AND name = 'IX_resource_sub_items_question_id'
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_resource_sub_items_question_id] ON [dbo].[resource_sub_items] ([question_id]);
    PRINT 'Index IX_resource_sub_items_question_id created.';
END
ELSE PRINT 'Index IX_resource_sub_items_question_id already exists — skipped.';
GO
