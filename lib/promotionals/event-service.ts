import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { PromotionalEvent, PromotionalEventStatus, ProductDiscount } from "./types";
import { toDate } from "@/lib/utils/timestamp-helpers";

/**
 * Data for creating a new promotional event
 */
export interface CreateEventData {
  name: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

/**
 * Promotional Event Service
 * 
 * Handles CRUD operations for promotional events in Firestore.
 * 
 * @module PromotionalEventService
 */
export class PromotionalEventService {
  /**
   * Creates a new promotional event
   * @param data - Event creation data
   * @returns Created event with ID
   */
  static async createEvent(data: CreateEventData): Promise<PromotionalEvent> {
    try {
      // Validate inputs
      if (!data.name || !data.startDate || !data.endDate || !data.createdBy) {
        throw new Error("Name, start date, end date, and creator are required");
      }

      // Validate dates
      if (data.endDate <= data.startDate) {
        throw new Error("End date must be after start date");
      }

      const now = Timestamp.now();
      const eventRef = doc(collection(db, "promotionalEvents"));
      
      // Determine initial status based on dates
      const status = this.calculateEventStatus(data.startDate, data.endDate);

      const eventData: PromotionalEvent = {
        id: eventRef.id,
        name: data.name.trim(),
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        status,
        isPublished: false,
        products: [],
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(eventRef, eventData);

      return eventData;
    } catch (error: any) {
      console.error("Error creating promotional event:", error);
      throw new Error(error.message || "Failed to create promotional event");
    }
  }

  /**
   * Retrieves a promotional event by ID
   * @param eventId - Event ID
   * @returns Event data or null if not found
   */
  static async getEventById(eventId: string): Promise<PromotionalEvent | null> {
    try {
      if (!eventId) {
        return null;
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        return null;
      }

      return {
        id: eventDoc.id,
        ...eventDoc.data()
      } as PromotionalEvent;
    } catch (error) {
      console.error("Error fetching promotional event:", error);
      return null;
    }
  }

  /**
   * Retrieves all promotional events for a specific user
   * @param userId - User ID
   * @returns Array of events
   */
  static async getUserEvents(userId: string): Promise<PromotionalEvent[]> {
    try {
      if (!userId) {
        return [];
      }

      const eventsRef = collection(db, "promotionalEvents");
      const q = query(
        eventsRef,
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const events: PromotionalEvent[] = [];

      querySnapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        } as PromotionalEvent);
      });

      return events;
    } catch (error) {
      console.error("Error fetching user events:", error);
      return [];
    }
  }

  /**
   * Retrieves all active promotional events (published and within date range)
   * @returns Array of active events
   */
  static async getActiveEvents(): Promise<PromotionalEvent[]> {
    try {
      const eventsRef = collection(db, "promotionalEvents");
      const now = Timestamp.now();

      const q = query(
        eventsRef,
        where("isPublished", "==", true),
        where("startDate", "<=", now),
        where("endDate", ">=", now),
        orderBy("startDate", "desc")
      );

      const querySnapshot = await getDocs(q);
      const events: PromotionalEvent[] = [];

      querySnapshot.forEach((doc) => {
        const event = {
          id: doc.id,
          ...doc.data()
        } as PromotionalEvent;
        // Double-check status
        if (event.status === "active") {
          events.push(event);
        }
      });

      return events;
    } catch (error) {
      console.error("Error fetching active events:", error);
      return [];
    }
  }

  /**
   * Updates a promotional event
   * @param eventId - Event ID
   * @param updates - Partial event data to update
   */
  static async updateEvent(
    eventId: string,
    updates: Partial<PromotionalEvent>
  ): Promise<void> {
    try {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      // Validate dates if being updated
      if (updates.startDate || updates.endDate) {
        const currentEvent = eventDoc.data() as PromotionalEvent;
        const startDate = updates.startDate || currentEvent.startDate;
        const endDate = updates.endDate || currentEvent.endDate;

        const startDateObj = startDate instanceof Timestamp ? startDate.toDate() : startDate;
        const endDateObj = endDate instanceof Timestamp ? endDate.toDate() : endDate;

        if (endDateObj <= startDateObj) {
          throw new Error("End date must be after start date");
        }

        // Update status if dates changed
        updates.status = this.calculateEventStatus(startDateObj, endDateObj);
      }

      // Add updatedAt timestamp
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(eventRef, updateData);
    } catch (error: any) {
      console.error("Error updating promotional event:", error);
      throw new Error(error.message || "Failed to update promotional event");
    }
  }

  /**
   * Deletes a promotional event
   * @param eventId - Event ID
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      await deleteDoc(eventRef);
    } catch (error: any) {
      console.error("Error deleting promotional event:", error);
      throw new Error(error.message || "Failed to delete promotional event");
    }
  }

  /**
   * Publishes a promotional event
   * @param eventId - Event ID
   */
  static async publishEvent(eventId: string): Promise<void> {
    try {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data() as PromotionalEvent;

      // Validate event has products
      if (!event.products || event.products.length === 0) {
        throw new Error("Cannot publish event without products");
      }

      // Validate event has banner
      if (!event.banner || !event.banner.imageUrl) {
        throw new Error("Cannot publish event without banner");
      }

      await updateDoc(eventRef, {
        isPublished: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error("Error publishing promotional event:", error);
      throw new Error(error.message || "Failed to publish promotional event");
    }
  }

  /**
   * Unpublishes a promotional event
   * @param eventId - Event ID
   */
  static async unpublishEvent(eventId: string): Promise<void> {
    try {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      await updateDoc(eventRef, {
        isPublished: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error("Error unpublishing promotional event:", error);
      throw new Error(error.message || "Failed to unpublish promotional event");
    }
  }

  /**
   * Updates event status based on current date and event dates
   * @param eventId - Event ID
   */
  static async updateEventStatus(eventId: string): Promise<void> {
    try {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data() as PromotionalEvent;
      const startDate = toDate(event.startDate);
      const endDate = toDate(event.endDate);
      const newStatus = this.calculateEventStatus(startDate, endDate);

      // Only update if status changed
      if (newStatus !== event.status) {
        await updateDoc(eventRef, {
          status: newStatus,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error: any) {
      console.error("Error updating event status:", error);
      throw new Error(error.message || "Failed to update event status");
    }
  }

  /**
   * Calculates event status based on dates
   * @param startDate - Event start date
   * @param endDate - Event end date
   * @returns Event status
   */
  private static calculateEventStatus(
    startDate: Date,
    endDate: Date
  ): PromotionalEventStatus {
    const now = new Date();

    if (now < startDate) {
      return "scheduled";
    } else if (now >= startDate && now <= endDate) {
      return "active";
    } else {
      return "expired";
    }
  }

  /**
   * Adds products to a promotional event
   * @param eventId - Event ID
   * @param products - Array of products with discounts
   */
  static async addProductsToEvent(
    eventId: string,
    products: ProductDiscount[]
  ): Promise<void> {
    try {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      if (!products || products.length === 0) {
        throw new Error("At least one product is required");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      // Validate all products before saving
      products.forEach((p) => {
        if (p.discountPercentage < 1 || p.discountPercentage > 100) {
          throw new Error(`Invalid discount percentage for product ${p.productId}: must be between 1 and 100`);
        }
      });

      // Replace entire products array (don't merge with existing)
      // This allows products to be removed when they're not in the new selection
      const updatedProducts = products.map(p => ({
        ...p,
        addedAt: p.addedAt || Timestamp.now(),
      }));

      await updateDoc(eventRef, {
        products: updatedProducts,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error("Error adding products to event:", error);
      throw new Error(error.message || "Failed to add products to event");
    }
  }

  /**
   * Removes a product from a promotional event
   * @param eventId - Event ID
   * @param productId - Product ID to remove
   */
  static async removeProductFromEvent(
    eventId: string,
    productId: string
  ): Promise<void> {
    try {
      if (!eventId || !productId) {
        throw new Error("Event ID and Product ID are required");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data() as PromotionalEvent;
      const updatedProducts = (event.products || []).filter(
        (p) => p.productId !== productId
      );

      await updateDoc(eventRef, {
        products: updatedProducts,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error("Error removing product from event:", error);
      throw new Error(error.message || "Failed to remove product from event");
    }
  }

  /**
   * Updates discount percentage for a product in an event
   * @param eventId - Event ID
   * @param productId - Product ID
   * @param discountPercentage - New discount percentage (1-100)
   */
  static async updateProductDiscount(
    eventId: string,
    productId: string,
    discountPercentage: number
  ): Promise<void> {
    try {
      if (!eventId || !productId) {
        throw new Error("Event ID and Product ID are required");
      }

      if (discountPercentage < 1 || discountPercentage > 100) {
        throw new Error("Discount percentage must be between 1 and 100");
      }

      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data() as PromotionalEvent;
      const products = event.products || [];
      
      const productIndex = products.findIndex((p) => p.productId === productId);
      
      if (productIndex === -1) {
        throw new Error("Product not found in event");
      }

      // Update the discount and recalculate discounted price
      const product = products[productIndex];
      const discountedPrice = product.originalPrice * (1 - discountPercentage / 100);
      
      products[productIndex] = {
        ...product,
        discountPercentage,
        discountedPrice,
      };

      await updateDoc(eventRef, {
        products,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error("Error updating product discount:", error);
      throw new Error(error.message || "Failed to update product discount");
    }
  }

  /**
   * Gets all products for a promotional event
   * @param eventId - Event ID
   * @returns Array of products with discounts
   */
  static async getEventProducts(eventId: string): Promise<ProductDiscount[]> {
    try {
      const event = await this.getEventById(eventId);
      
      if (!event) {
        return [];
      }

      return event.products || [];
    } catch (error) {
      console.error("Error fetching event products:", error);
      return [];
    }
  }
}
