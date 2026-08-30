import sql from 'mssql';
import { env } from './env';
import { logger } from '../utils/logger';

const useTrustedLocalDb =
  env.DB_SERVER.toLowerCase().includes('(localdb)') &&
  !env.DB_USERNAME &&
  !env.DB_PASSWORD;

const config: sql.config = {
  server:   env.DB_SERVER,
  database: env.DB_DATABASE,
  user:     env.DB_USERNAME,
  password: env.DB_PASSWORD,
  port:     env.DB_PORT,
  options: {
    encrypt:                env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
    enableArithAbort:       true,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout:    30000,
};

const localDbConfig: any = {
  server: env.DB_SERVER,
  database: env.DB_DATABASE,
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }
  let newPool: sql.ConnectionPool;
  if (useTrustedLocalDb) {
    const { default: sqlNative } = await import('mssql/msnodesqlv8');
    newPool = await new (sqlNative as any).ConnectionPool(localDbConfig).connect();
  } else {
    newPool = await new sql.ConnectionPool(config).connect();
  }
  // ConnectionPool is an EventEmitter — background connection errors (idle
  // timeout, a dropped TCP connection) emit 'error' outside of any in-flight
  // query's promise. Without a listener, Node treats that as unhandled and
  // crashes the whole process, regardless of which request happens to be
  // running at the time.
  newPool.on('error', (err) => {
    logger.error('SQL Server connection pool error:', err);
  });
  pool = newPool;
  logger.info('SQL Server connection pool established.');
  return newPool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    logger.info('SQL Server connection pool closed.');
  }
}

export { sql };
