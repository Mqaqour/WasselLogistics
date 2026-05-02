import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import { env } from './config/env';
import chatRoutes from './routes/chat.routes';
import respondioRoutes from './routes/respondio.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — supports single URL or comma-separated list in FRONTEND_URL
  const allowedOrigins = env.FRONTEND_URL
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));
  // Respond 204 to all OPTIONS preflight requests before any auth middleware
  app.options('*', cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
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
      const data = await upstream.json().catch(() => ({}));
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'QuickRate upstream error' });
    }
  });

  // Centralised error handler (must be last)
  app.use(errorHandler);

  return app;
}
