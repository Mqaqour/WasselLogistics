import { getPool, sql } from '../config/database';

export interface PortalUserRow {
  id: number;
  username: string;
  passwordHash: string;
  displayName: string | null;
}

export interface LoginIpBlockRow {
  ipAddress: string;
  failedAttempts: number;
  blockedUntil: Date | null;
  notificationSentAt: Date | null;
  lastAttemptAt: Date | null;
}

export async function findActiveUserByUsername(username: string): Promise<PortalUserRow | null> {
  const pool = await getPool();
  const result = await pool.request()
    .input('username', sql.NVarChar(255), username)
    .query<PortalUserRow>(`
      SELECT TOP (1)
        id,
        username,
        password_hash AS passwordHash,
        display_name AS displayName
      FROM dbo.portal_users
      WHERE username = @username
        AND is_active = 1
    `);

  return result.recordset[0] ?? null;
}

export async function findIpBlock(ipAddress: string): Promise<LoginIpBlockRow | null> {
  const pool = await getPool();
  const result = await pool.request()
    .input('ipAddress', sql.NVarChar(64), ipAddress)
    .query<LoginIpBlockRow>(`
      SELECT TOP (1)
        ip_address AS ipAddress,
        failed_attempts AS failedAttempts,
        blocked_until AS blockedUntil,
        notification_sent_at AS notificationSentAt,
        last_attempt_at AS lastAttemptAt
      FROM dbo.portal_login_ip_blocks
      WHERE ip_address = @ipAddress
    `);

  return result.recordset[0] ?? null;
}

export async function saveIpBlock(
  ipAddress: string,
  failedAttempts: number,
  blockedUntil: Date | null,
  notificationSentAt: Date | null,
): Promise<void> {
  const pool = await getPool();
  await pool.request()
    .input('ipAddress', sql.NVarChar(64), ipAddress)
    .input('failedAttempts', sql.Int, failedAttempts)
    .input('blockedUntil', sql.DateTime2, blockedUntil)
    .input('notificationSentAt', sql.DateTime2, notificationSentAt)
    .query(`
      DECLARE @now DATETIME2 = SYSUTCDATETIME();

      MERGE dbo.portal_login_ip_blocks WITH (HOLDLOCK) AS target
      USING (SELECT @ipAddress AS ip_address) AS source
      ON target.ip_address = source.ip_address
      WHEN MATCHED THEN
        UPDATE SET
          failed_attempts = @failedAttempts,
          blocked_until = @blockedUntil,
          notification_sent_at = @notificationSentAt,
          last_attempt_at = @now,
          updated_at = @now
      WHEN NOT MATCHED THEN
        INSERT (ip_address, failed_attempts, blocked_until, notification_sent_at, last_attempt_at, updated_at)
        VALUES (@ipAddress, @failedAttempts, @blockedUntil, @notificationSentAt, @now, @now);
    `);
}

export async function markBlockNotificationSent(ipAddress: string): Promise<void> {
  const pool = await getPool();
  await pool.request()
    .input('ipAddress', sql.NVarChar(64), ipAddress)
    .query(`
      UPDATE dbo.portal_login_ip_blocks
      SET notification_sent_at = SYSUTCDATETIME(),
          updated_at = SYSUTCDATETIME()
      WHERE ip_address = @ipAddress
    `);
}

export async function clearIpBlock(ipAddress: string): Promise<void> {
  const pool = await getPool();
  await pool.request()
    .input('ipAddress', sql.NVarChar(64), ipAddress)
    .query(`
      DELETE FROM dbo.portal_login_ip_blocks
      WHERE ip_address = @ipAddress
    `);
}

export async function recordLoginAttempt(input: {
  ipAddress: string;
  username: string;
  succeeded: boolean;
  failureReason: string | null;
  userAgent: string | null;
}): Promise<void> {
  const pool = await getPool();
  await pool.request()
    .input('ipAddress', sql.NVarChar(64), input.ipAddress)
    .input('username', sql.NVarChar(255), input.username)
    .input('succeeded', sql.Bit, input.succeeded)
    .input('failureReason', sql.NVarChar(64), input.failureReason)
    .input('userAgent', sql.NVarChar(512), input.userAgent)
    .query(`
      INSERT INTO dbo.portal_login_attempts
        (ip_address, username, succeeded, failure_reason, user_agent)
      VALUES
        (@ipAddress, @username, @succeeded, @failureReason, @userAgent)
    `);
}
