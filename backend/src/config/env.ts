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
  PORT: (process.env.PORT ?? '3000') as string | number,

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

  // Wassel internal AWB details API (Basic auth) — proxied by /api/wassel/track*
  // and used by the AI agent's tracking summary.
  WASSEL_AWB_BASE_URL: optional('WASSEL_AWB_BASE_URL', 'http://external.wassel.ps:4040'),
  WASSEL_AWB_USERNAME: optional('WASSEL_AWB_USERNAME', ''),
  WASSEL_AWB_PASSWORD: optional('WASSEL_AWB_PASSWORD', ''),

  // QuickRate shipping proxy
  QUICKRATE_API_KEY: optional('QUICKRATE_API_KEY', ''),
  QUICKRATE_BASE_URL: optional('QUICKRATE_BASE_URL', 'https://quickrate.wassel.ps'),
  // 'lowest' returns only the cheapest quote (carrier/service hidden) | 'all' returns every quote
  QUICKRATE_RESULT_MODE: optional('QUICKRATE_RESULT_MODE', 'lowest') as 'lowest' | 'all',

  // DHL MyDHL API (Express) — tracking requires Basic Auth (key+secret) plus
  // the plugin/platform identification headers DHL's portal issues per account.
  DHL_API_KEY: optional('DhlApiKey', ''),
  DHL_API_SECRET: optional('DhlApiSecret', ''),
  DHL_ACCOUNT_NUMBER: optional('DhlAccountNumber', ''),
  DHL_ENVIRONMENT: optional('DhlEnvironment', 'production'),
  DHL_API_VERSION: optional('DhlApiVersion', '2.11.0'),
  DHL_PLUGIN_NAME: optional('DhlPluginName', ''),
  DHL_PLUGIN_VERSION: optional('DhlPluginVersion', ''),
  DHL_PLATFORM_NAME: optional('DhlPlatformName', ''),
  DHL_PLATFORM_VERSION: optional('DhlPlatformVersion', ''),

  // FedEx Track API v1 — OAuth2 client-credentials
  FEDEX_TRACK_CLIENT_ID: optional('FedExTrackClientId', ''),
  FEDEX_TRACK_CLIENT_SECRET: optional('FedExTrackClientSecret', ''),

  // AI Chat
  AI_PROVIDER:               optional('AI_PROVIDER', 'none') as 'openai' | 'azure' | 'none',
  OPENAI_API_KEY:            optional('OPENAI_API_KEY', ''),
  OPENAI_MODEL:              optional('OPENAI_MODEL', 'gpt-4o-mini'),
  AZURE_OPENAI_ENDPOINT:     optional('AZURE_OPENAI_ENDPOINT', ''),
  AZURE_OPENAI_API_KEY:      optional('AZURE_OPENAI_API_KEY', ''),
  AZURE_OPENAI_DEPLOYMENT:   optional('AZURE_OPENAI_DEPLOYMENT', ''),
  AZURE_OPENAI_API_VERSION:  optional('AZURE_OPENAI_API_VERSION', '2024-02-01'),
  AI_PROJECT_ENDPOINT:       optional('AI_PROJECT_ENDPOINT', 'https://wasselaifoundry.services.ai.azure.com/api/projects/Wassel-default'),
  AI_PROJECT_API_KEY:        optional('AI_PROJECT_API_KEY', ''),
  AI_AGENT_NAME:             optional('AI_AGENT_NAME', 'WSLAIV52'),
  AI_AGENT_VERSION:          optional('AI_AGENT_VERSION', '4'),
  // Separate agent used only for drafting the internal "AI suggestion" attached to
  // Contact Us emails — a distinct, non-conversational task from the public KB chatbot above.
  AI_CONTACT_AGENT_NAME:     optional('AI_CONTACT_AGENT_NAME', 'WEBSITEAI'),
  AI_CONTACT_AGENT_VERSION:  optional('AI_CONTACT_AGENT_VERSION', '1'),
  CHAT_RATE_LIMIT_PER_MINUTE: parseInt(optional('CHAT_RATE_LIMIT_PER_MINUTE', '20'), 10),

  // Respond.io handoff
  RESPOND_IO_API_KEY:    optional('RESPOND_IO_API_KEY', ''),
  RESPOND_IO_CHANNEL_ID: optional('RESPOND_IO_CHANNEL_ID', ''),

  // Pickup request email notifications
  SMTP_HOST: optional('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_USER: optional('SMTP_USER', ''),
  SMTP_PASSWORD: optional('SMTP_PASSWORD', ''),
  PICKUP_NOTIFY_EMAIL: optional('PICKUP_NOTIFY_EMAIL', 'mqaqour@wassel.ps'),
  CONTACT_NOTIFY_EMAIL: optional('CONTACT_NOTIFY_EMAIL', 'mqaqour@wassel.ps'),
  SHIPPING_REQUEST_NOTIFY_EMAIL: optional('SHIPPING_REQUEST_NOTIFY_EMAIL', 'mqaqour@wassel.ps'),

  // SMS verification gateway (Hadara). The API key MUST come from the environment —
  // never hard-code it. BASE_URL is the message-send endpoint; the apikey/to/msg
  // query params are appended by the caller.
  // TODO: move BASE_URL to https once Hadara TLS support on :4545 is confirmed.
  HADARA_SMS_BASE_URL: optional(
    'HADARA_SMS_BASE_URL',
    'http://smsservice.hadara.ps:4545/SMS.ashx/bulkservice/sessionvalue/sendmessage/',
  ),
  HADARA_SMS_API_KEY: optional('HADARA_SMS_API_KEY', ''),

  // Portal login security
  LOGIN_MAX_ATTEMPTS: parseInt(optional('LOGIN_MAX_ATTEMPTS', '3'), 10),
  LOGIN_BLOCK_HOURS: parseInt(optional('LOGIN_BLOCK_HOURS', '24'), 10),
  LOGIN_ALERT_EMAILS: optional('LOGIN_ALERT_EMAILS', 'mqaqour@wassel.ps,oziq@wassel.ps'),

  // Portal session auth (JWT) + authenticator-app (TOTP) second factor.
  // AUTH_JWT_SECRET MUST be set in production — a startup check enforces it below.
  AUTH_JWT_SECRET: (() => {
    const fromEnv = process.env.AUTH_JWT_SECRET;
    if (fromEnv && fromEnv.length >= 16) return fromEnv;
    if ((process.env.NODE_ENV ?? 'development') === 'production') {
      throw new Error('Missing required environment variable: AUTH_JWT_SECRET (>= 16 chars) in production');
    }
    // Dev fallback — ephemeral, sessions won't survive a restart.
    return 'dev-only-insecure-secret-change-me';
  })(),
  AUTH_TOKEN_TTL_HOURS: parseInt(optional('AUTH_TOKEN_TTL_HOURS', '12'), 10),
  AUTH_TOTP_ISSUER: optional('AUTH_TOTP_ISSUER', 'Wassel Portal'),
  AUTH_COOKIE_NAME: optional('AUTH_COOKIE_NAME', 'wsl_session'),
};
