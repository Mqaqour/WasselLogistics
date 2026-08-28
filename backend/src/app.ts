import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env';
import * as repo from './repositories/chat.repository';
import { ContactSubmitRequest, ShippingRequestSubmitRequest, WaitingShipmentRegisterRequest, BusinessAccountSubmitRequest, BusinessAccountStatus } from './types/chat.types';
import chatRoutes from './routes/chat.routes';
import respondioRoutes from './routes/respondio.routes';
import questionsRoutes from './routes/questions.routes';
import topicsRoutes from './routes/topics.routes';
import tagsRoutes from './routes/tags.routes';
import aiRoutes from './routes/ai.routes';
import kbAiRoutes from './routes/kb-ai.routes';
import authRoutes from './routes/auth.routes';
import resourceCategoriesRoutes from './routes/resource-categories.routes';
import resourceSubItemsRoutes   from './routes/resource-sub-items.routes';
import resourceSectionsRoutes   from './routes/resource-sections.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/errorHandler';
import { getContactAiSuggestion } from './services/ai-agent.service';
import { getNotificationSettings, resolveContactRecipient, resolveBusinessAccountRecipient } from './services/settings.service';
import { logger } from './utils/logger';
import { requireAuth, requireAuthForWrites } from './middleware/requireAuth';
import { wasselAwbDetailsUrl, wasselAwbHeaders } from './utils/wasselAwb';
import {
  apiFallbackLimiter,
  trackingLimiter,
  quickrateLimiter,
  sendRequestLimiter,
  contactSubmitLimiter,
  contactAiLimiter,
  waitingShipmentsLimiter,
  smsIpLimiter,
  smsPhoneLimiter,
} from './middleware/rateLimiter';

const CONTACT_TOPIC_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  shipment: 'Shipment Inquiry',
  passport: 'Jordan Passport Services',
  complaint: 'Complaint',
  claiming: 'Claiming',
};

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  const frontendCandidates = [
    path.resolve(__dirname, 'public'),
    path.resolve(__dirname, '../dist/public'),
  ];
  const frontendDistPath = frontendCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, 'index.html'))
  );

  const buildContactLogPayload = (body: ContactSubmitRequest) => {
    const isArabic = String(body.language ?? 'ar').trim().toLowerCase().startsWith('ar');
    const aiAnswer = body.aiSuggestion?.answer?.trim()
      ? String(body.aiSuggestion.answer).trim()
      : (isArabic
        ? 'تعذر توليد رد الذكاء الاصطناعي تلقائيا لهذه الرسالة.'
        : 'AI response could not be generated automatically for this message.');
    const aiRelatedTopics = Array.isArray(body.aiSuggestion?.relatedTopics)
      ? body.aiSuggestion.relatedTopics.filter((topicItem): topicItem is string => typeof topicItem === 'string' && topicItem.trim().length > 0)
      : [];

    return {
      topic: String(body.topic),
      name: String(body.name),
      mobile: String(body.mobile),
      email: body.email ? String(body.email) : null,
      message: String(body.message),
      trackingNumber: body.trackingNumber ? String(body.trackingNumber) : null,
      passportNumber: body.passportNumber ? String(body.passportNumber) : null,
      language: body.language ? String(body.language) : null,
      aiAnswer,
      aiRelatedTopics,
      aiRelatedTopicsJson: JSON.stringify(aiRelatedTopics),
    };
  };

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.respond.io',
          'https://maps.googleapis.com',
          'https://maps.gstatic.com',
        ],
        scriptSrcElem: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.respond.io',
          'https://maps.googleapis.com',
          'https://maps.gstatic.com',
        ],
        scriptSrcAttr: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: [
          "'self'",
          'https://*.respond.io',
          'https://maps.googleapis.com',
          'https://maps.gstatic.com',
          'https://places.googleapis.com',
          'wss:',
        ],
        frameSrc: ["'self'", 'https://*.respond.io', 'https://www.google.com', 'https://maps.google.com'],
      },
    },
  }));

  // CORS — supports single URL or comma-separated list in FRONTEND_URL
  const allowedOrigins = env.FRONTEND_URL
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const corsOptions = {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // allow the portal session cookie on cross-origin admin calls
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
  // Respond 204 to all OPTIONS preflight requests before any auth middleware
  app.options('*', cors(corsOptions));

  // Body / cookie parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  // Blanket safety net for every /api/* route — see rateLimiter.ts. Routes below
  // layer their own stricter limiter on top where the risk warrants it.
  app.use('/api', apiFallbackLimiter);

  // Routes
  app.use('/api/chat',      chatRoutes);
  app.use('/api/respondio', respondioRoutes);
  app.use('/api/ai',        aiRoutes);
  app.use('/api/auth',      authRoutes);
  app.use('/respond',       respondioRoutes); // respond.io outgoing webhook calls /respond/message

  // Knowledge Base — Questions, Topics & Tags.
  // Public GET (used by the site); every write requires a portal session.
  app.use('/api/questions',           requireAuthForWrites, questionsRoutes);
  app.use('/api/topics',              requireAuthForWrites, topicsRoutes);
  app.use('/api/tags',                requireAuthForWrites, tagsRoutes);
  app.use('/api/kb',                  requireAuth,           kbAiRoutes); // POST /generate only
  app.use('/api/resource-categories', requireAuthForWrites, resourceCategoriesRoutes);
  app.use('/api/resource-sub-items',  requireAuthForWrites, resourceSubItemsRoutes);
  app.use('/api/resource-sections',   requireAuthForWrites, resourceSectionsRoutes);
  app.use('/api/admin/settings',      requireAuth,           settingsRoutes);

  // Jordan Passport proxy — forwards to jopassports.wassel.ps
  app.post('/api/jopassport/track', trackingLimiter, async (req, res) => {
    const { delivery_nos } = req.body;
    if (!delivery_nos) {
      res.status(400).json({ error: 'delivery_nos is required' });
      return;
    }
    try {
      const formData = new URLSearchParams();
      formData.append('delivery_nos', Array.isArray(delivery_nos) ? JSON.stringify(delivery_nos) : delivery_nos);
      formData.append('token', 'd5c5d928bfd0409627d725a90e05e120');
      const upstream = await fetch('https://jopassports.wassel.ps/passport/get_passport_detail_API', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Token': 'd5c5d928bfd0409627d725a90e05e120',
        },
        body: formData.toString(),
      });
      const data = await upstream.json().catch(() => ({}));
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'Passport upstream error' });
    }
  });

  // DHL MyDHL API — shipment tracking proxy (Basic Auth, not the Unified
  // Tracking API's key-only auth — our account is provisioned for MyDHL API).
  app.get('/api/dhl/track', trackingLimiter, async (req, res) => {
    const trackingNumber = String(req.query.trackingNumber ?? '').trim();
    if (!trackingNumber) {
      res.status(400).json({ error: 'trackingNumber is required' });
      return;
    }
    if (!env.DHL_API_KEY || !env.DHL_API_SECRET) {
      res.status(500).json({ error: 'DHL API credentials are not configured' });
      return;
    }
    try {
      const baseUrl = env.DHL_ENVIRONMENT === 'sandbox' ? 'https://express.api.dhl.com/mydhlapi/test' : 'https://express.api.dhl.com/mydhlapi';
      const basicAuth = Buffer.from(`${env.DHL_API_KEY}:${env.DHL_API_SECRET}`).toString('base64');
      const upstream = await fetch(`${baseUrl}/shipments/${encodeURIComponent(trackingNumber)}/tracking`, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: 'application/json',
          'Accept-Language': 'en',
          'Message-Reference': uuidv4(),
          'Message-Reference-Date': new Date().toISOString(),
          'x-version': env.DHL_API_VERSION,
          'Plugin-Name': env.DHL_PLUGIN_NAME,
          'Plugin-Version': env.DHL_PLUGIN_VERSION,
          'Shipping-System-Platform-Name': env.DHL_PLATFORM_NAME,
          'Shipping-System-Platform-Version': env.DHL_PLATFORM_VERSION,
          'Webstore-Platform-Name': env.DHL_PLATFORM_NAME,
          'Webstore-Platform-Version': env.DHL_PLATFORM_VERSION,
        },
      });
      const data = await upstream.json().catch(() => ({}));
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'DHL upstream error' });
    }
  });

  // FedEx Track API v1 proxy — caches the OAuth2 token between requests until it's near expiry
  let fedexTokenCache: { token: string; expiresAt: number } | null = null;
  async function getFedexAccessToken(): Promise<string> {
    if (fedexTokenCache && fedexTokenCache.expiresAt > Date.now() + 30_000) {
      return fedexTokenCache.token;
    }
    const params = new URLSearchParams();
    params.set('grant_type', 'client_credentials');
    params.set('client_id', env.FEDEX_TRACK_CLIENT_ID);
    params.set('client_secret', env.FEDEX_TRACK_CLIENT_SECRET);
    const tokenRes = await fetch('https://apis.fedex.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!tokenRes.ok) {
      throw new Error(`FedEx auth failed with status ${tokenRes.status}`);
    }
    const tokenData = await tokenRes.json() as { access_token: string; expires_in: number };
    fedexTokenCache = { token: tokenData.access_token, expiresAt: Date.now() + tokenData.expires_in * 1000 };
    return tokenData.access_token;
  }

  app.post('/api/fedex/track', trackingLimiter, async (req, res) => {
    const trackingNumber = String(req.body?.trackingNumber ?? '').trim();
    if (!trackingNumber) {
      res.status(400).json({ error: 'trackingNumber is required' });
      return;
    }
    if (!env.FEDEX_TRACK_CLIENT_ID || !env.FEDEX_TRACK_CLIENT_SECRET) {
      res.status(500).json({ error: 'FedEx API credentials are not configured' });
      return;
    }
    try {
      const token = await getFedexAccessToken();
      const upstream = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-locale': 'en_US',
        },
        body: JSON.stringify({
          trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
          includeDetailedScans: true,
        }),
      });
      const data = await upstream.json().catch(() => ({}));
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'FedEx upstream error' });
    }
  });

  // SMS gateway proxy — sends verification messages via Hadara SMS service
  app.post('/api/sms/send-verification', smsIpLimiter, smsPhoneLimiter, async (req, res) => {
    const to = String(req.body?.to ?? '').trim();
    const msg = String(req.body?.msg ?? '').trim();

    if (!to || !msg) {
      res.status(400).json({ error: 'to and msg are required' });
      return;
    }

    const baseUrl = 'http://smsservice.hadara.ps:4545/SMS.ashx/bulkservice/sessionvalue/sendmessage/?apikey=2B3C10E978E7F0696AE217D97DF1451F';
    const url = `${baseUrl}&to=${encodeURIComponent(to)}&msg=${encodeURIComponent(msg)}`;

    try {
      const upstream = await fetch(url, { method: 'GET' });
      const text = await upstream.text();

      if (!upstream.ok) {
        res.status(upstream.status).json({ error: 'SMS upstream error', details: text });
        return;
      }

      res.json({ ok: true, details: text });
    } catch {
      res.status(502).json({ error: 'SMS upstream error' });
    }
  });

  // Pickup request notifications — sends a summary email to operations inbox
  app.post('/api/pickup/request', sendRequestLimiter, async (req, res) => {
    const {
      fullName,
      phone,
      city,
      address,
      notes,
      pickupDate,
      readyTime,
      numPackages,
      packageDescription,
    } = req.body ?? {};

    if (!fullName || !phone || !city || !address || !pickupDate || !readyTime || !numPackages || !packageDescription) {
      res.status(400).json({ error: 'Missing required pickup fields' });
      return;
    }

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
      res.status(500).json({ error: 'SMTP is not configured' });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });

      const submittedAt = new Date().toISOString();
      const subject = `New Pickup Request - ${String(fullName)}`;
      const text = [
        'New pickup request received.',
        `Submitted at: ${submittedAt}`,
        `Name: ${fullName}`,
        `Mobile: ${phone}`,
        `City: ${city}`,
        `Address: ${address}`,
        `Notes: ${notes || '-'}`,
        `Pickup Date: ${pickupDate}`,
        `Ready Time: ${readyTime}`,
        `Packages: ${numPackages}`,
        `Package Description: ${packageDescription}`,
      ].join('\n');

      const html = `
        <div style="font-family: Arial, sans-serif; background:#f5f8fc; padding:24px; color:#0f172a;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0b3f77; padding:18px 24px; color:#ffffff;">
                <h2 style="margin:0; font-size:20px;">New Pickup Request</h2>
                <p style="margin:6px 0 0; font-size:12px; opacity:0.9;">Submitted at ${submittedAt}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
                  <tr><td style="padding:8px 0; width:200px; color:#64748b;">Customer Name</td><td style="padding:8px 0; font-weight:600;">${String(fullName)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">Mobile Number</td><td style="padding:8px 0; font-weight:600;">${String(phone)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">City</td><td style="padding:8px 0; font-weight:600;">${String(city)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">Address</td><td style="padding:8px 0; font-weight:600;">${String(address)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">Pickup Date</td><td style="padding:8px 0; font-weight:600;">${String(pickupDate)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">Ready Time</td><td style="padding:8px 0; font-weight:600;">${String(readyTime)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">Packages</td><td style="padding:8px 0; font-weight:600;">${String(numPackages)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">Package Description</td><td style="padding:8px 0; font-weight:600;">${String(packageDescription)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b; vertical-align:top;">Notes</td><td style="padding:8px 0; font-weight:600;">${String(notes || '-')}</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;

      const { pickupNotifyEmail } = await getNotificationSettings();
      await transporter.sendMail({
        from: env.SMTP_USER,
        to: pickupNotifyEmail,
        subject,
        text,
        html,
      });

      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: 'Could not send pickup notification email' });
    }
  });

  // Contact Us form — drafts an internal-only AI suggestion for the support team
  app.post('/api/contact/ai-suggestion', contactAiLimiter, async (req, res) => {
    const body = (req.body ?? {}) as ContactSubmitRequest;
    const { topic, name, mobile, message } = body;

    if (!topic || !name || !mobile || !message) {
      res.status(400).json({ error: 'topic, name, mobile and message are required' });
      return;
    }

    const topicLabel = CONTACT_TOPIC_LABELS[String(topic)] ?? String(topic);
    const formSummary = [
      `Topic: ${topicLabel}`,
      `Name: ${name}`,
      `Mobile: ${mobile}`,
      body.email ? `Email: ${body.email}` : '',
      body.trackingNumber ? `Tracking Number: ${body.trackingNumber}` : '',
      body.passportNumber ? `Passport Number: ${body.passportNumber}` : '',
      `Customer message: ${message}`,
    ].filter(Boolean).join('\n');

    try {
      const suggestion = await getContactAiSuggestion(formSummary);
      res.json(suggestion);
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      res.status(code === 'AI_NOT_CONFIGURED' ? 500 : 502).json({
        error: err instanceof Error ? err.message : 'Could not generate AI suggestion',
      });
    }
  });

  // Contact Us form — sends inquiry email to operations inbox
  app.post('/api/contact/log-ai-suggestion', contactAiLimiter, async (req, res) => {
    const body = (req.body ?? {}) as ContactSubmitRequest;
    const { topic, name, mobile, message } = body;

    if (!topic || !name || !mobile || !message) {
      res.status(400).json({ error: 'topic, name, mobile and message are required' });
      return;
    }

    const payload = buildContactLogPayload(body);

    const logId = await repo.createContactMessageLog({
      topic: payload.topic,
      name: payload.name,
      mobile: payload.mobile,
      email: payload.email,
      message: payload.message,
      trackingNumber: payload.trackingNumber,
      passportNumber: payload.passportNumber,
      language: payload.language,
      aiAnswer: payload.aiAnswer,
      aiRelatedTopics: payload.aiRelatedTopicsJson,
    });

    if (logId === null) {
      res.status(503).json({ error: 'Could not persist contact inquiry. Please try again.' });
      return;
    }

    res.json({ ok: true, logId });
  });

  // Contact Us form — sends inquiry email to operations inbox
  app.post('/api/contact/submit', contactSubmitLimiter, async (req, res) => {
    const {
      logId,
      topic,
      name,
      mobile,
      email,
      message,
      trackingNumber,
      passportNumber,
      language,
      aiSuggestion,
    } = (req.body ?? {}) as ContactSubmitRequest;

    if (!topic || !name || !mobile || !message) {
      res.status(400).json({ error: 'topic, name, mobile and message are required' });
      return;
    }

    const payload = buildContactLogPayload({
      topic,
      name,
      mobile,
      email,
      message,
      trackingNumber,
      passportNumber,
      language,
      aiSuggestion,
    });

    let persistedLogId = typeof logId === 'number' && Number.isFinite(logId) && logId > 0 ? logId : null;

    if (persistedLogId !== null) {
      const updated = await repo.updateContactMessageLog(persistedLogId, {
        topic: payload.topic,
        name: payload.name,
        mobile: payload.mobile,
        email: payload.email,
        message: payload.message,
        trackingNumber: payload.trackingNumber,
        passportNumber: payload.passportNumber,
        language: payload.language,
        aiAnswer: payload.aiAnswer,
        aiRelatedTopics: payload.aiRelatedTopicsJson,
      });

      if (!updated) {
        persistedLogId = null;
      }
    }

    if (persistedLogId === null) {
      persistedLogId = await repo.createContactMessageLog({
        topic: payload.topic,
        name: payload.name,
        mobile: payload.mobile,
        email: payload.email,
        message: payload.message,
        trackingNumber: payload.trackingNumber,
        passportNumber: payload.passportNumber,
        language: payload.language,
        aiAnswer: payload.aiAnswer,
        aiRelatedTopics: payload.aiRelatedTopicsJson,
      });
    }

    if (persistedLogId === null) {
      res.status(503).json({ error: 'Could not persist contact inquiry. Please try again.' });
      return;
    }

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
      await repo.updateContactMessageLogStatus(persistedLogId, 'failed', 'SMTP is not configured');
      res.status(500).json({ error: 'SMTP is not configured' });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });

      const topicLabel = CONTACT_TOPIC_LABELS[String(topic)] ?? String(topic);
      const submittedAt = new Date().toISOString();
      const subject = `Contact Us: ${topicLabel} — ${String(name)}`;

      const extraRows = [
        trackingNumber ? `<tr><td style="padding:8px 0; width:200px; color:#64748b;">Tracking Number</td><td style="padding:8px 0; font-weight:600;">${String(trackingNumber)}</td></tr>` : '',
        passportNumber ? `<tr><td style="padding:8px 0; color:#64748b;">Passport Number</td><td style="padding:8px 0; font-weight:600;">${String(passportNumber)}</td></tr>` : '',
        email        ? `<tr><td style="padding:8px 0; color:#64748b;">Email</td><td style="padding:8px 0; font-weight:600;">${String(email)}</td></tr>` : '',
      ].join('');

      const html = `
        <div style="font-family: Arial, sans-serif; background:#f5f8fc; padding:24px; color:#0f172a;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0b3f77; padding:18px 24px; color:#ffffff;">
                <h2 style="margin:0; font-size:20px;">Contact Us — ${topicLabel}</h2>
                <p style="margin:6px 0 0; font-size:12px; opacity:0.9;">Submitted at ${submittedAt}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
                  <tr><td style="padding:8px 0; width:200px; color:#64748b;">Name</td><td style="padding:8px 0; font-weight:600;">${String(name)}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b;">Mobile</td><td style="padding:8px 0; font-weight:600;">${String(mobile)}</td></tr>
                  ${extraRows}
                  <tr><td style="padding:8px 0; color:#64748b; vertical-align:top;">Message</td><td style="padding:8px 0; font-weight:600;">${String(message).replace(/\n/g, '<br>')}</td></tr>
                  <tr><td style="padding:8px 0; color:#64748b; vertical-align:top;">AI Answer</td><td style="padding:8px 0; font-weight:600;">${payload.aiAnswer.replace(/\n/g, '<br>')}</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;

      const text = [
        `Contact Us — ${topicLabel}`,
        `Submitted at: ${submittedAt}`,
        `Name: ${name}`,
        `Mobile: ${mobile}`,
        email          ? `Email: ${email}` : '',
        trackingNumber ? `Tracking Number: ${trackingNumber}` : '',
        passportNumber ? `Passport Number: ${passportNumber}` : '',
        `Message: ${message}`,
        `AI Answer: ${payload.aiAnswer}`,
        payload.aiRelatedTopics.length ? `AI Related Topics: ${payload.aiRelatedTopics.join(', ')}` : '',
      ].filter(Boolean).join('\n');

      const recipient = await resolveContactRecipient(String(topic));
      await transporter.sendMail({
        from: env.SMTP_USER,
        to: recipient,
        subject,
        text,
        html,
      });

      await repo.updateContactMessageLogStatus(persistedLogId, 'sent', null);

      res.json({ ok: true });
    } catch (err) {
      const emailError = err instanceof Error ? err.message : String(err);
      await repo.updateContactMessageLogStatus(persistedLogId, 'failed', emailError);
      res.status(502).json({ error: 'Could not send contact email' });
    }
  });

  // Shipping rate request — customer asks customer service to follow up on a quoted rate
  app.post('/api/shipping-request/submit', sendRequestLimiter, async (req, res) => {
    const body = (req.body ?? {}) as ShippingRequestSubmitRequest;
    const { requestType, customerName, customerPhone, customerEmail, isDocument, weight, rate } = body;

    if (!requestType || !customerName || !customerPhone || typeof isDocument !== 'boolean' || !weight || !rate) {
      res.status(400).json({ error: 'requestType, customerName, customerPhone, isDocument, weight and rate are required' });
      return;
    }

    if (!body.shipmentContents?.trim()) {
      res.status(400).json({ error: 'shipmentContents is required' });
      return;
    }

    if (requestType === 'domestic' && !body.addressDetails?.trim()) {
      res.status(400).json({ error: 'addressDetails is required for domestic shipping requests' });
      return;
    }

    const origin = body.origin ?? {};
    const destination = body.destination ?? {};
    const isAr = String(body.language ?? 'ar').trim().toLowerCase().startsWith('ar');

    const logId = await repo.createShippingRequestLog({
      requestType,
      customerName: String(customerName),
      customerPhone: String(customerPhone),
      customerEmail: customerEmail ? String(customerEmail) : null,
      isDocument,
      weight: Number(weight),
      pkgLength: body.pkgLength != null ? Number(body.pkgLength) : null,
      pkgWidth: body.pkgWidth != null ? Number(body.pkgWidth) : null,
      pkgHeight: body.pkgHeight != null ? Number(body.pkgHeight) : null,
      originCountry: origin.country ? String(origin.country) : null,
      originCity: origin.city ? String(origin.city) : null,
      originZip: origin.zip ? String(origin.zip) : null,
      destCountry: destination.country ? String(destination.country) : null,
      destCity: destination.city ? String(destination.city) : null,
      destZip: destination.zip ? String(destination.zip) : null,
      provider: rate.provider ? String(rate.provider) : null,
      service: rate.service ? String(rate.service) : null,
      price: rate.price != null ? Number(rate.price) : null,
      currency: rate.currency ? String(rate.currency) : null,
      deliveryEstimate: rate.deliveryDate ? String(rate.deliveryDate) : null,
      shipmentContents: body.shipmentContents ? String(body.shipmentContents) : null,
      addressDetails: body.addressDetails ? String(body.addressDetails) : null,
      notes: body.notes ? String(body.notes) : null,
      language: body.language ? String(body.language) : null,
    });

    if (logId === null) {
      res.status(503).json({ error: 'Could not persist shipping request. Please try again.' });
      return;
    }

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
      await repo.updateShippingRequestLogStatus(logId, 'failed', 'SMTP is not configured');
      res.status(500).json({ error: 'SMTP is not configured' });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });

      const submittedAt = new Date().toISOString();
      const typeLabel = requestType === 'international'
        ? (isAr ? 'دولي' : 'International')
        : (isAr ? 'محلي' : 'Domestic');
      const shipmentKindLabel = isDocument
        ? (isAr ? 'مستند' : 'Document')
        : (isAr ? 'طرد' : 'Parcel');
      const routeText = [origin.city, origin.country].filter(Boolean).join(', ')
        + ' → '
        + [destination.city, destination.country].filter(Boolean).join(', ');
      const dimensionsText = body.pkgLength && body.pkgWidth && body.pkgHeight
        ? `${body.pkgLength} × ${body.pkgWidth} × ${body.pkgHeight} cm`
        : '-';

      const subject = `${isAr ? 'طلب شحن' : 'Shipping Request'} — ${typeLabel} — ${String(customerName)}`;

      const rows: Array<[string, string]> = [
        [isAr ? 'اسم العميل' : 'Customer Name', String(customerName)],
        [isAr ? 'رقم الهاتف' : 'Phone', String(customerPhone)],
        ...(customerEmail ? [[isAr ? 'البريد الإلكتروني' : 'Email', String(customerEmail)] as [string, string]] : []),
        [isAr ? 'نوع الشحن' : 'Shipment Type', typeLabel],
        [isAr ? 'مستند / طرد' : 'Document / Parcel', shipmentKindLabel],
        [isAr ? 'المسار' : 'Route', routeText],
        ...(requestType === 'international' && destination.zip
          ? [[isAr ? 'الرمز البريدي للوجهة' : 'Destination Postal Code', String(destination.zip)] as [string, string]]
          : []),
        [isAr ? 'الوزن' : 'Weight', `${weight} kg`],
        [isAr ? 'الأبعاد' : 'Dimensions', dimensionsText],
        ...(body.shipmentContents ? [[isAr ? 'محتوى الشحنة' : 'Shipment Contents', String(body.shipmentContents)] as [string, string]] : []),
        ...(body.addressDetails ? [[isAr ? 'تفاصيل العنوان' : 'Address Details', String(body.addressDetails)] as [string, string]] : []),
        ...(body.notes ? [[isAr ? 'الملاحظات' : 'Notes', String(body.notes)] as [string, string]] : []),
        [isAr ? 'الناقل / الخدمة' : 'Carrier / Service', `${rate.provider} — ${rate.service}`],
        [isAr ? 'السعر المعروض' : 'Quoted Price', `${rate.price.toFixed(2)} ${rate.currency}`],
        [isAr ? 'التوصيل المتوقع' : 'Est. Delivery', rate.deliveryDate],
      ];

      const htmlRows = rows.map(([label, value]) =>
        `<tr><td style="padding:8px 0; width:220px; color:#64748b;">${label}</td><td style="padding:8px 0; font-weight:600;">${value}</td></tr>`
      ).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; background:#f5f8fc; padding:24px; color:#0f172a;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0b3f77; padding:18px 24px; color:#ffffff;">
                <h2 style="margin:0; font-size:20px;">${isAr ? 'طلب شحن جديد' : 'New Shipping Request'}</h2>
                <p style="margin:6px 0 0; font-size:12px; opacity:0.9;">${isAr ? 'أُرسل في' : 'Submitted at'} ${submittedAt}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
                  ${htmlRows}
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;

      const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

      await transporter.sendMail({
        from: env.SMTP_USER,
        to: env.SHIPPING_REQUEST_NOTIFY_EMAIL,
        subject,
        text,
        html,
      });

      await repo.updateShippingRequestLogStatus(logId, 'sent', null);

      res.json({ ok: true, logId });
    } catch (err) {
      const emailError = err instanceof Error ? err.message : String(err);
      await repo.updateShippingRequestLogStatus(logId, 'failed', emailError);
      res.status(502).json({ error: 'Could not send shipping request email' });
    }
  });

  // Business account requests — the public "Open Account" wizard (floating action bar).
  // Persisted as a corporate lead and emailed to the sales inbox; followed up from
  // /admin/business-accounts.
  app.post('/api/business-account/submit', sendRequestLimiter, async (req, res) => {
    const body = (req.body ?? {}) as BusinessAccountSubmitRequest;
    const companyName = String(body.companyName ?? '').trim();
    const contactName = String(body.contactName ?? '').trim();
    const contactEmail = String(body.contactEmail ?? '').trim();
    const contactPhone = String(body.contactPhone ?? '').trim();

    if (!companyName || !contactName || !contactEmail || !contactPhone) {
      res.status(400).json({ error: 'companyName, contactName, contactEmail and contactPhone are required' });
      return;
    }

    const services = Array.isArray(body.services) ? body.services.map((s) => String(s)).slice(0, 20) : [];
    const isAr = String(body.language ?? 'ar').trim().toLowerCase().startsWith('ar');

    const id = await repo.createBusinessAccountRequest({
      services,
      companyName,
      companyRegNo: body.companyRegNo ? String(body.companyRegNo).trim() : null,
      industry: body.industry ? String(body.industry).trim() : null,
      website: body.website ? String(body.website).trim() : null,
      monthlyVolumeBand: body.monthlyVolumeBand ? String(body.monthlyVolumeBand).trim() : null,
      contactName,
      contactRole: body.contactRole ? String(body.contactRole).trim() : null,
      contactEmail,
      contactPhone,
      pickupCity: body.pickupCity ? String(body.pickupCity).trim() : null,
      pickupArea: body.pickupArea ? String(body.pickupArea).trim() : null,
      destinations: body.destinations ? String(body.destinations).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      language: body.language ? String(body.language) : null,
    });

    if (id === null) {
      res.status(503).json({ error: 'Could not persist your request. Please try again.' });
      return;
    }

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
      await repo.updateBusinessAccountEmailStatus(id, 'failed', 'SMTP is not configured');
      res.status(200).json({ ok: true, id });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      });

      const submittedAt = new Date().toISOString();
      const subject = `${isAr ? 'طلب فتح حساب تجاري' : 'Business Account Request'} — ${companyName}`;

      const rows: Array<[string, string]> = [
        [isAr ? 'اسم الشركة' : 'Company', companyName],
        ...(body.companyRegNo ? [[isAr ? 'السجل التجاري / الرقم الضريبي' : 'Reg. / Tax No.', String(body.companyRegNo)] as [string, string]] : []),
        ...(body.industry ? [[isAr ? 'القطاع' : 'Industry', String(body.industry)] as [string, string]] : []),
        ...(body.website ? [[isAr ? 'الموقع الإلكتروني' : 'Website', String(body.website)] as [string, string]] : []),
        ...(body.monthlyVolumeBand ? [[isAr ? 'حجم الشحنات الشهري' : 'Monthly Volume', String(body.monthlyVolumeBand)] as [string, string]] : []),
        [isAr ? 'الخدمات المطلوبة' : 'Services', services.join(', ') || '—'],
        [isAr ? 'الشخص المسؤول' : 'Contact', contactName],
        ...(body.contactRole ? [[isAr ? 'المسمى الوظيفي' : 'Role', String(body.contactRole)] as [string, string]] : []),
        [isAr ? 'البريد الإلكتروني' : 'Email', contactEmail],
        [isAr ? 'رقم الجوال' : 'Mobile', contactPhone],
        ...(body.pickupCity ? [[isAr ? 'مدينة الاستلام' : 'Pickup City', String(body.pickupCity)] as [string, string]] : []),
        ...(body.pickupArea ? [[isAr ? 'منطقة الاستلام' : 'Pickup Area', String(body.pickupArea)] as [string, string]] : []),
        ...(body.destinations ? [[isAr ? 'الوجهات' : 'Destinations', String(body.destinations)] as [string, string]] : []),
        ...(body.notes ? [[isAr ? 'ملاحظات' : 'Notes', String(body.notes)] as [string, string]] : []),
        [isAr ? 'رقم الطلب' : 'Reference', String(id)],
      ];

      const htmlRows = rows.map(([label, value]) =>
        `<tr><td style="padding:8px 0; width:220px; color:#64748b;">${label}</td><td style="padding:8px 0; font-weight:600;">${String(value).replace(/\n/g, '<br>')}</td></tr>`
      ).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; background:#f5f8fc; padding:24px; color:#0f172a;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0b3f77; padding:18px 24px; color:#ffffff;">
                <h2 style="margin:0; font-size:20px;">${isAr ? 'طلب فتح حساب تجاري جديد' : 'New Business Account Request'}</h2>
                <p style="margin:6px 0 0; font-size:12px; opacity:0.9;">${isAr ? 'أُرسل في' : 'Submitted at'} ${submittedAt}</p>
              </td>
            </tr>
            <tr><td style="padding:20px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">${htmlRows}</table>
            </td></tr>
          </table>
        </div>
      `;

      const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

      await transporter.sendMail({
        from: env.SMTP_USER,
        to: await resolveBusinessAccountRecipient(),
        subject,
        text,
        html,
      });

      await repo.updateBusinessAccountEmailStatus(id, 'sent', null);

      // Confirmation to the customer — best effort, never affects the response or the
      // internal email status.
      try {
        const custSubject = isAr
          ? 'تم استلام طلب فتح حسابك التجاري | واصل'
          : 'We received your business account request | Wassel';
        const custGreeting = isAr ? `مرحباً ${contactName}،` : `Hi ${contactName},`;
        const custBody = isAr
          ? `شكراً لاهتمامك بفتح حساب تجاري مع واصل. لقد استلمنا طلب شركة «${companyName}»، وسيتواصل معك فريق القسم التجاري خلال يومَي عمل لاستكمال الإجراءات.`
          : `Thank you for your interest in opening a business account with Wassel. We've received the request for "${companyName}", and our commercial team will contact you within 2 business days to take it forward.`;
        const custClosing = isAr ? 'فريق واصل' : 'The Wassel Team';

        await transporter.sendMail({
          from: env.SMTP_USER,
          to: contactEmail,
          subject: custSubject,
          text: `${custGreeting}\n\n${custBody}\n\n${custClosing}`,
          html: `
            <div style="font-family: Arial, sans-serif; background:#f5f8fc; padding:24px; color:#0f172a;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
                <tr><td style="background:#0b3f77; padding:18px 24px; color:#ffffff;">
                  <h2 style="margin:0; font-size:20px;">${isAr ? 'واصل' : 'Wassel'}</h2>
                </td></tr>
                <tr><td style="padding:24px; font-size:14px; line-height:1.7;">
                  <p style="margin:0 0 12px;">${custGreeting}</p>
                  <p style="margin:0 0 12px;">${custBody}</p>
                  <p style="margin:16px 0 0; color:#64748b;">${custClosing}</p>
                </td></tr>
              </table>
            </div>
          `,
        });
      } catch (custErr) {
        logger.warn(`Business account confirmation email to customer failed (request ${id}): ${String(custErr)}`);
      }

      res.json({ ok: true, id });
    } catch (err) {
      const emailError = err instanceof Error ? err.message : String(err);
      await repo.updateBusinessAccountEmailStatus(id, 'failed', emailError);
      // The lead is saved — surface success to the customer even if the email failed.
      res.json({ ok: true, id });
    }
  });

  // Admin: list all business account requests
  app.get('/api/business-account/requests', requireAuth, async (_req, res) => {
    const items = await repo.fetchBusinessAccountRequests();
    res.json({ items });
  });

  // Admin: move a business account request through its follow-up workflow
  app.patch('/api/business-account/requests/:id/status', requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const status = String(req.body?.status ?? '').trim();
    const allowed: BusinessAccountStatus[] = ['new', 'contacted', 'approved', 'rejected'];

    if (isNaN(id) || !allowed.includes(status as BusinessAccountStatus)) {
      res.status(400).json({ error: 'Valid id and status (new/contacted/approved/rejected) are required' });
      return;
    }

    const updated = await repo.updateBusinessAccountRequestStatus(id, status as BusinessAccountStatus);
    if (!updated) {
      res.status(404).json({ error: 'Business account request not found or could not be updated' });
      return;
    }

    res.json({ ok: true });
  });

  // Waiting-to-arrive shipments — customer registers a tracking number that isn't found yet,
  // so a (separately configured) recurring job can re-check it and notify them once it appears.

  // Pre-check before showing the registration form, so the customer isn't asked to fill it out
  // just to be told afterward that this tracking number is already registered.
  app.get('/api/waiting-shipments/check', waitingShipmentsLimiter, async (req, res) => {
    const trackingNumber = String(req.query.trackingNumber ?? '').trim();
    if (!trackingNumber) {
      res.status(400).json({ error: 'trackingNumber query parameter is required' });
      return;
    }
    const registered = await repo.isWaitingShipmentRegistered(trackingNumber);
    res.json({ registered });
  });

  app.post('/api/waiting-shipments/register', waitingShipmentsLimiter, async (req, res) => {
    const body = (req.body ?? {}) as WaitingShipmentRegisterRequest;
    const trackingNumber = String(body.trackingNumber ?? '').trim();
    const customerName = String(body.customerName ?? '').trim();
    const customerEmail = String(body.customerEmail ?? '').trim();
    const customerPhone = String(body.customerPhone ?? '').trim();

    if (!trackingNumber || !customerName || !customerEmail || !customerPhone) {
      res.status(400).json({ error: 'trackingNumber, customerName, customerEmail and customerPhone are required' });
      return;
    }

    const id = await repo.createWaitingShipment({
      trackingNumber,
      customerName,
      customerEmail,
      customerPhone,
      carrier: body.carrier ? String(body.carrier) : null,
      language: body.language ? String(body.language) : null,
    });

    if (id === 'duplicate') {
      res.status(409).json({
        error: 'ALREADY_REGISTERED',
        message: 'This tracking number is already registered.',
      });
      return;
    }

    if (id === null) {
      res.status(503).json({ error: 'Could not save your request. Please try again.' });
      return;
    }

    res.json({ ok: true, id });
  });

  // Admin: list all waiting-to-arrive shipment registrations
  app.get('/api/waiting-shipments', requireAuth, async (_req, res) => {
    const items = await repo.fetchWaitingShipments();
    res.json({ items });
  });

  // Admin: update a waiting shipment's status (e.g. after sending a manual SMS notification)
  app.patch('/api/waiting-shipments/:id/status', requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const status = String(req.body?.status ?? '').trim();

    if (isNaN(id) || !['pending', 'found', 'notified', 'expired'].includes(status)) {
      res.status(400).json({ error: 'Valid id and status (pending/found/notified/expired) are required' });
      return;
    }

    const updated = await repo.updateWaitingShipmentStatus(id, status as 'pending' | 'found' | 'notified' | 'expired');
    if (!updated) {
      res.status(404).json({ error: 'Waiting shipment not found or could not be updated' });
      return;
    }

    res.json({ ok: true });
  });

  // Wassel AWB tracking proxy — avoids mixed-content/CORS issues from the browser
  app.get('/api/wassel/track', trackingLimiter, async (req, res) => {
    const awbs = String(req.query.Awbs ?? '').trim();
    if (!awbs) {
      res.status(400).json({ error: 'Awbs query parameter is required' });
      return;
    }
    try {
      const upstream = await fetch(wasselAwbDetailsUrl(awbs), {
        method: 'GET',
        headers: wasselAwbHeaders(),
      });
      const data = await upstream.json().catch(() => ({}));
      res.status(upstream.status).json(data);
    } catch {
      res.status(502).json({ error: 'Wassel AWB upstream error' });
    }
  });

  // Wassel AWB tracking proxy (without destinationLog) — same as /api/wassel/track but strips destinationLog from each item
  app.get('/api/wassel/track-without-logs', trackingLimiter, async (req, res) => {
    const awbs = String(req.query.Awbs ?? '').trim();
    if (!awbs) {
      res.status(400).json({ error: 'Awbs query parameter is required' });
      return;
    }
    try {
      const upstream = await fetch(wasselAwbDetailsUrl(awbs), {
        method: 'GET',
        headers: wasselAwbHeaders(),
      });
      const payload = await upstream.json().catch(() => ({})) as { data?: Record<string, unknown>[]; message?: unknown; isSuccess?: unknown };
      const strippedData = Array.isArray(payload.data)
        ? payload.data.map((item) => {
            const { destinationLog: _omit, ...rest } = item as Record<string, unknown> & { destinationLog?: unknown };
            return rest;
          })
        : payload.data;
      res.status(upstream.status).json({
        data: strippedData,
        message: payload.message,
        isSuccess: payload.isSuccess,
      });
    } catch {
      res.status(502).json({ error: 'Wassel AWB upstream error' });
    }
  });

  // QuickRate proxy — forwards to quickrate.wassel.ps with the server-side API key
  app.post('/api/quickrate/*', quickrateLimiter, async (req, res) => {
    const upstreamPath = req.path.replace('/api/quickrate', '');
    const url = `${env.QUICKRATE_BASE_URL}${upstreamPath}`;
    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.QUICKRATE_API_KEY,
        },
        body: JSON.stringify(req.body),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await upstream.json().catch(() => ({}));

      if (env.QUICKRATE_RESULT_MODE === 'lowest' && Array.isArray(data.quotes) && data.quotes.length > 0) {
        const lowest = data.quotes.reduce((min: { price: number }, q: { price: number }) =>
          q.price < min.price ? q : min
        );
        const filtered = { ...data, quotes: [{ ...lowest, carrier: '', serviceType: '' }] };
        res.status(upstream.status).json(filtered);
        return;
      }

      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'QuickRate upstream error' });
    }
  });

  // Serve the bundled frontend from the same host when present.
  if (frontendDistPath) {
    app.use(express.static(frontendDistPath));

    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api/') ||
        req.path === '/api' ||
        req.path.startsWith('/respond') ||
        req.path === '/health'
      ) {
        next();
        return;
      }

      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  } else {
    // Fallback root response when frontend bundle is not packaged.
    app.get('/', (_req, res) => {
      res.json({ name: 'Wassel Chat Backend', status: 'running', ts: new Date().toISOString() });
    });
  }

  // Centralised error handler (must be last)
  app.use(errorHandler);

  return app;
}
