import { UserOrder } from '@/types';

/**
 * Safely access order data with fallbacks for missing or invalid data
 */
export class OrderDataValidator {
  /**
   * Validates and sanitizes order data
   */
  static validateOrder(order: any): UserOrder | null {
    if (!order || typeof order !== 'object') {
      return null;
    }

    // Required fields validation
    const requiredFields = ['order_id', 'user_id', 'title', 'price', 'quantity'];
    for (const field of requiredFields) {
      if (!order[field]) {
        console.warn(`Order missing required field: ${field}`, order);
        return null;
      }
    }

    // Sanitize and provide defaults for optional fields
    return {
      id: order.id || order.order_id,
      order_id: order.order_id,
      product_order_ref: order.product_order_ref || order.order_id,
      user_id: order.user_id,
      product_id: order.product_id || '',
      title: order.title,
      description: order.description || '',
      images: Array.isArray(order.images) ? order.images : [],
      price: Number(order.price) || 0,
      quantity: Number(order.quantity) || 1,
      size: order.size || undefined,
      wear_category: order.wear_category || undefined,
      tailor_id: order.tailor_id || '',
      tailor_name: order.tailor_name || undefined,
      delivery_type: order.delivery_type || 'standard',
      delivery_date: order.delivery_date || undefined,
      order_status: order.order_status || 'pending',
      shipping_fee: Number(order.shipping_fee) || 0,
      wallet_amount_moved: order.wallet_amount_moved || undefined,
      wallet_processed: Boolean(order.wallet_processed),
      wallet_processed_at: order.wallet_processed_at || undefined,
      shipping: order.shipping || {
        carrier: 'Unknown',
        createdAt: new Date(),
      },
      pickup: order.pickup || undefined,
      timeline: Array.isArray(order.timeline) ? order.timeline : [],
      dhl_events_snapshot: Array.isArray(order.dhl_events_snapshot) ? order.dhl_events_snapshot : [],
      last_dhl_event: order.last_dhl_event || undefined,
      documents: Array.isArray(order.documents) ? order.documents : [],
      packages: Array.isArray(order.packages) ? order.packages : [],
      user_address: this.validateUserAddress(order.user_address),
      createdAt: this.parseDate(order.createdAt) || new Date(),
      last_update: this.parseDate(order.last_update) || undefined,
      timestamp: this.parseDate(order.timestamp) || new Date(),
    };
  }

  /**
   * Validates user address data
   */
  private static validateUserAddress(address: any): UserOrder['user_address'] {
    if (!address || typeof address !== 'object') {
      return {
        first_name: 'Unknown',
        last_name: 'User',
        street_address: 'Address not available',
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        country_code: 'XX',
        dial_code: '+1',
        phone_number: 'Not provided',
        post_code: undefined,
      };
    }

    return {
      first_name: address.first_name || 'Unknown',
      last_name: address.last_name || 'User',
      street_address: address.street_address || 'Address not available',
      city: address.city || 'Unknown',
      state: address.state || 'Unknown',
      country: address.country || 'Unknown',
      country_code: address.country_code || 'XX',
      dial_code: address.dial_code || '+1',
      phone_number: address.phone_number || 'Not provided',
      post_code: address.post_code || undefined,
    };
  }

  /**
   * Safely parse date from various formats
   */
  private static parseDate(dateValue: any): Date | undefined {
    if (!dateValue) return undefined;

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }

    // Handle Firestore timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      try {
        return dateValue.toDate();
      } catch {
        return undefined;
      }
    }

    // Handle timestamp objects
    if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
      try {
        return new Date(dateValue.seconds * 1000);
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Validates array of orders and filters out invalid ones
   */
  static validateOrders(orders: any[]): UserOrder[] {
    if (!Array.isArray(orders)) {
      return [];
    }

    return orders
      .map(order => this.validateOrder(order))
      .filter((order): order is UserOrder => order !== null);
  }

  /**
   * Safely get order status with fallback
   */
  static getOrderStatus(order: UserOrder): string {
    const validStatuses = ['pending', 'processing', 'production', 'shipped', 'delivered', 'cancelled', 'refunded'];
    return validStatuses.includes(order.order_status) ? order.order_status : 'pending';
  }

  /**
   * Safely get order total with fallback
   */
  static getOrderTotal(order: UserOrder): number {
    const price = Number(order.price) || 0;
    const quantity = Number(order.quantity) || 1;
    const shippingFee = Number(order.shipping_fee) || 0;
    return (price * quantity) + shippingFee;
  }

  /**
   * Check if order has tracking information
   */
  static hasTrackingInfo(order: UserOrder): boolean {
    return Array.isArray(order.packages) && order.packages.length > 0;
  }

  /**
   * Get formatted tracking events with fallbacks
   */
  static getTrackingEvents(order: UserOrder) {
    // Use timeline if available
    if (Array.isArray(order.timeline) && order.timeline.length > 0) {
      return order.timeline
        .filter(event => event && event.status && event.occurredAt)
        .sort((a, b) => 
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        );
    }
    
    // Fallback to basic status-based timeline
    const basicEvents = [];
    
    if (order.createdAt) {
      basicEvents.push({
        status: 'Order Placed',
        description: 'Your order has been received and is being processed',
        occurredAt: order.createdAt.toString(),
        location: 'Online',
        actor: 'System'
      });
    }
    
    const status = this.getOrderStatus(order);
    
    if (status === 'processing') {
      basicEvents.push({
        status: 'Processing',
        description: 'Your order is being prepared',
        occurredAt: new Date().toISOString(),
        location: 'Fulfillment Center',
        actor: 'Warehouse'
      });
    }
    
    if (status === 'shipped' && this.hasTrackingInfo(order)) {
      const trackingNumber = order.packages?.[0]?.trackingNumber || 'N/A';
      basicEvents.push({
        status: 'Shipped',
        description: `Package shipped with tracking number ${trackingNumber}`,
        occurredAt: new Date().toISOString(),
        location: 'Shipping Facility',
        actor: 'Carrier'
      });
    }
    
    if (status === 'delivered') {
      basicEvents.push({
        status: 'Delivered',
        description: 'Package has been delivered',
        occurredAt: order.last_update?.toString() || new Date().toISOString(),
        location: order.user_address.city,
        actor: 'Carrier'
      });
    }
    
    return basicEvents.reverse();
  }

  /**
   * Safely format date with fallback
   */
  static formatDate(date: Date | string | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return 'Date not available';

    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Invalid date';

      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
      });
    } catch {
      return 'Date not available';
    }
  }

  /**
   * Get delivery information with fallbacks
   */
  static getDeliveryInfo(order: UserOrder): string | null {
    if (order.delivery_date) {
      return `Expected: ${this.formatDate(order.delivery_date)}`;
    }
    if (order.order_status === 'delivered' && order.last_update) {
      return `Delivered: ${this.formatDate(order.last_update)}`;
    }
    return null;
  }
}

/**
 * Format date for display
 */
export const formatDate = (date: Date | string | undefined): string => {
  return OrderDataValidator.formatDate(date);
};

/**
 * Format time from HH:MM:SS format
 */
export const formatTime = (time: string): string => {
  if (!time) return 'Time not available';
  
  try {
    // Handle HH:MM:SS format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    if (isNaN(hour) || isNaN(minute)) return time;
    
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return time;
  }
};

/**
 * Get order status color classes
 */
export const getOrderStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    production: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  
  return statusColors[status] || statusColors.pending;
};

/**
 * Get human-readable order status text
 */
export const getOrderStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    production: 'In Production',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  
  return statusTexts[status] || 'Unknown';
};

/**
 * Get tracking status icon type based on DHL type code
 */
export const getTrackingStatusIconType = (typeCode: string): string => {
  switch (typeCode) {
    case 'PU': // Picked up
      return 'package';
    case 'WC': // With courier
    case 'OC': // On courier
      return 'truck';
    case 'OK': // Delivered
      return 'check-circle';
    case 'OH': // On hold
    case 'BA': // Bad address
      return 'alert-circle';
    default:
      return 'clock';
  }
};

/**
 * Get tracking status color based on DHL type code
 */
export const getTrackingStatusColor = (typeCode: string): string => {
  const statusColors: Record<string, string> = {
    PU: 'bg-blue-100 text-blue-600', // Picked up
    WC: 'bg-indigo-100 text-indigo-600', // With courier
    OC: 'bg-indigo-100 text-indigo-600', // On courier
    OK: 'bg-green-100 text-green-600', // Delivered
    OH: 'bg-yellow-100 text-yellow-600', // On hold
    BA: 'bg-red-100 text-red-600', // Bad address
  };
  
  return statusColors[typeCode] || 'bg-gray-100 text-gray-600';
};