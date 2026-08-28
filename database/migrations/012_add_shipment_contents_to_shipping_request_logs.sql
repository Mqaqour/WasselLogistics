IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[shipping_request_logs]') AND name = 'shipment_contents'
)
BEGIN
    ALTER TABLE [dbo].[shipping_request_logs]
        ADD [shipment_contents] NVARCHAR(MAX) NULL;

    PRINT 'Column shipment_contents added to shipping_request_logs.';
END
ELSE PRINT 'Column shipment_contents already exists on shipping_request_logs — skipped.';
GO
