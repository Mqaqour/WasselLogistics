// ─────────────────────────────────────────────────────────────────────────────
// Ephemeral chat attachment storage.
//
// respond.io's Custom Channel API requires attachments to be sent as a public
// URL it fetches from — there is no inline/base64 option. Since we don't want
// to run real file storage for this, uploads are written to a temp folder,
// served exactly once, and deleted right after (with a timed fallback in case
// the file is never fetched, e.g. the respond.io forward fails).
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export const UPLOAD_DIR = path.join(__dirname, '../../tmp/chat-uploads');
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — comfortably under respond.io's media limits
const ORPHAN_CLEANUP_MS = 10 * 60 * 1000; // delete unfetched uploads after 10 minutes

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

/** Serve the file once, then delete it — burn-after-read. */
export function sendChatAttachmentOnce(res: import('express').Response, filePath: string): void {
  res.sendFile(filePath, (err) => {
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        logger.warn(`Failed to delete chat upload after serving ${filePath}: ${unlinkErr.message}`);
      }
    });
    if (err) logger.warn(`Failed to send chat upload ${filePath}: ${err.message}`);
  });
}
