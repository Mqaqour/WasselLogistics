import { v4 as uuidv4 } from 'uuid';

export function generateSessionId(): string {
  return uuidv4();
}

export function generateMessageId(prefix: 'web' | 'agent' | 'system'): string {
  return `${prefix}_${uuidv4()}`;
}
