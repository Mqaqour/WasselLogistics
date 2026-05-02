import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),

  // respond.io
  RESPOND_CHANNEL_ID:   optional('RESPOND_CHANNEL_ID', ''),
  RESPOND_API_TOKEN:    optional('RESPOND_API_TOKEN', ''),
  RESPOND_WEBHOOK_URL:  optional('RESPOND_WEBHOOK_URL', 'https://app.respond.io/custom/channel/webhook/'),

  // SQL Server (optional — app falls back to in-memory store when not set)
  DB_SERVER:                   optional('DB_SERVER', ''),
  DB_DATABASE:                 optional('DB_DATABASE', ''),
  DB_USERNAME:                 optional('DB_USERNAME', ''),
  DB_PASSWORD:                 optional('DB_PASSWORD', ''),
  DB_PORT:                     parseInt(optional('DB_PORT', '1433'), 10),
  DB_ENCRYPT:                  optional('DB_ENCRYPT', 'true') === 'true',
  DB_TRUST_SERVER_CERTIFICATE: optional('DB_TRUST_SERVER_CERTIFICATE', 'false') === 'true',

  // CORS
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  // QuickRate shipping proxy
  QUICKRATE_API_KEY: optional('QUICKRATE_API_KEY', ''),
  QUICKRATE_BASE_URL: optional('QUICKRATE_BASE_URL', 'https://quickrate.wassel.ps'),

  // Pickup request email notifications
  SMTP_HOST: optional('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_USER: optional('SMTP_USER', ''),
  SMTP_PASSWORD: optional('SMTP_PASSWORD', ''),
  PICKUP_NOTIFY_EMAIL: optional('PICKUP_NOTIFY_EMAIL', 'Mqaqour@wassel.ps'),
};
