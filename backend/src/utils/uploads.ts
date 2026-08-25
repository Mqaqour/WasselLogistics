import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

function normalizePublicBase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '/uploads';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/uploads';
}

function resolveUploadRoot(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return path.resolve(__dirname, '../../uploads');
  }

  return path.isAbsolute(trimmed)
    ? trimmed
    : path.resolve(__dirname, '../../', trimmed);
}

export const uploadsPublicBase = normalizePublicBase(env.UPLOADS_PUBLIC_BASE);
export const uploadsRoot = resolveUploadRoot(env.UPLOADS_ROOT);
export const projectUploadsSubdir = env.PROJECT_UPLOADS_SUBDIR.trim() || 'projects';
export const projectUploadsDir = path.join(uploadsRoot, projectUploadsSubdir);

export function ensureUploadsDirectories(): void {
  fs.mkdirSync(projectUploadsDir, { recursive: true });
}

export function buildProjectUploadUrl(fileName: string): string {
  return `${uploadsPublicBase}/${encodeURIComponent(projectUploadsSubdir)}/${encodeURIComponent(fileName)}`;
}
