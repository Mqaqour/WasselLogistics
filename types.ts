
export type PageView = 'home' | 'tracking' | 'rates' | 'pickup' | 'login' | 'dashboard' | 'payment' | 'services' | 'payment-gateway' | 'corporate' | 'about' | 'management' | 'contact' | 'handmade' | 'resources' | 'industries' | 'latest_updates'
| 'service-clearance' 
| 'service-express' 
| 'service-domestic' 
| 'service-shop' 
| 'service-idp' 
| 'service-jordanian'
| 'service-pick-pack'
| 'service-corp-daily'
| 'service-corp-signing'
| 'service-corp-bulk'
| 'service-corp-storage'
| 'service-corp-warehousing'
| 'service-corp-freight'
| 'service-multimodal-freight'
| 'booking_window';

export type Language = 'en' | 'ar';
export type Theme = 'individuals' | 'corporate';

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