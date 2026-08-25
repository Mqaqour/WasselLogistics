import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';
import { buildProjectUploadUrl, ensureUploadsDirectories, projectUploadsDir } from '../utils/uploads';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function extensionForMimeType(mimeType: string): string | null {
  return MIME_TO_EXTENSION[mimeType] ?? null;
}

export async function uploadProjectImage(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'Image file is required.' });
    return;
  }

  const extension = extensionForMimeType(file.mimetype);
  if (!extension) {
    res.status(400).json({ error: 'Unsupported image type.' });
    return;
  }

  ensureUploadsDirectories();

  const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const destination = path.join(projectUploadsDir, fileName);

  await fs.writeFile(destination, file.buffer, { flag: 'wx' });

  res.status(201).json({
    url: buildProjectUploadUrl(fileName),
    fileName,
    mimeType: file.mimetype,
    size: file.size,
  });
}
