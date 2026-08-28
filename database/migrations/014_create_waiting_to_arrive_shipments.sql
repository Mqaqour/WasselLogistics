IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[WaitingToArriveShipments]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[WaitingToArriveShipments] (
        [id]               BIGINT IDENTITY(1,1) NOT NULL,
        [tracking_number]  NVARCHAR(100)        NOT NULL,
        [customer_name]    NVARCHAR(200)        NOT NULL,
        [customer_email]   NVARCHAR(200)        NOT NULL,
        -- Carrier the customer selected when submitting (wassel/dhl/fedex/passport), if known —
        -- lets the future checking job query the right API directly instead of guessing.
        [carrier]          NVARCHAR(20)         NULL,
        [language]         NVARCHAR(10)         NULL,
        -- Updated by the (not-yet-configured) twice-daily job once it starts running.
        [status]           NVARCHAR(20)         NOT NULL CONSTRAINT [DF_waiting_shipments_status] DEFAULT N'pending',
        [last_checked_at]  DATETIME2            NULL,
        [found_at]         DATETIME2            NULL,
        [created_at]       DATETIME2            NOT NULL CONSTRAINT [DF_waiting_shipments_created_at] DEFAULT SYSDATETIME(),

        CONSTRAINT [PK_WaitingToArriveShipments] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_waiting_shipments_tracking_number] ON [dbo].[WaitingToArriveShipments] ([tracking_number]);
    CREATE NONCLUSTERED INDEX [IX_waiting_shipments_status] ON [dbo].[WaitingToArriveShipments] ([status]);

    PRINT 'Table WaitingToArriveShipments created.';
END
ELSE PRINT 'Table WaitingToArriveShipments already exists — skipped.';
GO
