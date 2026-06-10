/**
 * Types for the public DHL Order Tracker feature.
 * These types define the sanitised, PII-free data structures
 * used by the /api/track-order route and the TrackOrderPage component.
 */

export interface TrackingEvent {
  occurredAt: string;       // ISO datetime string
  typeCode: string | null;
  status: string;
  description: string;
  location: string;
}

export interface SanitisedResponse {
  orderId: string;
  trackingNumber: string | null;
  carrier: string;
  status: string;
  events: TrackingEvent[];
  estimatedDelivery: string | null;
  lastUpdated: string | null;
  /**
   * Internal-only: Firestore document path used by the client
   * to subscribe to onSnapshot for real-time updates.
   * Not displayed to the user.
   */
  _docPath?: string;
}

export type SearchMode = 'orderId' | 'trackingNumber';
