/* eslint-disable @typescript-eslint/no-explicit-any */
// Firestore data access layer with repository pattern with HMR compatibility
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  DocumentData,
  QueryConstraint,
  setDoc,
  collectionGroup
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { Product, User, Order, UserOrder, CartItem, WishlistItem, UserAddress, Tailor, UserProfile, UserStatus, FreeGiftClaim } from '@/types';
import { ProductCollection } from '@/types/collections';
import { adaptProductData, adaptProductsArray, adaptTailorData, adaptTailorsArray } from './dataAdapter';
import { serverCacheManager as cacheManager, cacheKeys, withCache } from './utils/server-cache-utils';

// Utility function to remove undefined values from objects before saving to Firestore
function cleanUndefinedValues<T extends Record<string, any>>(obj: T): T {
  const cleaned = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key as keyof T] = value;
    }
  }
  return cleaned;
}

// Deep clean function to recursively remove undefined values from nested objects
function deepCleanUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepCleanUndefinedValues(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = deepCleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Generic repository class
class Repository<T> {
  constructor(private collectionName: string) { }

  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const db = await getFirebaseDb();
      const docRef = await addDoc(collection(db, this.collectionName), data);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw new Error(`Failed to create ${this.collectionName}`);
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        // Apply data adapter for products and tailors
        if (this.collectionName === 'staging_tailor_works') {
          return adaptProductData(data) as T;
        }
        if (this.collectionName === 'staging_tailors') {
          return adaptTailorData(data) as T;
        }
        return data as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting ${this.collectionName}:`, error);
      throw new Error(`Failed to get ${this.collectionName}`);
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, cleanUndefinedValues(data as Record<string, any>) as DocumentData);
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw new Error(`Failed to update ${this.collectionName}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw new Error(`Failed to delete ${this.collectionName}`);
    }
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const db = await getFirebaseDb();
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply data adapter for products and tailors
      if (this.collectionName === 'staging_tailor_works') {
        return adaptProductsArray(results) as T[];
      }
      if (this.collectionName === 'staging_tailors') {
        return adaptTailorsArray(results) as T[];
      }

      return results as T[];
    } catch (error: any) {
      console.error(`Error getting all ${this.collectionName}:`, error);
      // Preserve original error message for better debugging
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'unknown';
      throw new Error(`Failed to get ${this.collectionName} list: ${errorMessage} (${errorCode})`);
    }
  }
}

// Product repository with caching
export class ProductRepository extends Repository<Product> {
  constructor() {
    super("staging_tailor_works"); // Using your existing collection name
  }

  // Override getById with caching
  async getById(id: string): Promise<Product | null> {
    const cacheKey = cacheKeys.product(id);
    const cached = cacheManager.get<Product>(cacheKey);
    if (cached) return cached;

    const result = await super.getById(id);
    if (result) {
      cacheManager.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes
    }
    return result;
  }

  // Override getAll to filter products with images and in-stock items for shops
  async getAll(constraints: QueryConstraint[] = []): Promise<Product[]> {
    const products = await super.getAll(constraints);
    const productsWithImages = this.filterProductsWithImages(products);
    return this.filterInStockProducts(productsWithImages);
  }

  // Cached method for getting products by category
  getByCategory = withCache(
    async (category: string): Promise<Product[]> => {

      return this.getAll([where("category", "==", category)]);
    },
    (category: string) => `products:category:${category}`,
    5 * 60 * 1000 // 5 minutes cache
  );

  async getByType(type: "bespoke" | "ready-to-wear"): Promise<Product[]> {
    return this.getAll([where("type", "==", type)]);
  }

  async getByVendor(vendorId: string): Promise<Product[]> {
    return this.getAll([where("tailor_id", "==", vendorId)]);
  }

  async getByTailorId(tailorId: string): Promise<Product[]> {
    return this.getAll([where("tailor_id", "==", tailorId)]);
  }

  // Cached method for discounted products
  getDiscountedProducts = withCache(
    async (): Promise<Product[]> => {

      return this.getAll([where("discount", ">", 0), orderBy("discount", "desc")]);
    },
    () => 'products:discounted',
    10 * 60 * 1000 // 10 minutes cache
  );

  // Cached method for new arrivals
  getNewArrivals = withCache(
    async (daysBack: number = 30): Promise<Product[]> => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Try created_at first, fall back to createdAt (ISO string)
      try {
        const results = await this.getAll([
          where("created_at", ">=", cutoffDate),
          orderBy("created_at", "desc"),
          limit(20),
        ]);
        if (results.length > 0) return results;
      } catch (_) {
        // field may not exist or no index — fall through
      }

      // Fallback: fetch recent verified products ordered by createdAt string
      return this.getAll([
        where("status", "==", "verified"),
        orderBy("createdAt", "desc"),
        limit(20),
      ]);
    },
    (daysBack: number = 30) => `products:new-arrivals:${daysBack}`,
    5 * 60 * 1000 // 5 minutes cache
  );

  async searchProducts(searchTerm: string): Promise<Product[]> {
    // Note: Firestore doesn't support full-text search natively
    // Consider integrating Algolia or Meilisearch for production
    return this.getAll([
      where("tags", "array-contains-any", searchTerm.toLowerCase().split(" ")),
    ]);
  }

  private filterProductsWithImages(products: Product[]): Product[] {
    // Filter out products that don't have at least one image
    return products.filter((product) => {
      const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0;
      return hasImages;
    });
  }

  private filterInStockProducts(products: Product[]): Product[] {
    // Filter out products that are out of stock
    return products.filter((product) => {
      if (!product.availability) return true;
      const availability = product.availability.toLowerCase();
      return availability !== 'out_of_stock' && availability !== 'out of stock';
    });
  }

  // Additional methods needed for storefront templates
  async getAllProductsWithTailorInfo(limitCount: number = 50): Promise<Product[]> {
    try {
      return this.getAll([
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      ]);
    } catch (error) {
      console.error('Error getting all products:', error);
      throw new Error('Failed to get all products');
    }
  }



  async getFeaturedProducts(limitCount: number = 10): Promise<Product[]> {
    try {
      // First try to get products with featured flag
      const allProducts = await this.getAll([
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc'),
        limit(50) // Get more products to filter from
      ]);
      
      // Filter for featured products
      const featuredProducts = allProducts.filter(product => product.featured === true);
      
      // If we have featured products, return them
      if (featuredProducts.length > 0) {
        return featuredProducts.slice(0, limitCount);
      }
      
      // Fallback to regular products if no featured products exist
      return allProducts.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting featured products:', error);
      // Fallback to regular products if featured field doesn't exist
      return this.getAllProductsWithTailorInfo(limitCount);
    }
  }

  // Alias for existing method
  async getByVendorId(vendorId: string): Promise<Product[]> {
    return this.getByVendor(vendorId);
  }

  private async enrichProductsWithTailorInfo(products: Product[]): Promise<Product[]> {
    const tailors = await tailorRepository.getAll();
    const tailorMap = new Map(tailors.map((tailor) => [tailor.id, tailor]));

    // Return an enriched product list with safe type handling
    return products.map((product) => {
      const tailor = tailorMap.get(product.tailor_id);
      if (tailor) {
        return {
          ...product,
          vendor: {
            id: tailor.id,
            name:
              tailor.brandName ||
              `${tailor.first_name ?? ""} ${tailor.last_name ?? ""}`.trim() ||
              product.vendor?.name ||
              product.tailor ||
              "Unknown Brand",
            logo: tailor.brand_logo || product.vendor?.logo,
            email: tailor.email || product.vendor?.email,
            phone: tailor.phoneNumber || product.vendor?.phone,
            location: tailor.country || product.vendor?.location,
          },
        } as Product;
      }

      // Ensure all products return a vendor object (not undefined)
      // Use the product's tailor field if available, otherwise fallback to Unknown Brand
      return {
        ...product,
        vendor: product.vendor ?? {
          id: product.tailor_id,
          name: product.tailor || "Unknown Brand",
        },
      } as Product;
    });
  }

  async getAllWithTailorInfo(): Promise<Product[]> {
    const products = await this.getAll();
    const productsWithImages = this.filterProductsWithImages(products);
    const inStockProducts = this.filterInStockProducts(productsWithImages);
    return this.enrichProductsWithTailorInfo(inStockProducts);
  }

  async getDiscountedProductsWithTailorInfo(): Promise<Product[]> {
    const products = await this.getDiscountedProducts();
    const productsWithImages = this.filterProductsWithImages(products);
    const inStockProducts = this.filterInStockProducts(productsWithImages);
    return this.enrichProductsWithTailorInfo(inStockProducts);
  }

  async getNewArrivalsWithTailorInfo(daysBack: number = 30): Promise<Product[]> {
    const products = await this.getNewArrivals(daysBack);
    const productsWithImages = this.filterProductsWithImages(products);
    const inStockProducts = this.filterInStockProducts(productsWithImages);
    return this.enrichProductsWithTailorInfo(inStockProducts);
  }

  async getByIdWithTailorInfo(id: string): Promise<Product | null> {
    const product = await this.getById(id);
    if (!product) return null;

    // Check if product has images
    const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0;
    if (!hasImages) return null;

    const enriched = await this.enrichProductsWithTailorInfo([product]);
    return enriched[0];
  }

  async getByTailorIdWithTailorInfo(tailorId: string): Promise<Product[]> {
    const products = await this.getByTailorId(tailorId);
    const productsWithImages = this.filterProductsWithImages(products);
    const inStockProducts = this.filterInStockProducts(productsWithImages);
    return this.enrichProductsWithTailorInfo(inStockProducts);
  }

  async getPaginatedProductsWithTailorInfo(
    limitCount: number = 20,
    lastDoc: any = null
  ): Promise<{ products: Product[]; lastDoc: any; totalCount: number }> {
    try {
      const db = await getFirebaseDb();
      const collectionRef = collection(db, "staging_tailor_works");

      // Get Total Count
      const countQuery = query(collectionRef, where('status', '==', 'verified'));
      const countSnapshot = await getCountFromServer(countQuery);
      const totalCount = countSnapshot.data().count;

      // Fetch significantly more products to ensure we get enough after filtering
      // Some pages may have many products without images or out of stock
      const fetchLimit = limitCount * 5; // Fetch 5x to ensure we get enough valid products

      // Data Query
      const constraints: QueryConstraint[] = [
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc'),
        limit(fetchLimit)
      ];

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { products: [], lastDoc: null, totalCount };
      }
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      // Process Data
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const adaptedProducts = adaptProductsArray(results);
      
      // Apply filters
      const productsWithImages = this.filterProductsWithImages(adaptedProducts);
      
      // Enrich with tailor info
      const enriched = await this.enrichProductsWithTailorInfo(productsWithImages);

      // Return only the requested number of products
      const productsToReturn = enriched.slice(0, limitCount);

      console.log(`Pagination: Fetched ${adaptedProducts.length}, after filters: ${enriched.length}, returning: ${productsToReturn.length}`);

      return {
        products: productsToReturn,
        lastDoc: lastVisible,
        totalCount
      };

    } catch (error) {
       console.error('Error getting paginated products:', error);
       throw new Error('Failed to get paginated products');
    }
  }

  // Get unique categories from products
  getCategories = withCache(
    async (): Promise<string[]> => {
      try {
        const products = await this.getAll([where('status', '==', 'verified')]);
        const categories = new Set<string>();
        
        products.forEach(product => {
          if (product.category && product.category.trim()) {
            categories.add(product.category.trim());
          }
        });
        
        return Array.from(categories).sort();
      } catch (error) {
        console.error('Error getting categories:', error);
        return [];
      }
    },
    () => 'products:categories',
    15 * 60 * 1000 // 15 minutes cache
  );

  // Get unique vendors/brands from products
  getVendors = withCache(
    async (): Promise<Array<{ id: string; name: string; logo?: string; productCount: number }>> => {
      try {
        const products = await this.getAllWithTailorInfo();
        const vendorMap = new Map<string, { id: string; name: string; logo?: string; productCount: number }>();
        
        products.forEach(product => {
          if (product.vendor && product.vendor.id) {
            const existing = vendorMap.get(product.vendor.id);
            if (existing) {
              existing.productCount++;
            } else {
              vendorMap.set(product.vendor.id, {
                id: product.vendor.id,
                name: product.vendor.name || 'Unknown Brand',
                logo: product.vendor.logo,
                productCount: 1
              });
            }
          }
        });
        
        return Array.from(vendorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error getting vendors:', error);
        return [];
      }
    },
    () => 'products:vendors',
    15 * 60 * 1000 // 15 minutes cache
  );

  // Get products by category with tailor info - Enhanced with flexible matching
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      // Get all verified products first, then filter by category
      const allProducts = await this.getAll([
        where('status', '==', 'verified')
      ]);
      
      // Enhanced category filtering with multiple criteria
      const categoryLower = category.toLowerCase();
      const categoryProducts = allProducts.filter(product => {
        // Direct category match
        if (product.category && product.category.toLowerCase() === categoryLower) {
          return true;
        }
        
        // Title-based matching for common keywords
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const tags = product.tags || [];
        
        // Category-specific keyword matching
        switch (categoryLower) {
          case 'bags':
            return title.includes('bag') || title.includes('purse') || title.includes('handbag') || 
                   title.includes('tote') || title.includes('clutch') || title.includes('backpack') ||
                   title.includes('crossbody') || title.includes('shoulder') || title.includes('messenger') ||
                   title.includes('wallet') || title.includes('satchel') || title.includes('hobo') ||
                   description.includes('bag') || description.includes('purse') ||
                   tags.some(tag => tag.toLowerCase().includes('bag') || tag.toLowerCase().includes('purse'));
                   
          case 'shoes':
            return title.includes('shoe') || title.includes('boot') || title.includes('sneaker') ||
                   title.includes('heel') || title.includes('flat') || title.includes('sandal') ||
                   title.includes('loafer') || title.includes('oxford') || title.includes('pump') ||
                   title.includes('slipper') || title.includes('moccasin') || title.includes('clog') ||
                   description.includes('shoe') || description.includes('footwear') ||
                   tags.some(tag => tag.toLowerCase().includes('shoe') || tag.toLowerCase().includes('footwear'));
                   
          case 'clothing':
            return title.includes('dress') || title.includes('shirt') || title.includes('pant') ||
                   title.includes('jacket') || title.includes('coat') || title.includes('top') ||
                   title.includes('blouse') || title.includes('skirt') || title.includes('suit') ||
                   title.includes('blazer') || title.includes('sweater') || title.includes('cardigan') ||
                   title.includes('hoodie') || title.includes('t-shirt') || title.includes('jeans') ||
                   title.includes('shorts') || title.includes('kaftan') || title.includes('kimono') ||
                   description.includes('clothing') || description.includes('apparel') ||
                   tags.some(tag => tag.toLowerCase().includes('clothing') || tag.toLowerCase().includes('apparel'));
                   
          case 'accessories':
            return title.includes('belt') || title.includes('scarf') || title.includes('hat') ||
                   title.includes('sunglasses') || title.includes('watch') || title.includes('tie') ||
                   title.includes('glove') || title.includes('cap') || title.includes('headband') ||
                   title.includes('bow tie') || title.includes('cufflink') || title.includes('pin') ||
                   title.includes('brooch') || title.includes('headwrap') ||
                   description.includes('accessory') || description.includes('accessories') ||
                   tags.some(tag => tag.toLowerCase().includes('accessory') || tag.toLowerCase().includes('accessories'));
                   
          case 'jewelry':
            return title.includes('necklace') || title.includes('earring') || title.includes('bracelet') ||
                   title.includes('ring') || title.includes('pendant') || title.includes('chain') ||
                   title.includes('anklet') || title.includes('brooch') || title.includes('jewelry') ||
                   title.includes('jewellery') || title.includes('bead') || title.includes('charm') ||
                   description.includes('jewelry') || description.includes('jewellery') ||
                   tags.some(tag => tag.toLowerCase().includes('jewelry') || tag.toLowerCase().includes('jewellery'));
                   
          default:
            // For other categories, use exact match or tag-based matching
            return tags.some(tag => tag.toLowerCase().includes(categoryLower));
        }
      });
      
      const productsWithImages = this.filterProductsWithImages(categoryProducts);
      const inStockProducts = this.filterInStockProducts(productsWithImages);
      return this.enrichProductsWithTailorInfo(inStockProducts);
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  // Get products by vendor with tailor info
  async getProductsByVendor(vendorId: string): Promise<Product[]> {
    try {
      const products = await this.getByTailorIdWithTailorInfo(vendorId);
      return products;
    } catch (error) {
      console.error('Error getting products by vendor:', error);
      return [];
    }
  }

  // Get products by discount range
  async getProductsByDiscountRange(minDiscount: number, maxDiscount?: number): Promise<Product[]> {
    try {
      const allDiscountedProducts = await this.getDiscountedProductsWithTailorInfo();
      
      return allDiscountedProducts.filter(product => {
        const discount = product.discount || 0;
        if (maxDiscount !== undefined) {
          return discount >= minDiscount && discount < maxDiscount;
        }
        return discount >= minDiscount;
      });
    } catch (error) {
      console.error('Error getting products by discount range:', error);
      return [];
    }
  }

  // Get sale statistics
  async getSaleStatistics(): Promise<{
    totalSaleItems: number;
    discountRanges: Record<string, number>;
    maxDiscount: number;
    avgDiscount: number;
  }> {
    try {
      const saleProducts = await this.getDiscountedProductsWithTailorInfo();
      
      const discountRanges = {
        '10-19': 0,
        '20-29': 0,
        '30-49': 0,
        '50-69': 0,
        '70+': 0
      };

      let totalDiscount = 0;
      let maxDiscount = 0;

      saleProducts.forEach(product => {
        const discount = product.discount || 0;
        totalDiscount += discount;
        maxDiscount = Math.max(maxDiscount, discount);

        if (discount >= 10 && discount < 20) discountRanges['10-19']++;
        else if (discount >= 20 && discount < 30) discountRanges['20-29']++;
        else if (discount >= 30 && discount < 50) discountRanges['30-49']++;
        else if (discount >= 50 && discount < 70) discountRanges['50-69']++;
        else if (discount >= 70) discountRanges['70+']++;
      });

      return {
        totalSaleItems: saleProducts.length,
        discountRanges,
        maxDiscount,
        avgDiscount: saleProducts.length > 0 ? totalDiscount / saleProducts.length : 0
      };
    } catch (error) {
      console.error('Error getting sale statistics:', error);
      return {
        totalSaleItems: 0,
        discountRanges: { '10-19': 0, '20-29': 0, '30-49': 0, '50-69': 0, '70+': 0 },
        maxDiscount: 0,
        avgDiscount: 0
      };
    }
  }
}

// User repository
export class UserRepository extends Repository<User> {
  constructor() {
    super('staging_users');
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.getAll([where('email', '==', email)]);
    return users.length > 0 ? users[0] : null;
  }

  async updateMeasurements(userId: string, measurements: Record<string, number>): Promise<void> {
    await this.update(userId, { measurements });
  }

  async addAddress(userId: string, address: any): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      const updatedAddresses = [...(user.addresses || []), address];
      await this.update(userId, { addresses: updatedAddresses });
    }
  }
}

// UserProfile repository for managing user onboarding and status
export class UserProfileRepository {
  private collectionName = 'staging_user_profiles';

  async createProfile(
    uid: string, 
    email: string, 
    displayName?: string | null, 
    photoURL?: string | null,
    registration_country?: string,
    registration_state?: string
  ): Promise<UserProfile> {
    try {
      const db = await getFirebaseDb();
      const now = new Date();
      const profile: UserProfile = {
        uid,
        email,
        ...(displayName && { displayName }),
        ...(photoURL && { photoURL }),
        ...(registration_country && { registration_country }),
        ...(registration_state && { registration_state }),
        createdAt: now,
        lastLoginAt: now,
        onboardingStatus: {
          measurementsCompleted: false,
          profileCompleted: false,
          firstLoginCompleted: false,
        },
        preferences: {
          skipMeasurements: false,
        },
        metadata: {
          isFirstTimeUser: true,
          hasCompletedOnboarding: false,
          onboardingStep: 'pending',
          loginCount: 1,
        },
      };

      const docRef = doc(db, this.collectionName, uid);
      await setDoc(docRef, cleanUndefinedValues(profile));
      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profileData = { uid, ...docSnap.data() } as UserProfile;

        // Fetch is_tailor from users collection if not already in profile
        try {
          const userDocRef = doc(db, "staging_users", uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData?.is_tailor !== undefined) {
              profileData.is_tailor = userData.is_tailor;
            }
          }
        } catch (userError) {
          // If we can't fetch is_tailor, continue without it (non-critical)
          console.debug('Could not fetch is_tailor from users collection:', userError);
        }

        return profileData;
      }
      return null;
    } catch (error: any) {
      // If it's a permission error, preserve that information
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        console.warn('Permission denied reading user profile:', uid, error);
        // Re-throw with original error info for better debugging
        const permissionError = new Error('Permission denied: Failed to get user profile');
        (permissionError as any).code = error?.code || 'permission-denied';
        (permissionError as any).originalError = error;
        throw permissionError;
      }
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, uid);
      await updateDoc(docRef, cleanUndefinedValues(updates as Record<string, any>) as DocumentData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async updateLastLogin(uid: string, email?: string, displayName?: string | null, photoURL?: string | null): Promise<void> {
    try {
      const now = new Date();
      let profile: UserProfile | null = null;
      
      // Try to get existing profile, but handle errors gracefully
      try {
        profile = await this.getProfile(uid);
      } catch (error: any) {
        // If profile doesn't exist or permission denied, create it if we have email
        if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
          console.warn('Permission denied reading user profile, will create if email provided:', uid);
          if (email) {
            profile = await this.createProfile(uid, email, displayName, photoURL);
          } else {
            // Can't create without email, just return silently
            console.warn('Cannot create profile without email, skipping last login update');
            return;
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }
      
      if (profile) {
        const loginCount = (profile.metadata?.loginCount || 0) + 1;
        const updates = {
          lastLoginAt: now,
          metadata: {
            ...profile.metadata,
            loginCount,
          },
          onboardingStatus: {
            ...profile.onboardingStatus,
            firstLoginCompleted: true,
          },
        };
        await this.updateProfile(uid, updates);
      } else if (email) {
        // Profile doesn't exist, create it
        await this.createProfile(uid, email, displayName, photoURL);
      }
    } catch (error) {
      // Don't throw - just log the error as this is a non-critical operation
      console.error('Error updating last login (non-critical):', error);
      // Silently fail - this shouldn't block the user from signing in
    }
  }

  async markMeasurementsCompleted(uid: string): Promise<void> {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        const updates = {
          onboardingStatus: {
            ...profile.onboardingStatus,
            measurementsCompleted: true,
          },
          metadata: {
            ...profile.metadata,
            onboardingStep: 'completed' as const,
            hasCompletedOnboarding: true,
            isFirstTimeUser: false,
          },
        };
        await this.updateProfile(uid, updates);
      }
    } catch (error) {
      console.error('Error marking measurements completed:', error);
      throw new Error('Failed to mark measurements completed');
    }
  }

  async markOnboardingCompleted(uid: string): Promise<void> {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        const updates = {
          onboardingStatus: {
            ...profile.onboardingStatus,
            profileCompleted: true,
          },
          metadata: {
            ...profile.metadata,
            onboardingStep: 'completed' as const,
            hasCompletedOnboarding: true,
            isFirstTimeUser: false,
          },
        };
        await this.updateProfile(uid, updates);
      }
    } catch (error) {
      console.error('Error marking onboarding completed:', error);
      throw new Error('Failed to mark onboarding completed');
    }
  }

  async skipMeasurements(uid: string): Promise<void> {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        const updates = {
          preferences: {
            ...profile.preferences,
            skipMeasurements: true,
          },
          metadata: {
            ...profile.metadata,
            onboardingStep: 'completed' as const,
            hasCompletedOnboarding: true,
            isFirstTimeUser: false,
          },
        };
        await this.updateProfile(uid, updates);
      }
    } catch (error) {
      console.error('Error skipping measurements:', error);
      throw new Error('Failed to skip measurements');
    }
  }

  async getUserStatus(uid: string): Promise<UserStatus | null> {
    try {
      const profile = await this.getProfile(uid);
      if (!profile) return null;

      return {
        isFirstTime: profile.metadata.isFirstTimeUser,
        hasCompletedMeasurements: profile.onboardingStatus.measurementsCompleted,
        lastLoginDate: profile.lastLoginAt,
        onboardingStep: profile.metadata.onboardingStep,
      };
    } catch (error) {
      console.error('Error getting user status:', error);
      throw new Error('Failed to get user status');
    }
  }

  async isFirstTimeUser(uid: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(uid);
      return profile?.metadata.isFirstTimeUser ?? true;
    } catch (error) {
      console.error('Error checking if first time user:', error);
      return true; // Default to true for safety
    }
  }

  async hasCompletedOnboarding(uid: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(uid);
      return profile?.metadata.hasCompletedOnboarding ?? false;
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      return false; // Default to false for safety
    }
  }

  async updatePreferences(uid: string, preferences: { gender?: string | null; preferredType?: string | null }): Promise<void> {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        // Filter and validate preferences to match UserProfile interface
        const validatedPreferences: Partial<UserProfile['preferences']> = {};
        
        if (preferences.gender && (preferences.gender === 'man' || preferences.gender === 'woman')) {
          validatedPreferences.gender = preferences.gender;
        }
        
        if (preferences.preferredType && 
            (preferences.preferredType === 'bespoke' || 
             preferences.preferredType === 'ready-to-wear' || 
             preferences.preferredType === 'both')) {
          validatedPreferences.productType = preferences.preferredType as 'bespoke' | 'ready-to-wear' | 'both';
        }

        const updates = {
          preferences: {
            ...profile.preferences,
            ...validatedPreferences,
          },
        };
        await this.updateProfile(uid, updates);
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  async markAsFirstTimeUser(uid: string): Promise<void> {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        const updates = {
          metadata: {
            ...profile.metadata,
            isFirstTimeUser: true,
            hasCompletedOnboarding: false,
            onboardingStep: 'measurements' as const,
          },
        };
        await this.updateProfile(uid, updates);
      }
    } catch (error) {
      console.error('Error marking as first time user:', error);
      throw new Error('Failed to mark as first time user');
    }
  }
}

export class OrderRepository {
  private async getUserOrdersCollection(userId: string) {
    const db = await getFirebaseDb();
    return collection(db, 'staging_users_orders', userId, 'user_orders');
  }

  // ✅ Get all orders for a user with caching
  getByUserId = withCache(
    async (userId: string): Promise<UserOrder[]> => {
      try {
        const collectionRef = await this.getUserOrdersCollection(userId);
        const q = query(collectionRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserOrder[];
      } catch (error) {
        console.error('Error getting user orders:', error);
        throw new Error('Failed to get user orders');
      }
    },
    (userId: string) => cacheKeys.orders(userId),
    2 * 60 * 1000 // 2 minutes cache for orders
  );

  // ✅ Get a specific order by order_id with caching
  getByOrderId = withCache(
    async (userId: string, orderId: string): Promise<UserOrder | null> => {
      try {
        const collectionRef = await this.getUserOrdersCollection(userId);
        const q = query(collectionRef, where('order_id', '==', orderId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as UserOrder;
      } catch (error) {
        console.error('Error getting order by ID:', error);
        throw new Error('Failed to get order');
      }
    },
    (userId: string, orderId: string) => cacheKeys.order(`${userId}:${orderId}`),
    5 * 60 * 1000 // 5 minutes cache for individual orders
  );

  // ✅ Get all orders by a given status (e.g., delivered, pending)
  async getByStatus(userId: string, status: string): Promise<UserOrder[]> {
    try {
      const collectionRef = await this.getUserOrdersCollection(userId);
      const q = query(collectionRef, where('order_status', '==', status));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserOrder[];
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw new Error('Failed to get orders by status');
    }
  }

  // ✅ Update order status
  async updateStatus(userId: string, orderId: string, status: string): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, "staging_users_orders", userId, 'user_orders', orderId);
      await updateDoc(docRef, {
        order_status: status,
        last_update: new Date(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  // ✅ Create a new order in the user's subcollection
  async createOrder(
    userId: string,
    orderData: Omit<UserOrder, 'user_id' | 'createdAt' | 'timestamp'>
  ): Promise<string> {
    try {
      const now = new Date();
      const order: UserOrder = {
        ...orderData,
        user_id: userId,
        createdAt: now,
        timestamp: now,
      };

      const collectionRef = await this.getUserOrdersCollection(userId);
      const docRef = await addDoc(collectionRef, order);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  // ✅ Save or overwrite an order by ID (useful for updates)
  async saveOrder(userId: string, orderId: string, orderData: Partial<UserOrder>): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, "staging_users_orders", userId, 'user_orders', orderId);
      await setDoc(docRef, cleanUndefinedValues({ ...orderData, updatedAt: new Date() }), { merge: true });
    } catch (error) {
      console.error('Error saving order:', error);
      throw new Error('Failed to save order');
    }
  }

  // ✅ Get all order items by reference (querying 'all_orders' collection)
  async getOrdersByReference(orderRef: string): Promise<UserOrder[]> {
    try {
      const db = await getFirebaseDb();
      
      // Query 'all_orders' collection by 'order_id'
      const q = query(
        collection(db, 'staging_all_orders'),
        where('order_id', '==', orderRef)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserOrder));
      }

      return [];
    } catch (error) {
      console.error('Error getting orders by reference:', error);
      throw new Error('Failed to get orders');
    }
  }
}

// Cart repository - handles individual cart items with user-scoped collections
export class CartRepository {
  // Fetch all cart items for a user
  async getByUserId(userId: string): Promise<CartItem[]> {
    try {
      // ✅ Corrected collection reference
      const db = await getFirebaseDb();
      const collectionRef = collection(db, 'staging_users_cart_items', userId, 'user_cart_items');
      const querySnapshot = await getDocs(collectionRef);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CartItem[];
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw new Error('Failed to get cart items');
    }
  }

  // Add a new item to the user's cart
  async addItem(
    userId: string,
    item: Omit<CartItem, 'user_id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const cartItem: CartItem = {
        ...item,
        user_id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Deep clean undefined values from nested objects (e.g., product.vendor.location)
      // Firestore doesn't accept undefined values, even in nested objects
      const cleanedCartItem = deepCleanUndefinedValues(cartItem);

      // ✅ Corrected collection reference
      const db = await getFirebaseDb();
      const collectionRef = collection(db, 'staging_users_cart_items', userId, 'user_cart_items');
      const docRef = await addDoc(collectionRef, cleanedCartItem);
      return docRef.id;
    } catch (error) {
      console.error('Error adding cart item:', error);
      throw new Error('Failed to add cart item');
    }
  }

  // Update an existing item in the user's cart
  async updateItem(userId: string, itemId: string, updates: Partial<CartItem>): Promise<void> {
    try {
      // ✅ Corrected doc reference
      const db = await getFirebaseDb();
      const docRef = doc(db, "staging_users_cart_items", userId, 'user_cart_items', itemId);
      
      // Filter out undefined values and convert null strings to null (Firestore doesn't accept undefined)
      const cleanedUpdates: Record<string, any> = {
        updatedAt: new Date(),
      };
      
      for (const [key, value] of Object.entries(updates)) {
        // Only include defined values (exclude undefined)
        if (value !== undefined) {
          // Convert empty strings to null for optional fields like size/color
          cleanedUpdates[key] = value === '' ? null : value;
        }
      }
      
      await updateDoc(docRef, cleanedUpdates);
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw new Error('Failed to update cart item');
    }
  }

  // Remove an item from the user's cart
  async removeItem(userId: string, itemId: string): Promise<void> {
    try {
      // ✅ Corrected doc reference
      const db = await getFirebaseDb();
      const docRef = doc(db, "staging_users_cart_items", userId, 'user_cart_items', itemId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw new Error('Failed to remove cart item');
    }
  }

  // Remove items by product ID (and optional size/color) - handles removing multiple docs for merged items
  async removeItemsByProduct(
    userId: string, 
    productId: string, 
    options?: { size?: string | null; color?: string | null; individualItemId?: string }
  ): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const collectionRef = collection(db, 'staging_users_cart_items', userId, 'user_cart_items');
      
      // Build query constraints
      const constraints: QueryConstraint[] = [
        where('product_id', '==', productId)
      ];
      
      if (options?.size !== undefined) {
        constraints.push(where('size', '==', options.size));
      }
      
      if (options?.color !== undefined) {
        constraints.push(where('color', '==', options.color));
      }
      
      // If individual item ID is provided, use it
      if (options?.individualItemId) {
         // Note: individualItemId might not be a top-level field in all cart items, 
         // but based on addIndividualItemToCart, we store it.
         // However, the field name in CartItem type is 'individualItemId'.
         // Let's assume it's stored. If not, we rely on filtering in memory or checking the data adapter.
         // But wait, Firestore queries are shallow.
         // Let's check CartItem definition in context or types.
         // The CartItem in context has it. `cartRepository.addItem` saves the whole object.
         constraints.push(where('individualItemId', '==', options.individualItemId));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      // Delete all matching documents
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
    } catch (error) {
      console.error('Error removing cart items by product:', error);
      throw new Error('Failed to remove cart items by product');
    }
  }

  // Clear all items from the user's cart
  async clearUserCart(userId: string): Promise<void> {
    try {
      const items = await this.getByUserId(userId);
      for (const item of items) {
        if (item.id) {
          await this.removeItem(userId, item.id);
        }
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error('Failed to clear cart');
    }
  }
}


// Wishlist repository - handles individual wishlist items with user-scoped collections
export class WishlistRepository {
  private async getCollectionRef(userId: string) {
    // ✅ Use exact Firestore structure: users_wishlist_items/{userId}/user_wishlist_items
    const db = await getFirebaseDb();
    return collection(db, 'staging_users_wishlist_items', userId, 'user_wishlist_items');
  }

  async getByUserId(userId: string): Promise<WishlistItem[]> {
    try {
      // Validate userId
      if (!userId || typeof userId !== 'string') {
        console.warn('Invalid userId provided to getByUserId:', userId);
        return [];
      }

      const collectionRef = await this.getCollectionRef(userId);
      const querySnapshot = await getDocs(collectionRef);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Map Firestore data to WishlistItem interface
        return {
          id: doc.id,
          user_id: data.user_id || userId,
          product_id: data.product_id || data.productId || '',
          title: data.title || '',
          description: data.description || '',
          price: data.price || 0,
          discount: data.discount || 0,
          images: data.images || [],
          is_saved: data.is_saved !== undefined ? data.is_saved : true,
          size: data.size || null,
          sizes: data.sizes || null,
          tailor_id: data.tailor_id || '',
          tailor: data.tailor || '',
          createdAt: data.createdAt || data.addedAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        } as WishlistItem;
      });
    } catch (error: any) {
      console.error('Error getting wishlist items:', {
        userId,
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Check if it's a permission error
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for wishlist access, returning empty array');
        return [];
      }
      
      // Check if it's a network error
      if (error.code === 'unavailable' || error.message?.includes('network')) {
        console.warn('Network error accessing wishlist, returning empty array');
        return [];
      }
      
      // For other errors, still return empty array but log the specific error
      console.error('Unexpected wishlist error, returning empty array:', error);
      return [];
    }
  }

  async addItem(
    userId: string,
    item: Omit<WishlistItem, 'user_id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const wishlistItem: WishlistItem = {
        ...item,
        user_id: userId,
        is_saved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const collectionRef = await this.getCollectionRef(userId);
      const docRef = await addDoc(collectionRef, wishlistItem);
      return docRef.id;
    } catch (error) {
      console.error('Error adding wishlist item:', error);
      throw new Error('Failed to add wishlist item');
    }
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(
        db, "staging_users_wishlist_items",
        userId,
        'user_wishlist_items',
        itemId
      );
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing wishlist item:', error);
      throw new Error('Failed to remove wishlist item');
    }
  }

  async removeByProductId(userId: string, productId: string): Promise<void> {
    try {
      const items = await this.getByUserId(userId);
      const itemToRemove = items.find((item) => item.product_id === productId);
      if (itemToRemove && itemToRemove.id) {
        await this.removeItem(userId, itemToRemove.id);
      }
    } catch (error) {
      console.error('Error removing wishlist item by product ID:', error);
      throw new Error('Failed to remove wishlist item');
    }
  }

  async isProductSaved(userId: string, productId: string): Promise<boolean> {
    const items = await this.getByUserId(userId);
    return items.some((item) => item.product_id === productId && item.is_saved);
  }

  // Optional legacy compatibility
  async getByUserId_Legacy(
    userId: string
  ): Promise<{ userId: string; items: WishlistItem[]; updatedAt: Date } | null> {
    const items = await this.getByUserId(userId);
    if (items.length === 0) return null;

    return {
      userId,
      items,
      updatedAt: new Date(),
    };
  }
}

// Address repository - handles user addresses with user-scoped collections
export class AddressRepository {
  private getCollectionPath(userId: string): string {
    return `staging_users_addresses/${userId}/user_addresses`;
  }

  async getByUserId(userId: string): Promise<UserAddress[]> {
    try {
      const db = await getFirebaseDb();
      const collectionRef = collection(db, this.getCollectionPath(userId));
      const querySnapshot = await getDocs(collectionRef);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserAddress[];
    } catch (error) {
      console.error('Error getting user addresses:', error);
      throw new Error('Failed to get user addresses');
    }
  }

  async addAddress(userId: string, address: Omit<UserAddress, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const addressData: UserAddress = {
        ...address,
        createdAt: new Date(),
        updatedAt: new Date()
      };
const db = await getFirebaseDb();
      const collectionRef = collection(db, this.getCollectionPath(userId));
      const docRef = await addDoc(collectionRef, addressData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding address:', error);
      throw new Error('Failed to add address');
    }
  }

  async updateAddress(userId: string, addressId: string, updates: Partial<UserAddress>): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.getCollectionPath(userId), addressId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('Failed to update address');
    }
  }

  async removeAddress(userId: string, addressId: string): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.getCollectionPath(userId), addressId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing address:', error);
      throw new Error('Failed to remove address');
    }
  }

  async getDefaultAddress(userId: string): Promise<UserAddress | null> {
    try {
      const db = await getFirebaseDb();
      const collectionRef = collection(db, this.getCollectionPath(userId));
      const q = query(collectionRef, where('is_default', '==', true));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserAddress;
    } catch (error) {
      console.error('Error getting default address:', error);
      throw new Error('Failed to get default address');
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      // First, unset all default addresses
      const addresses = await this.getByUserId(userId);
      for (const address of addresses) {
        if (address.id && address.is_default) {
          await this.updateAddress(userId, address.id, { is_default: false });
        }
      }

      // Then set the new default
      await this.updateAddress(userId, addressId, { is_default: true });
    } catch (error) {
      console.error('Error setting default address:', error);
      throw new Error('Failed to set default address');
    }
  }
}

// Tailor repository
export class TailorRepository extends Repository<Tailor> {
  constructor() {
    super('staging_tailors');
  }

  async getByBrandName(brandName: string): Promise<Tailor | null> {
    const tailors = await this.getAll([where('brandName', '==', brandName)]);
    return tailors.length > 0 ? tailors[0] : null;
  }

  async getByStatus(status: string): Promise<Tailor[]> {
    return this.getAll([where('status', '==', status)]);
  }

  async getFeaturedTailors(): Promise<Tailor[]> {
    return this.getAll([
      where('status', '==', 'approved'),
      orderBy('ratings', 'desc'),
      limit(10)
    ]);
  }
}

// Collection repository for Product Collections Visual Designer
export class CollectionRepository {
  private collectionName = 'staging_product_collections';

  /**
   * Create a new product collection
   */
  async create(data: Omit<ProductCollection, 'id' | 'createdAt' | 'updatedAt' | 'published' | 'publishedAt'>): Promise<string> {
    try {
      const db = await getFirebaseDb();
      const now = new Date();
      const collectionData = {
        ...data,
        createdAt: now,
        updatedAt: now,
        published: false,
        publishedAt: null,
      };
      const docRef = await addDoc(collection(db, this.collectionName), cleanUndefinedValues(collectionData));
      return docRef.id;
    } catch (error) {
      console.error('Error creating product collection:', error);
      throw new Error('Failed to create product collection');
    }
  }

  /**
   * Get a product collection by ID
   */
  async getById(id: string): Promise<ProductCollection | null> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ProductCollection;
      }
      return null;
    } catch (error) {
      console.error('Error getting product collection:', error);
      throw new Error('Failed to get product collection');
    }
  }

  /**
   * Update a product collection
   */
  async update(id: string, data: Partial<ProductCollection>): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      const cleanedData = cleanUndefinedValues(updateData as Record<string, any>);
      await updateDoc(docRef, cleanedData as DocumentData);
    } catch (error) {
      console.error('Error updating product collection:', error);
      throw new Error('Failed to update product collection');
    }
  }

  /**
   * Delete a product collection
   */
  async delete(id: string): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting product collection:', error);
      throw new Error('Failed to delete product collection');
    }
  }

  /**
   * Get all collections with optional filters
   */
  async getAll(constraints: QueryConstraint[] = []): Promise<ProductCollection[]> {
    try {
      const db = await getFirebaseDb();
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductCollection[];
    } catch (error: any) {
      console.error('Error getting all product collections:', error);
      // Preserve original error message for better debugging
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'unknown';
      throw new Error(`Failed to get product collections: ${errorMessage} (${errorCode})`);
    }
  }

  /**
   * Get all collections by user ID
   */
  async getByUserId(userId: string): Promise<ProductCollection[]> {
    try {
      const collections = await this.getAll([
        where('createdBy', '==', userId)
      ]);
      
      // Sort in memory by createdAt
      return collections.sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt : 
                      a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? 
                      (a.createdAt as any).toDate() : new Date(0);
        const bDate = b.createdAt instanceof Date ? b.createdAt : 
                      b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? 
                      (b.createdAt as any).toDate() : new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
    } catch (error) {
      console.error('Error getting collections by user:', error);
      throw new Error('Failed to get user collections');
    }
  }

  /**
   * Get all published collections
   */
  async getPublishedCollections(): Promise<ProductCollection[]> {
    try {
      const collections = await this.getAll([
        where('published', '==', true)
      ]);

      // Sort in memory by publishedAt
      return collections.sort((a, b) => {
        const aDate = a.publishedAt instanceof Date ? a.publishedAt :
                      a.publishedAt && typeof a.publishedAt === 'object' && 'toDate' in a.publishedAt ?
                      (a.publishedAt as any).toDate() : new Date(0);
        const bDate = b.publishedAt instanceof Date ? b.publishedAt :
                      b.publishedAt && typeof b.publishedAt === 'object' && 'toDate' in b.publishedAt ?
                      (b.publishedAt as any).toDate() : new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
    } catch (error: any) {
      console.error('Error getting published collections:', error);
      // Preserve original error for better debugging
      const errorMessage = error?.message || 'Unknown error';
      throw new Error(`Failed to get published collections: ${errorMessage}`);
    }
  }

  /**
   * Get the currently published collection (only one should be published at a time)
   */
  async getPublishedCollection(): Promise<ProductCollection | null> {
    try {
      const published = await this.getPublishedCollections();
      return published.length > 0 ? published[0] : null;
    } catch (error) {
      console.error('Error getting published collection:', error);
      return null; // Return null instead of throwing to prevent blocking
    }
  }

  /**
   * Publish a collection (unpublishes any previously published collection)
   */
  async publish(id: string): Promise<void> {
    try {
      // First, unpublish any currently published collection
      const currentPublished = await this.getPublishedCollection();
      if (currentPublished && currentPublished.id !== id) {
        await this.update(currentPublished.id, {
          published: false,
          publishedAt: null,
        });
      }

      // Then publish the new collection
      await this.update(id, {
        published: true,
        publishedAt: new Date(),
      });
    } catch (error) {
      console.error('Error publishing collection:', error);
      throw new Error('Failed to publish collection');
    }
  }

  /**
   * Unpublish a collection
   */
  async unpublish(id: string): Promise<void> {
    try {
      await this.update(id, {
        published: false,
        publishedAt: null,
      });
    } catch (error) {
      console.error('Error unpublishing collection:', error);
      throw new Error('Failed to unpublish collection');
    }
  }

  /**
   * Get a collection product by ID from collectionProducts collection
   * Path structure: collectionProducts/{productId}
   * The productId is the ID from productIds array after stripping the "collection:" prefix
   * @param productId - The product ID (without collection: prefix)
   * @param userId - Optional userId (not used, kept for backward compatibility)
   */
  async getCollectionProductById(productId: string, userId?: string): Promise<any | null> {
    try {
      const db = await getFirebaseDb();
      
      // Try direct path first: collectionProducts/{productId}
      const productRef = doc(db, 'staging_collectionProducts', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        console.log(`Found collection product at staging_collectionProducts/${productId}`);
        return { id: productSnap.id, ...productSnap.data() };
      }
      
      // If not found and userId is provided, try subcollection path: collectionProducts/{userId}/products/{productId}
      if (userId) {
        try {
          const subcollectionRef = doc(db, 'staging_collectionProducts', userId, 'products', productId);
          const subcollectionSnap = await getDoc(subcollectionRef);
          
          if (subcollectionSnap.exists()) {
            console.log(`Found collection product at staging_collectionProducts/${userId}/products/${productId}`);
            return { id: subcollectionSnap.id, ...subcollectionSnap.data() };
          }
        } catch (subcollectionError) {
          console.log(`No subcollection found at staging_collectionProducts/${userId}/products/${productId}`);
        }
      }
      
      // If not found, try querying all products by createdBy and find matching ID
      if (userId) {
        try {
          const productsCollection = collection(db, 'staging_collectionProducts');
          const q = query(
            productsCollection, 
            where('createdBy', '==', userId)
          );
          const querySnapshot = await getDocs(q);
          
          // Find the product with matching ID in the results
          for (const doc of querySnapshot.docs) {
            if (doc.id === productId) {
              console.log(`Found collection product via createdBy query: ${doc.id}`);
              return { id: doc.id, ...doc.data() };
            }
          }
        } catch (queryError) {
          console.log('createdBy query method failed:', queryError);
        }
      }
      
      console.warn(`Collection product ${productId} not found. Tried paths:
        - collectionProducts/${productId}
        ${userId ? `- collectionProducts/${userId}/products/${productId}` : ''}
        ${userId ? `- Query by createdBy=${userId}` : ''}`);
      return null;
    } catch (error) {
      console.error('Error getting collection product:', error);
      return null;
    }
  }
}



// Export repository instances
export const productRepository = new ProductRepository();
export const userRepository = new UserRepository();
export const userProfileRepository = new UserProfileRepository();
export const orderRepository = new OrderRepository();
export const cartRepository = new CartRepository();
export const wishlistRepository = new WishlistRepository();
export const addressRepository = new AddressRepository();
export const tailorRepository = new TailorRepository();
export const collectionRepository = new CollectionRepository();

// User Order Repository class
export class UserOrderRepository {
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
  }

  async getUserOrders(userId: string): Promise<UserOrder[]> {
    return this.orderRepo.getByUserId(userId);
  }

  async getOrderById(userId: string, orderId: string): Promise<UserOrder | null> {
    return this.orderRepo.getByOrderId(userId, orderId);
  }

  async getOrdersByStatus(userId: string, status: string): Promise<UserOrder[]> {
    return this.orderRepo.getByStatus(userId, status);
  }

  async updateOrderStatus(userId: string, orderId: string, status: string): Promise<void> {
    return this.orderRepo.updateStatus(userId, orderId, status);
  }

  async createOrder(userId: string, orderData: Omit<UserOrder, 'user_id' | 'createdAt' | 'timestamp'>): Promise<string> {
    return this.orderRepo.createOrder(userId, orderData);
  }

  async saveOrder(userId: string, orderId: string, orderData: Partial<UserOrder>): Promise<void> {
    return this.orderRepo.saveOrder(userId, orderId, orderData);
  }
}

// Export repository instances
// Export repository instances
export const userOrderRepository = new UserOrderRepository();

// Free Gift Claim Repository
export class FreeGiftRepository extends Repository<FreeGiftClaim> {
  constructor() {
    super('free_gift_claims');
  }

  async hasEmailClaimed(email: string): Promise<boolean> {
    const claims = await this.getAll([where('email', '==', email)]);
    return claims.length > 0;
  }

  async claimGift(data: Omit<FreeGiftClaim, 'id' | 'createdAt' | 'status' | 'claimedAt'>): Promise<string> {
    const existing = await this.hasEmailClaimed(data.email);
    if (existing) {
      throw new Error('This email has already claimed a free gift.');
    }

    const now = new Date();
    const claim: Omit<FreeGiftClaim, 'id'> = {
      ...data,
      createdAt: now,
      status: 'requested',
      claimedAt: now,
    };

    return this.create(claim);
  }
}

export const freeGiftRepository = new FreeGiftRepository();