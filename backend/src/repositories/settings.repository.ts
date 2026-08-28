// ─────────────────────────────────────────────────────────────────────────────
// System Settings — Repository
// A generic key/value store for admin-editable runtime settings.
// ─────────────────────────────────────────────────────────────────────────────
import { getPool, sql } from '../config/database';
import { isDbAvailable } from './chat.repository';
import { logger } from '../utils/logger';

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  if (!(await isDbAvailable()) || keys.length === 0) return {};

  try {
    const pool = await getPool();
    const placeholders = keys.map((_, i) => `@key${i}`).join(', ');
    const request = pool.request();
    keys.forEach((key, i) => request.input(`key${i}`, sql.NVarChar(100), key));

    const result = await request.query<{ setting_key: string; setting_value: string }>(`
      SELECT setting_key, setting_value
      FROM system_settings
      WHERE setting_key IN (${placeholders})
    `);

    const map: Record<string, string> = {};
    for (const row of result.recordset) {
      map[row.setting_key] = row.setting_value;
    }
    return map;
  } catch (error) {
    logger.warn(`Could not read system settings: ${String(error)}`);
    return {};
  }
}

export async function upsertSetting(key: string, value: string, updatedBy: string | null): Promise<boolean> {
  if (!(await isDbAvailable())) return false;

  try {
    const pool = await getPool();
    await pool.request()
      .input('key', sql.NVarChar(100), key)
      .input('value', sql.NVarChar(sql.MAX), value)
      .input('updatedBy', sql.NVarChar(200), updatedBy)
      .query(`
        MERGE system_settings AS target
        USING (SELECT @key AS setting_key) AS source
        ON target.setting_key = source.setting_key
        WHEN MATCHED THEN
          UPDATE SET setting_value = @value, updated_at = SYSDATETIME(), updated_by = @updatedBy
        WHEN NOT MATCHED THEN
          INSERT (setting_key, setting_value, updated_by) VALUES (@key, @value, @updatedBy);
      `);
    return true;
  } catch (error) {
    logger.warn(`Could not save system setting "${key}": ${String(error)}`);
    return false;
  }
}
