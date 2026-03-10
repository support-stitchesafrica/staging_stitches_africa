import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

export interface Address {
  id?: string;
  userId?: string;
  first_name: string;
  last_name: string;
  street_address: string;
  city: string;
  state: string;
  post_code: string;
  country: string;
  country_code: string;
  phone_number: string;
  dial_code: string;
  flat_number?: string;
  is_default: boolean;
  type?: 'home' | 'work' | 'other';
  createdAt?: Date;
  updatedAt?: Date;
  // Legacy field names for backward compatibility
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  postcode?: string;
  countryCode?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export class AddressService {
  private static readonly ROOT_COLLECTION = 'users_addresses';
  private static readonly SUB_COLLECTION = 'user_addresses';

  private static async getUserAddressesCollection(userId: string) {
    const db = await getFirebaseDb();
    return collection(db, this.ROOT_COLLECTION, userId, this.SUB_COLLECTION);
  }

  static async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      const addressesCollection = await this.getUserAddressesCollection(userId);
      const q = query(addressesCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
      })) as Address[];
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      throw new Error('Failed to fetch addresses');
    }
  }

  static async getDefaultAddress(userId: string): Promise<Address | null> {
    try {
      const addresses = await this.getUserAddresses(userId);
      return (
        addresses.find((addr) => addr.is_default || addr.isDefault) ||
        addresses[0] ||
        null
      );
    } catch (error) {
      console.error('Error fetching default address:', error);
      return null;
    }
  }

  static async saveAddress(
    address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      if (!address.userId) throw new Error('userId is required');

      const now = new Date();
      const addressData = {
        ...address,
        createdAt: now,
        updatedAt: now,
      };

      // If this is set as default, unset other default addresses
      if (address.is_default || address.isDefault) {
        await this.unsetDefaultAddresses(address.userId);
      }

      // If this is the first address for the user, make it default
      const existingAddresses = await this.getUserAddresses(address.userId);
      if (existingAddresses.length === 0) {
        addressData.is_default = true;
      }

      const addressesCollection = await this.getUserAddressesCollection(address.userId);
      const docRef = doc(addressesCollection);
      await setDoc(docRef, addressData);

      return docRef.id;
    } catch (error) {
      console.error('Error saving address:', error);
      throw new Error('Failed to save address');
    }
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    updates: Partial<Address>
  ): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const addressRef = doc(db, this.ROOT_COLLECTION, userId, this.SUB_COLLECTION, addressId);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      // If setting as default, unset others
      if ((updates.is_default || updates.isDefault) && userId) {
        await this.unsetDefaultAddresses(userId);
      }

      await setDoc(addressRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('Failed to update address');
    }
  }

  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const addressRef = doc(db, this.ROOT_COLLECTION, userId, this.SUB_COLLECTION, addressId);
      await deleteDoc(addressRef);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw new Error('Failed to delete address');
    }
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      await this.unsetDefaultAddresses(userId);
      await this.updateAddress(userId, addressId, { is_default: true });
    } catch (error) {
      console.error('Error setting default address:', error);
      throw new Error('Failed to set default address');
    }
  }

  private static async unsetDefaultAddresses(userId: string): Promise<void> {
    try {
      const addresses = await this.getUserAddresses(userId);
      const defaultAddresses = addresses.filter(
        (addr) => addr.is_default || addr.isDefault
      );

      for (const address of defaultAddresses) {
        if (address.id) {
          const db = await getFirebaseDb();
          const addressRef = doc(db, this.ROOT_COLLECTION, userId, this.SUB_COLLECTION, address.id);
          await setDoc(
            addressRef,
            { is_default: false, updatedAt: new Date() },
            { merge: true }
          );
        }
      }
    } catch (error) {
      console.error('Error unsetting default addresses:', error);
      throw error;
    }
  }

  static validateAddress(address: Partial<Address>): string[] {
    const errors: string[] = [];

    const firstName = address.first_name || address.firstName;
    const lastName = address.last_name || address.lastName;
    const streetAddress = address.street_address || address.streetAddress;
    const postCode = address.post_code || address.postcode;
    const phoneNumber = address.phone_number || address.phoneNumber;

    if (!firstName?.trim()) errors.push('First name is required');
    if (!lastName?.trim()) errors.push('Last name is required');
    if (!streetAddress?.trim()) errors.push('Street address is required');
    if (!address.city?.trim()) errors.push('City is required');
    if (!address.state?.trim()) errors.push('State is required');
    if (!postCode?.trim()) errors.push('Postal code is required');
    if (!address.country?.trim()) errors.push('Country is required');
    if (!phoneNumber?.trim()) errors.push('Phone number is required');
    if (phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(phoneNumber))
      errors.push('Please enter a valid phone number');

    return errors;
  }

  static formatAddressForDisplay(address: Address): string {
    const firstName = address.first_name || address.firstName || '';
    const lastName = address.last_name || address.lastName || '';
    const streetAddress = address.street_address || address.streetAddress || '';
    const postCode = address.post_code || address.postcode || '';
    const flatNumber = address.flat_number ? `${address.flat_number}, ` : '';

    return `${firstName} ${lastName}\n${flatNumber}${streetAddress}\n${address.city}, ${address.state} ${postCode}\n${address.country}`;
  }

  static formatAddressOneLine(address: Address): string {
    const streetAddress = address.street_address || address.streetAddress || '';
    const postCode = address.post_code || address.postcode || '';
    const flatNumber = address.flat_number ? `${address.flat_number}, ` : '';

    return `${flatNumber}${streetAddress}, ${address.city}, ${address.state} ${postCode}, ${address.country}`;
  }
}
