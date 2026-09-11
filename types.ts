export type PageView = 'home' | 'tracking' | 'rates' | 'pickup' | 'login' | 'dashboard' | 'contact' | 'resources' | 'about' | 'novica'
| 'booking_window'
| 'kb-admin'
| 'system-settings'
| 'business-accounts';

export type Language = 'en' | 'ar';

export interface RateResult {
  provider: string;
  service: string;
  price: number;
  currency: string;
  deliveryDate: string;
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
  icon: 'box' | 'truck' | 'check' | 'alert';
  relativeTime?: string;
  day?: string;
  date?: string;
  time?: string;
  /** Carrier exception attached to this scan (e.g. FedEx "Package available for clearance"). */
  exception?: { code: string; description: string };
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: 'In Transit' | 'Delivered' | 'Pending' | 'Exception';
  eta: string;
}

export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}