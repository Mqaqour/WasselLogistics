IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'[dbo].[WaitingToArriveShipments]') AND name = 'UQ_waiting_shipments_tracking_number'
)
BEGIN
    -- Drop the old non-unique index first, if present, to avoid a redundant duplicate index.
    IF EXISTS (
        SELECT * FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'[dbo].[WaitingToArriveShipments]') AND name = 'IX_waiting_shipments_tracking_number'
    )
    BEGIN
        DROP INDEX [IX_waiting_shipments_tracking_number] ON [dbo].[WaitingToArriveShipments];
    END

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_waiting_shipments_tracking_number]
        ON [dbo].[WaitingToArriveShipments] ([tracking_number]);

    PRINT 'Unique index UQ_waiting_shipments_tracking_number created.';
END
ELSE PRINT 'Unique index UQ_waiting_shipments_tracking_number already exists — skipped.';
GO
