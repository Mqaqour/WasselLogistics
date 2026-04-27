import sql from 'mssql';
import { env } from './env';
import { logger } from '../utils/logger';

const config: sql.config = {
  server:   env.DB_SERVER,
  database: env.DB_DATABASE,
  user:     env.DB_USERNAME,
  password: env.DB_PASSWORD,
  port:     env.DB_PORT,
  options: {
    encrypt:                    env.DB_ENCRYPT,
    trustServerCertificate:     env.DB_TRUST_SERVER_CERTIFICATE,
    enableArithAbort:           true,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout:    30000,
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }
  pool = await new sql.ConnectionPool(config).connect();
  logger.info('SQL Server connection pool established.');
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    logger.info('SQL Server connection pool closed.');
  }
}

export { sql };
