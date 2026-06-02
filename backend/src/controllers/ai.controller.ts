import { Request, Response, NextFunction } from 'express';
import { getResourceSearchResponse } from '../services/ai-agent.service';

export async function resourceSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  const query = String(req.body?.query ?? '').trim();

  try {
    if (!query) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'query is required',
        },
      });
      return;
    }

    const result = await getResourceSearchResponse(query);
    res.status(200).json(result);
  } catch (err) {
    const code = (err as { code?: string } | undefined)?.code;
    if (code === 'AI_NOT_CONFIGURED' || code === 'AI_REQUEST_FAILED' || code === 'AI_RATE_LIMITED') {
      const ar = /[\u0600-\u06FF]/.test(query);
      res.status(200).json({
        answer: ar
          ? 'تعذر توفير إجابة ذكية حالياً. يمكنك متابعة إرسال رسالتك وسيتواصل معك فريق الدعم.'
          : 'AI answer is temporarily unavailable. You can continue sending your message and our support team will follow up.',
        relatedTopics: [],
      });
      return;
    }

    next(err);
  }
}
