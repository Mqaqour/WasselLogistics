import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import * as controller from '../controllers/uploads.controller';

const router = Router();

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.PROJECT_IMAGE_MAX_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      return;
    }

    callback(null, true);
  },
});

router.post('/projects', (req, res, next) => {
  upload.single('image')(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Image exceeds the maximum allowed size.' });
        return;
      }

      res.status(400).json({ error: 'Only JPG, JPEG, PNG, and WebP images are allowed.' });
      return;
    }

    next(error);
  });
}, controller.uploadProjectImage);

export default router;
