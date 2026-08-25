import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { env } from './config/env';
import * as repo from './repositories/chat.repository';
import { ContactSubmitRequest } from './types/chat.types';
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
import { errorHandler } from './middleware/errorHandler';

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
          'https://api.respond.io',
          'https://app.respond.io',
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
  app.use(cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));
  // Respond 204 to all OPTIONS preflight requests before any auth middleware
  app.options('*', cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  // Routes
  app.use('/api/chat',      chatRoutes);
  app.use('/api/respondio', respondioRoutes);
  app.use('/api/ai',        aiRoutes);
  app.use('/api/auth',      authRoutes);
  app.use('/respond',       respondioRoutes); // respond.io outgoing webhook calls /respond/message

  // Knowledge Base — Questions, Topics & Tags
  app.use('/api/questions',           questionsRoutes);
  app.use('/api/topics',              topicsRoutes);
  app.use('/api/tags',                tagsRoutes);
  app.use('/api/kb',                  kbAiRoutes);
  app.use('/api/resource-categories', resourceCategoriesRoutes);
  app.use('/api/resource-sub-items',  resourceSubItemsRoutes);

  // Jordan Passport proxy — forwards to jopassports.wassel.ps
  app.post('/api/jopassport/track', async (req, res) => {
    const { delivery_nos } = req.body;
    if (!delivery_nos) {
      res.status(400).json({ error: 'delivery_nos is required' });
      return;
    }
    try {
      const formData = new URLSearchParams();
      formData.append('delivery_nos', Array.isArray(delivery_nos) ? JSON.stringify(delivery_nos) : delivery_nos);
      formData.append('token', 'd5c5d928bfd0409627d725a90e05e120');
      const upstream = await fetch('http://jopassports.wassel.ps/passport/get_passport_detail_API', {
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

  // SMS gateway proxy — sends verification messages via Hadara SMS service
  app.post('/api/sms/send-verification', async (req, res) => {
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
  app.post('/api/pickup/request', async (req, res) => {
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

      await transporter.sendMail({
        from: env.SMTP_USER,
        to: env.PICKUP_NOTIFY_EMAIL,
        subject,
        text,
        html,
      });

      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: 'Could not send pickup notification email' });
    }
  });

  // Contact Us form — sends inquiry email to operations inbox
  app.post('/api/contact/log-ai-suggestion', async (req, res) => {
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
  app.post('/api/contact/submit', async (req, res) => {
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

      const topicLabels: Record<string, string> = {
        general: 'General Inquiry',
        shipment: 'Shipment Inquiry',
        passport: 'Jordan Passport Services',
        complaint: 'Complaint',
        claiming: 'Claiming',
      };
      const topicLabel = topicLabels[String(topic)] ?? String(topic);
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

      await transporter.sendMail({
        from: env.SMTP_USER,
        to: env.CONTACT_NOTIFY_EMAIL,
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

  // Wassel AWB tracking proxy — avoids mixed-content/CORS issues from the browser
  app.get('/api/wassel/track', async (req, res) => {
    const awbs = String(req.query.Awbs ?? '').trim();
    if (!awbs) {
      res.status(400).json({ error: 'Awbs query parameter is required' });
      return;
    }
    try {
      const upstream = await fetch(
        `http://external.wassel.ps:4040/api/GetAwbDetails?Awbs=${encodeURIComponent(awbs)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Basic ' + Buffer.from('ramallah_admin:Mo@2020!').toString('base64'),
          },
        }
      );
      const data = await upstream.json().catch(() => ({}));
      res.status(upstream.status).json(data);
    } catch {
      res.status(502).json({ error: 'Wassel AWB upstream error' });
    }
  });

  // Wassel AWB tracking proxy (without destinationLog) — same as /api/wassel/track but strips destinationLog from each item
  app.get('/api/wassel/track-without-logs', async (req, res) => {
    const awbs = String(req.query.Awbs ?? '').trim();
    if (!awbs) {
      res.status(400).json({ error: 'Awbs query parameter is required' });
      return;
    }
    try {
      const upstream = await fetch(
        `http://external.wassel.ps:4040/api/GetAwbDetails?Awbs=${encodeURIComponent(awbs)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Basic ' + Buffer.from('ramallah_admin:Mo@2020!').toString('base64'),
          },
        }
      );
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
  app.post('/api/quickrate/*', async (req, res) => {
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
