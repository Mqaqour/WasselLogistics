IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[WaitingToArriveShipments]') AND name = 'customer_phone'
)
BEGIN
    ALTER TABLE [dbo].[WaitingToArriveShipments]
        ADD [customer_phone] NVARCHAR(50) NULL;

    PRINT 'Column customer_phone added to WaitingToArriveShipments.';
END
ELSE PRINT 'Column customer_phone already exists on WaitingToArriveShipments — skipped.';
GO
