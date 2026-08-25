IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[portal_users]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[portal_users] (
        [id]            INT IDENTITY(1,1) NOT NULL,
        [username]      NVARCHAR(255)     NOT NULL,
        [password_hash] NVARCHAR(255)     NOT NULL,
        [display_name]  NVARCHAR(255)     NULL,
        [is_active]     BIT               NOT NULL CONSTRAINT [DF_portal_users_is_active] DEFAULT 1,
        [created_at]    DATETIME2         NOT NULL CONSTRAINT [DF_portal_users_created_at] DEFAULT SYSUTCDATETIME(),
        [updated_at]    DATETIME2         NOT NULL CONSTRAINT [DF_portal_users_updated_at] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_portal_users] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UX_portal_users_username] ON [dbo].[portal_users] ([username]);

    PRINT 'Table portal_users created.';
END
ELSE PRINT 'Table portal_users already exists - skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[portal_login_attempts]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[portal_login_attempts] (
        [id]             BIGINT IDENTITY(1,1) NOT NULL,
        [ip_address]     NVARCHAR(64)         NOT NULL,
        [username]       NVARCHAR(255)        NOT NULL,
        [succeeded]      BIT                  NOT NULL,
        [failure_reason] NVARCHAR(64)         NULL,
        [user_agent]     NVARCHAR(512)        NULL,
        [attempted_at]   DATETIME2            NOT NULL CONSTRAINT [DF_portal_login_attempts_attempted_at] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_portal_login_attempts] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_portal_login_attempts_ip_attempted_at] ON [dbo].[portal_login_attempts] ([ip_address], [attempted_at] DESC);
    CREATE NONCLUSTERED INDEX [IX_portal_login_attempts_username_attempted_at] ON [dbo].[portal_login_attempts] ([username], [attempted_at] DESC);

    PRINT 'Table portal_login_attempts created.';
END
ELSE PRINT 'Table portal_login_attempts already exists - skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[portal_login_ip_blocks]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[portal_login_ip_blocks] (
        [ip_address]           NVARCHAR(64) NOT NULL,
        [failed_attempts]      INT          NOT NULL CONSTRAINT [DF_portal_login_ip_blocks_failed_attempts] DEFAULT 0,
        [blocked_until]        DATETIME2    NULL,
        [notification_sent_at] DATETIME2    NULL,
        [last_attempt_at]      DATETIME2    NOT NULL CONSTRAINT [DF_portal_login_ip_blocks_last_attempt_at] DEFAULT SYSUTCDATETIME(),
        [updated_at]           DATETIME2    NOT NULL CONSTRAINT [DF_portal_login_ip_blocks_updated_at] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_portal_login_ip_blocks] PRIMARY KEY CLUSTERED ([ip_address] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_portal_login_ip_blocks_blocked_until] ON [dbo].[portal_login_ip_blocks] ([blocked_until]);

    PRINT 'Table portal_login_ip_blocks created.';
END
ELSE PRINT 'Table portal_login_ip_blocks already exists - skipped.';
GO

/*
Manual user insert example.
The backend verifies password_hash as SHA-256 over SQL Server NVARCHAR bytes.

DECLARE @Username NVARCHAR(255) = N'admin';
DECLARE @Password NVARCHAR(4000) = N'change-this-password';

INSERT INTO dbo.portal_users (username, password_hash, display_name)
VALUES (
    @Username,
    LOWER(CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @Password)), 2)),
    N'Admin'
);
*/
