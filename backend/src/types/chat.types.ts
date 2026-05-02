export interface ChatSession {
  id: number;
  sessionId: string;
  contactId: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  serviceType: string | null;
  trackingNumber: string | null;
  language: string;
  status: 'open' | 'closed';
  assignedDepartment: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  contactId: string;
  messageId: string;
  respondMessageId: string | null;
  senderType: 'visitor' | 'agent' | 'system';
  messageType: 'text' | 'attachment' | 'location' | 'quick_reply';
  messageText: string | null;
  attachmentUrl: string | null;
  status: string;
  rawPayload: string | null;
  createdAt: Date;
}

export interface ChatEvent {
  id: number;
  sessionId: string | null;
  contactId: string | null;
  eventType: string;
  rawPayload: string | null;
  createdAt: Date;
}

// ── API DTOs ──────────────────────────────────────────────────────────────────

export interface StartChatRequest {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  serviceType: string;
  trackingNumber?: string;
  language?: string;
}

export interface StartChatResponse {
  success: true;
  sessionId: string;
  contactId: string;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

export interface SendMessageResponse {
  success: true;
  messageId: string;
  _forwarded?: boolean;
  _forwardError?: string;
  _respondBody?: string;
}

export interface GetMessagesResponse {
  success: true;
  messages: MessageDTO[];
}

export interface MessageDTO {
  messageId: string;
  senderType: string;
  messageType: string;
  messageText: string | null;
  createdAt: string;
}

export interface CloseSessionRequest {
  sessionId: string;
}

// ── respond.io Webhook Payload ────────────────────────────────────────────────

export interface RespondIoIncomingPayload {
  channelId: string;
  contactId: string;
  message: {
    type: 'text' | 'attachment' | 'location' | 'quick_reply';
    text?: string;
    // TODO: add attachment, location, quick_reply fields in future versions
  };
}

export interface RespondIoOutgoingEvent {
  type: 'message';
  mId: string;
  timestamp: number;
  message: {
    type: 'text';
    text: string;
  };
}

export interface RespondIoOutgoingPayload {
  channelId: string;
  contactId: string;
  events: RespondIoOutgoingEvent[];
  contact: {
    firstName: string | null;
    lastName: string | null;
    countryCode: string;
    email: string | null;
    phone: string;
    language: string;
  };
}

// ── Socket.IO Events ─────────────────────────────────────────────────────────

export interface SocketMessageNewEvent {
  messageId: string;
  senderType: string;
  messageType: string;
  messageText: string | null;
  createdAt: string;
}

// ── API Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
