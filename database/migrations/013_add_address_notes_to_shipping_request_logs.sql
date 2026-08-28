IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[shipping_request_logs]') AND name = 'address_details'
)
BEGIN
    ALTER TABLE [dbo].[shipping_request_logs]
        ADD [address_details] NVARCHAR(MAX) NULL;

    PRINT 'Column address_details added to shipping_request_logs.';
END
ELSE PRINT 'Column address_details already exists on shipping_request_logs — skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[shipping_request_logs]') AND name = 'notes'
)
BEGIN
    ALTER TABLE [dbo].[shipping_request_logs]
        ADD [notes] NVARCHAR(MAX) NULL;

    PRINT 'Column notes added to shipping_request_logs.';
END
ELSE PRINT 'Column notes already exists on shipping_request_logs — skipped.';
GO
