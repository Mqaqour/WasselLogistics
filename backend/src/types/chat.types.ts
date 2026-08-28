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

export interface ContactMessageLog {
  id: number;
  topic: string;
  name: string;
  mobile: string;
  email: string | null;
  message: string;
  trackingNumber: string | null;
  passportNumber: string | null;
  language: string | null;
  aiAnswer: string | null;
  aiRelatedTopics: string | null;
  emailDeliveryStatus: 'pending' | 'sent' | 'failed';
  emailError: string | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface SendMessageAttachment {
  url: string;
  attachmentType: 'image' | 'video' | 'audio' | 'file';
  mimeType: string;
  fileName: string;
}

export interface SendMessageRequest {
  sessionId: string;
  message?: string;
  attachment?: SendMessageAttachment;
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
  attachmentUrl: string | null;
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
  message:
    | { type: 'text'; text: string }
    | { type: 'attachment'; attachment: { type: 'image' | 'video' | 'audio' | 'file'; url: string; mimeType: string; fileName: string } };
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
  attachmentUrl: string | null;
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

export interface ShippingRequestLog {
  id: number;
  requestType: 'international' | 'domestic';
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  isDocument: boolean;
  weight: number;
  pkgLength: number | null;
  pkgWidth: number | null;
  pkgHeight: number | null;
  originCountry: string | null;
  originCity: string | null;
  originZip: string | null;
  destCountry: string | null;
  destCity: string | null;
  destZip: string | null;
  provider: string | null;
  service: string | null;
  price: number | null;
  currency: string | null;
  deliveryEstimate: string | null;
  shipmentContents: string | null;
  addressDetails: string | null;
  notes: string | null;
  language: string | null;
  emailDeliveryStatus: 'pending' | 'sent' | 'failed';
  emailError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingRequestSubmitRequest {
  requestType: 'international' | 'domestic';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  isDocument: boolean;
  weight: number;
  pkgLength?: number;
  pkgWidth?: number;
  pkgHeight?: number;
  origin?: { country?: string; city?: string; zip?: string };
  destination?: { country?: string; city?: string; zip?: string };
  rate: { provider: string; service: string; price: number; currency: string; deliveryDate: string };
  shipmentContents?: string;
  addressDetails?: string;
  notes?: string;
  language?: string;
}

export interface WaitingShipmentEntry {
  id: number;
  trackingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  carrier: string | null;
  language: string | null;
  status: 'pending' | 'found' | 'notified' | 'expired';
  lastCheckedAt: Date | null;
  foundAt: Date | null;
  createdAt: Date;
}

export interface WaitingShipmentRegisterRequest {
  trackingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  carrier?: string;
  language?: string;
}

export interface ContactSubmitRequest {
  logId?: number;
  topic: string;
  name: string;
  mobile: string;
  email?: string;
  message: string;
  trackingNumber?: string;
  passportNumber?: string;
  language?: string;
  aiSuggestion?: {
    answer: string;
    relatedTopics: string[];
  } | null;
}

export type BusinessAccountStatus = 'new' | 'contacted' | 'approved' | 'rejected';

export interface BusinessAccountRequest {
  id: number;
  services: string[];
  companyName: string;
  companyRegNo: string | null;
  industry: string | null;
  website: string | null;
  monthlyVolumeBand: string | null;
  contactName: string;
  contactRole: string | null;
  contactEmail: string;
  contactPhone: string;
  pickupCity: string | null;
  pickupArea: string | null;
  destinations: string | null;
  notes: string | null;
  language: string | null;
  status: BusinessAccountStatus;
  emailDeliveryStatus: 'pending' | 'sent' | 'failed';
  emailError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessAccountSubmitRequest {
  services?: string[];
  companyName: string;
  companyRegNo?: string;
  industry?: string;
  website?: string;
  monthlyVolumeBand?: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  contactPhone: string;
  pickupCity?: string;
  pickupArea?: string;
  destinations?: string;
  notes?: string;
  language?: string;
}
