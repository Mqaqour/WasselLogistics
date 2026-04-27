export interface ChatMessage {
  messageId: string;
  senderType: 'visitor' | 'agent' | 'system';
  messageType: 'text' | 'attachment';
  messageText: string | null;
  createdAt: string;
  pending?: boolean;
}

export interface ChatSession {
  sessionId: string;
  contactId: string;
}

export type ServiceType =
  | 'Domestic Shipping'
  | 'International Express'
  | 'Cargo / Heavy Freight'
  | 'Customs Clearance'
  | 'Jordanian Passports'
  | 'Passport Delivery'
  | 'Shop & Ship'
  | 'Complaints'
  | 'Other';

export interface PreChatFormData {
  firstName: string;
  phone: string;
  email?: string;
  serviceType: ServiceType;
  trackingNumber?: string;
  firstMessage: string;
  language: 'ar' | 'en';
}

export type WidgetState = 'closed' | 'pre-chat' | 'chat';
