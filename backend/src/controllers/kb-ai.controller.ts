import { Request, Response, NextFunction } from 'express';
import { generateKbSuggestions } from '../services/kb-ai.service';

/** POST /api/kb/generate — generate KB Q&A suggestions using Azure OpenAI */
export async function generateKb(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { topicCode, topicName, description, count, existingIntentKeys } = req.body as {
      topicCode?: string;
      topicName?: string;
      description?: string;
      count?: number;
      existingIntentKeys?: string[];
    };

    if (!topicCode || !topicName || !description) {
      res.status(400).json({ error: 'topicCode, topicName, and description are required' });
      return;
    }

    const clampedCount = count !== undefined ? Math.min(Math.max(Number(count), 1), 10) : 5;

    const suggestions = await generateKbSuggestions({
      topicCode,
      topicName,
      description,
      count: clampedCount,
      existingIntentKeys: Array.isArray(existingIntentKeys) ? existingIntentKeys : undefined,
    });

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}
