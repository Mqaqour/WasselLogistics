// ─────────────────────────────────────────────────────────────────────────────
// Ephemeral chat attachment storage.
//
// respond.io's Custom Channel API requires attachments to be sent as a public
// URL it fetches from — there is no inline/base64 option. Since we don't want
// to run real file storage for this, uploads are written to a temp folder and
// deleted on a timer a few minutes later.
//
// IMPORTANT: this used to delete the file the instant it was served once
// ("burn after read"), which broke real-world delivery — a fetcher can
// legitimately hit the URL more than once for a single download (a HEAD
// request to check content-type/size before the GET, a Range request that
// gets split into multiple requests, an automatic retry on a slow/dropped
// connection, ...). respond.io does exactly this, so the second request was
// landing on an already-deleted file and the image silently failed to reach
// the agent. The UUID filename is the actual access control (unguessable);
// the timer is just cleanup, not a single-use guarantee.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export const UPLOAD_DIR = path.join(__dirname, '../../tmp/chat-uploads');
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — comfortably under respond.io's media limits
const ORPHAN_CLEANUP_MS = 10 * 60 * 1000; // delete every upload 10 minutes after it's stored, fetched or not

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_MIME_EXACT = ['application/pdf'];

function isAllowedMime(mimetype: string): boolean {
  return ALLOWED_MIME_EXACT.includes(mimetype) || ALLOWED_MIME_PREFIXES.some((p) => mimetype.startsWith(p));
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).slice(0, 10)}`),
});

export const chatUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedMime(file.mimetype)) {
      cb(new Error('UNSUPPORTED_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
});

export function attachmentTypeForMime(mimetype: string): 'image' | 'video' | 'audio' | 'file' {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'file';
}

export function scheduleOrphanCleanup(filePath: string): void {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') logger.warn(`Failed to clean up orphaned chat upload ${filePath}: ${err.message}`);
    });
  }, ORPHAN_CLEANUP_MS).unref();
}

/**
 * Serve the file — possibly more than once (HEAD probes, Range requests, retries
 * all legitimately re-request the same URL). Deletion is left entirely to
 * `scheduleOrphanCleanup`'s timer; see the file-level comment for why.
 *
 * The global helmet config locks these responses down for the site itself
 * (`Cross-Origin-Resource-Policy: same-origin`, a strict CSP, `X-Frame-Options`).
 * respond.io renders the attachment with an <img> in the agent's browser on a
 * different site, so those defaults make the browser block it and show a broken
 * image. Relax them for this one endpoint: the unguessable UUID URL is the
 * access control, and the payload carries nothing sensitive.
 */
export function sendChatAttachment(res: import('express').Response, filePath: string): void {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Frame-Options');
  res.sendFile(filePath, { headers: { 'Content-Disposition': 'inline' } }, (err) => {
    if (err) logger.warn(`Failed to send chat upload ${filePath}: ${err.message}`);
  });
}
