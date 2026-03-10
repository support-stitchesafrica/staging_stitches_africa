/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TerminalAfricaRate {
  rate_id: string;
  parcel_id: string;
  delivery_address_id: string;
  pickup_address_id: string;
  shipment_id: string | null;
  amount: number;
  delivery_date?: string;
  courier_name?: string;
  currency?: string;
}

export class TerminalAfricaService {
  /**
   * Helper to load Firebase functions
   */
  private static async getCallable(functionName: string) {
    const { loadFirebaseModule } = await import('../utils/module-helpers');
    const functionsModule = await loadFirebaseModule('firebase/functions', 'terminal_africa');
    
    // Direct import for local module to bypass list of supported modules in helper
    const firebaseModule = await import('../firebase');
    const functions = await firebaseModule.getFirebaseFunctions();
    
    if (!functions) {
      throw new Error(`Firebase Functions service is not available. Cannot call ${functionName}.`);
    }
    
    return functionsModule.httpsCallable(functions, functionName);
  }

  /**
   * Create packaging
   */
  static async createPackaging(params: {
    height: number;
    length: number;
    width: number;
    weight: number;
    isLive?: boolean;
  }) {
    try {
      const callable = await this.getCallable('createPackaging');
      const result = await callable(params);
      return result.data as any;
    } catch (error) {
      console.error('Error creating packaging:', error);
      throw new Error('Failed to create packaging');
    }
  }

  /**
   * Create Pickup Address
   */
  static async createPickupAddress(isLive = false) {
    try {
      const callable = await this.getCallable('createPickupAddress');
      const result = await callable({ isLive });
      return result.data as any;
    } catch (error) {
      console.error('Error creating pickup address:', error);
      throw new Error('Failed to create pickup address');
    }
  }

  /**
   * Create Delivery Address
   */
  static async createDeliveryAddress(params: {
    city: string;
    countryCode: string;
    email: string;
    isResidential: boolean;
    firstName: string;
    lastName: string;
    line1: string;
    phone: string;
    dialCode?: string; // Added dialCode
    state: string;
    postalCode: string;
    isLive?: boolean;
  }) {
    try {
      const callable = await this.getCallable('createAddress');
      const formattedPhone = TerminalAfricaService.formatPhoneNumber(params.phone, params.countryCode, params.dialCode);
      
      const result = await callable({
        ...params,
        phone: formattedPhone,
        addressType: 'delivery',
      });
      return result.data as any;
    } catch (error) {
      // console.error('Error creating delivery address:', error); 
      // Supressing error log to avoid noise, error is rethrown
      throw new Error('Failed to create delivery address');
    }
  }

  /**
   * Format phone number to international format using dial code if available
   */
  private static formatPhoneNumber(phone: string, countryCode: string, dialCode?: string): string {
    // Remove all non-numeric characters except +
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // If we have a dial code, use it to construct the number
    if (dialCode) {
      // Remove leading + from dial code for processing
      const cleanDialCode = dialCode.replace('+', '');
      
      // Remove leading 0 from phone number
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      
      // If the phone already starts with the dial code (e.g. 234...), don't add it again
      if (cleanPhone.startsWith(cleanDialCode)) {
        return '+' + cleanPhone;
      }
      
      return '+' + cleanDialCode + cleanPhone;
    }

    // Fallback to previous logic if no dialCode provided
    
    // If it already starts with +, assume it's correct
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }

    // Handle Nigeria specifically
    if (countryCode === 'NG') {
      // Handle cases where dial code + 0 lead (e.g., +234080...)
      if (cleanPhone.startsWith('2340')) {
        return '+' + cleanPhone.substring(0, 3) + cleanPhone.substring(4);
      }

      // If it starts with 234, add +
      if (cleanPhone.startsWith('234')) {
        return '+' + cleanPhone;
      }

      // Remove leading 0 if present
      if (cleanPhone.startsWith('0')) {
        return '+234' + cleanPhone.substring(1);
      }
      
      return '+234' + cleanPhone;
    }

    return '+' + cleanPhone.replace(/^\+/, ''); 
  }

  /**
   * Create Parcel
   */
  static async createParcel(params: {
    description: string;
    packagingId: string;
    items: Array<{
      name: string;
      description: string;
      currency: string;
      value: number;
      quantity: number;
      weight: number;
    }>;
    isLive?: boolean;
  }) {
    try {
      const callable = await this.getCallable('createParcel');
      const result = await callable(params);
      return result.data as any;
    } catch (error) {
      console.error('Error creating parcel:', error);
      throw new Error('Failed to create parcel');
    }
  }

  /**
   * Get Rates
   */
  static async getRates(params: {
    pickUpAddressId: string;
    deliveryAddressId: string;
    parcelId: string;
    cashOnDelivery: boolean;
    isLive?: boolean;
  }) {
    try {
      const callable = await this.getCallable('getRates');
      const result = await callable(params);
      return result.data as any;
    } catch (error) {
      console.error('Error get rates:', error);
      throw new Error('Failed to get shipping rates');
    }
  }
}
