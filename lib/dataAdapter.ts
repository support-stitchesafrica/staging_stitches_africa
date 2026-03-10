// Data adapter to transform existing Stitches Africa data to our component format
import { Product, Tailor } from '@/types';

export function adaptProductData(rawProduct: any): Product {
  // Handle price format - your data has both number and object formats
  const price = typeof rawProduct.price === 'number' 
    ? { base: rawProduct.price, currency: 'USD' }
    : rawProduct.price || { base: 0, currency: 'USD' };

  // Create vendor object from tailor data
  const vendor = {
    id: rawProduct.tailor_id || '',
    name: rawProduct.brandName || rawProduct.brand_name || rawProduct.tailor || 'Unknown Brand'
  };

  // Map availability
  const availability = rawProduct.availability || 'in_stock';

  // Handle images array
  const images = Array.isArray(rawProduct.images) ? rawProduct.images : [];

  // Handle tags
  const tags = Array.isArray(rawProduct.tags) ? rawProduct.tags : [];

  // Determine product type based on existing data
  const type = rawProduct.type || 'ready-to-wear';

  // Create bespoke options if it's a bespoke item
  const bespokeOptions = type === 'bespoke' ? {
    customization: rawProduct.bespokeOptions?.customization || {},
    fabricChoices: rawProduct.bespokeOptions?.fabricChoices || [],
    styleOptions: rawProduct.bespokeOptions?.styleOptions || [],
    productionTime: rawProduct.bespokeOptions?.productionTime || rawProduct.deliveryTimeline || '2-3 weeks',
    measurementsRequired: rawProduct.bespokeOptions?.measurementsRequired || ['chest', 'waist', 'hip']
  } : undefined;

  // Create RTW options
  const rtwOptions = type === 'ready-to-wear' ? {
    sizes: rawProduct.sizes || rawProduct.rtwOptions?.sizes || [],
    colors: rawProduct.colors || rawProduct.rtwOptions?.colors || [],
    fabric: rawProduct.rtwOptions?.fabric || ''
  } : undefined;

  // Handle shipping data
  const shipping = rawProduct.shipping ? {
    actualWeightKg: rawProduct.shipping.actualWeightKg || 0,
    heightCm: rawProduct.shipping.heightCm || 0,
    lengthCm: rawProduct.shipping.lengthCm || 0,
    widthCm: rawProduct.shipping.widthCm || 0,
    manualOverride: rawProduct.shipping.manualOverride || false,
    tierKey: rawProduct.shipping.tierKey || 'tier_standard'
  } : undefined;

  return {
    product_id: rawProduct.product_id || rawProduct.id,
    title: rawProduct.title || 'Untitled Product',
    description: rawProduct.description || '',
    type: type as 'bespoke' | 'ready-to-wear',
    category: rawProduct.category || rawProduct.wear_category || 'general',
    price,
    images,
    vendor,
    availability: availability as 'in_stock' | 'pre_order' | 'out_of_stock',
    status: rawProduct.status || 'verified',
    discount: rawProduct.discount || 0,
    deliveryTimeline: rawProduct.deliveryTimeline || '3-5 business days',
    returnPolicy: rawProduct.returnPolicy || '30 days return policy',
    tags,
    tailor_id: rawProduct.tailor_id || '',
    tailor: rawProduct.tailor || '',
    bespokeOptions,
    rtwOptions,
    shipping,
    metric_size_guide: rawProduct.metric_size_guide,
    enableMultiplePricing: rawProduct.enableMultiplePricing || false,
    individualItems: rawProduct.individualItems || [],
    wear_quantity: rawProduct.wear_quantity,
    wear_category: rawProduct.wear_category || rawProduct.category
  };
}

export function adaptProductsArray(rawProducts: any[]): Product[] {
  return rawProducts.map(adaptProductData);
}

export function adaptTailorData(rawTailor: any): Tailor {
  return {
    id: rawTailor.id || rawTailor.uid,
    brandName: rawTailor.brandName || rawTailor.brand_name || '',
    brand_logo: rawTailor.brand_logo || '',
    first_name: rawTailor.first_name || '',
    last_name: rawTailor.last_name || '',
    email: rawTailor.email || '',
    phoneNumber: rawTailor.phoneNumber || rawTailor.phone_number || '',
    address: rawTailor.address || '',
    city: rawTailor.city || '',
    state: rawTailor.state || '',
    country: rawTailor.country || '',
    ratings: rawTailor.ratings || 0,
    yearsOfExperience: rawTailor.yearsOfExperience || 0,
    type: Array.isArray(rawTailor.type) ? rawTailor.type : [],
    featured_works: Array.isArray(rawTailor.featured_works) ? rawTailor.featured_works : [],
    status: rawTailor.status || 'pending'
  };
}

export function adaptTailorsArray(rawTailors: any[]): Tailor[] {
  return rawTailors.map(adaptTailorData);
}