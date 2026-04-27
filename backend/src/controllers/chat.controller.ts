import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';
import { StartChatRequest, SendMessageRequest, CloseSessionRequest } from '../types/chat.types';

export async function startChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await chatService.startChat(req.body as StartChatRequest);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await chatService.sendMessage(req.body as SendMessageRequest);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const result = await chatService.getMessages(sessionId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function closeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.closeSession(req.body as CloseSessionRequest);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
