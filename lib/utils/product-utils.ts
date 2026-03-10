import { Product } from '@/types';

export interface ProductParameter {
  label: string;
  value: string | number | boolean;
  category: 'basic' | 'specifications' | 'shipping' | 'vendor' | 'metadata';
}

export interface TypeSpecificContent {
  sections: {
    title: string;
    content: Record<string, any>;
    visible: boolean;
  }[];
}

/**
 * Extracts all available product parameters organized by category
 */
export function getProductParameters(product: Product): ProductParameter[] {
  const parameters: ProductParameter[] = [];

  // Basic Information
  parameters.push(
    { label: 'Title', value: product.title, category: 'basic' },
    { label: 'Description', value: product.description, category: 'basic' },
    { label: 'Type', value: product.type, category: 'basic' },
    { label: 'Category', value: product.category, category: 'basic' }
  );

  // Specifications
  parameters.push(
    { label: 'Availability', value: product.availability, category: 'specifications' },
    { label: 'Status', value: product.status, category: 'specifications' },
    { label: 'Delivery Timeline', value: product.deliveryTimeline, category: 'specifications' },
    { label: 'Return Policy', value: product.returnPolicy, category: 'specifications' }
  );

  if (product.wear_category) {
    parameters.push({ label: 'Wear Category', value: product.wear_category, category: 'specifications' });
  }

  if (product.wear_quantity) {
    parameters.push({ label: 'Wear Quantity', value: product.wear_quantity, category: 'specifications' });
  }

  if (product.customSizes) {
    parameters.push({ label: 'Custom Sizes Available', value: product.customSizes, category: 'specifications' });
  }

  if (product.featured) {
    parameters.push({ label: 'Featured Product', value: product.featured, category: 'specifications' });
  }

  if (product.isNewArrival) {
    parameters.push({ label: 'New Arrival', value: product.isNewArrival, category: 'specifications' });
  }

  if (product.isBestSeller) {
    parameters.push({ label: 'Best Seller', value: product.isBestSeller, category: 'specifications' });
  }

  if (product.isPublished !== undefined) {
    parameters.push({ label: 'Published', value: product.isPublished, category: 'specifications' });
  }

  // Shipping Information
  if (product.shipping) {
    parameters.push(
      { label: 'Weight (kg)', value: product.shipping.actualWeightKg, category: 'shipping' },
      { label: 'Length (cm)', value: product.shipping.lengthCm, category: 'shipping' },
      { label: 'Width (cm)', value: product.shipping.widthCm, category: 'shipping' },
      { label: 'Height (cm)', value: product.shipping.heightCm, category: 'shipping' },
      { label: 'Shipping Tier', value: product.shipping.tierKey, category: 'shipping' }
    );
  }

  // Vendor Information
  if (product.vendor) {
    parameters.push({ label: 'Vendor Name', value: product.vendor.name, category: 'vendor' });
    
    if (product.vendor.email) {
      parameters.push({ label: 'Vendor Email', value: product.vendor.email, category: 'vendor' });
    }
    
    if (product.vendor.phone) {
      parameters.push({ label: 'Vendor Phone', value: product.vendor.phone, category: 'vendor' });
    }
    
    if (product.vendor.location) {
      parameters.push({ label: 'Vendor Location', value: product.vendor.location, category: 'vendor' });
    }
  }

  // Metadata
  if (product.metaTitle) {
    parameters.push({ label: 'Meta Title', value: product.metaTitle, category: 'metadata' });
  }

  if (product.metaDescription) {
    parameters.push({ label: 'Meta Description', value: product.metaDescription, category: 'metadata' });
  }

  if (product.slug) {
    parameters.push({ label: 'URL Slug', value: product.slug, category: 'metadata' });
  }

  if (product.createdAt) {
    parameters.push({ label: 'Created Date', value: new Date(product.createdAt).toLocaleDateString(), category: 'metadata' });
  }

  if (product.updatedAt) {
    parameters.push({ label: 'Last Updated', value: new Date(product.updatedAt).toLocaleDateString(), category: 'metadata' });
  }

  return parameters;
}

/**
 * Gets type-specific content sections for bespoke vs ready-to-wear products
 */
export function getTypeSpecificContent(product: Product): TypeSpecificContent {
  const sections = [];

  if (product.type === 'bespoke' && product.bespokeOptions) {
    sections.push({
      title: 'Bespoke Details',
      content: product.bespokeOptions,
      visible: true
    });
  }

  if (product.type === 'ready-to-wear' && product.rtwOptions) {
    sections.push({
      title: 'Ready-to-Wear Details',
      content: product.rtwOptions,
      visible: true
    });
  }

  // Add customization section for bespoke products
  if (product.type === 'bespoke' && product.bespokeOptions?.customization) {
    sections.push({
      title: 'Customization Options',
      content: product.bespokeOptions.customization,
      visible: true
    });
  }

  return { sections };
}

/**
 * Formats product parameter values for display
 */
export function formatParameterValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'string') {
    // Format snake_case and kebab-case to Title Case
    return value
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return String(value);
}

/**
 * Groups product parameters by category
 */
export function groupParametersByCategory(parameters: ProductParameter[]): Record<string, ProductParameter[]> {
  return parameters.reduce((groups, param) => {
    if (!groups[param.category]) {
      groups[param.category] = [];
    }
    groups[param.category].push(param);
    return groups;
  }, {} as Record<string, ProductParameter[]>);
}