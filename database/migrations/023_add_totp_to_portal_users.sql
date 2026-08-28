-- ============================================================
-- Migration 023: Add TOTP (authenticator app) two-factor fields to portal_users
-- The portal login now issues a signed session token; a user can additionally
-- enrol an authenticator app (Google Authenticator, Authy, 1Password, ...).
-- `totp_secret` holds the base32 shared secret; `totp_enabled` flips to 1 only
-- after the user confirms a first valid code.
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[portal_users]') AND name = 'totp_secret'
)
BEGIN
    ALTER TABLE [dbo].[portal_users] ADD [totp_secret] NVARCHAR(64) NULL;
    PRINT 'Column totp_secret added to portal_users.';
END
ELSE PRINT 'Column totp_secret already exists - skipped.';
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[portal_users]') AND name = 'totp_enabled'
)
BEGIN
    ALTER TABLE [dbo].[portal_users] ADD [totp_enabled] BIT NOT NULL
        CONSTRAINT [DF_portal_users_totp_enabled] DEFAULT 0;
    PRINT 'Column totp_enabled added to portal_users.';
END
ELSE PRINT 'Column totp_enabled already exists - skipped.';
GO
