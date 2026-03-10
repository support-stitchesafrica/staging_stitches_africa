import { Product } from '@/types';

export interface TypeSpecificContent {
  sections: ContentSection[];
  actions: ActionButton[];
  warnings: string[];
  additionalInfo: AdditionalInfo[];
}

export interface ContentSection {
  id: string;
  title: string;
  content: React.ReactNode | string;
  priority: number;
  visible: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  action: string;
  variant: 'primary' | 'secondary' | 'warning';
  visible: boolean;
}

export interface AdditionalInfo {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'badge' | 'list';
  visible: boolean;
}

/**
 * Determines what content sections should be displayed based on product type
 */
export const getTypeSpecificContent = (product: Product): TypeSpecificContent => {
  const isBespoke = product.type === 'bespoke';
  const isReadyToWear = product.type === 'ready-to-wear';

  const sections: ContentSection[] = [];
  const actions: ActionButton[] = [];
  const warnings: string[] = [];
  const additionalInfo: AdditionalInfo[] = [];

  if (isBespoke && product.bespokeOptions) {
    // Bespoke-specific sections
    sections.push({
      id: 'customization-options',
      title: 'Customization Options',
      content: 'bespoke-customization',
      priority: 1,
      visible: true
    });

    sections.push({
      id: 'measurements-required',
      title: 'Required Measurements',
      content: 'bespoke-measurements',
      priority: 2,
      visible: !!product.bespokeOptions.measurementsRequired?.length
    });

    sections.push({
      id: 'production-timeline',
      title: 'Production Information',
      content: 'bespoke-production',
      priority: 3,
      visible: !!product.bespokeOptions.productionTime
    });

    // Bespoke-specific actions


    actions.push({
      id: 'request-measurements',
      label: 'Submit Measurements',
      action: 'measurements',
      variant: 'primary',
      visible: !!product.bespokeOptions.measurementsRequired?.length
    });

    // Bespoke warnings
    if (product.bespokeOptions.measurementsRequired?.length) {
      warnings.push('Custom measurements are required for this bespoke item.');
    }
    if (product.bespokeOptions.productionTime) {
      warnings.push(`Production time: ${product.bespokeOptions.productionTime}`);
    }
    if (product.bespokeOptions.depositAllowed) {
      additionalInfo.push({
        id: 'deposit-info',
        label: 'Payment Options',
        value: 'Deposit payments accepted',
        type: 'badge',
        visible: true
      });
    }
  }

  if (isReadyToWear && product.rtwOptions) {
    // Ready-to-wear specific sections
    sections.push({
      id: 'size-selection',
      title: 'Size & Color Options',
      content: 'rtw-options',
      priority: 1,
      visible: !!(product.rtwOptions.sizes?.length || product.rtwOptions.colors?.length)
    });

    sections.push({
      id: 'fabric-details',
      title: 'Fabric Information',
      content: 'rtw-fabric',
      priority: 2,
      visible: !!(product.rtwOptions.fabric || product.rtwOptions.season)
    });

    // Ready-to-wear specific actions
    // actions.push({
    //   id: 'size-guide',
    //   label: 'Size Guide',
    //   action: 'size-guide',
    //   variant: 'secondary',
    //   visible: !!product.rtwOptions.sizes?.length
    // });

    // Ready-to-wear additional info
    if (product.rtwOptions.season) {
      additionalInfo.push({
        id: 'season-info',
        label: 'Season',
        value: product.rtwOptions.season,
        type: 'text',
        visible: true
      });
    }
  }

  // Common sections for both types
  sections.push({
    id: 'shipping-info',
    title: 'Shipping Information',
    content: 'shipping-details',
    priority: 10,
    visible: !!product.shipping
  });

  sections.push({
    id: 'vendor-info',
    title: 'Vendor Information',
    content: 'vendor-details',
    priority: 11,
    visible: !!product.vendor
  });

  return {
    sections: sections.sort((a, b) => a.priority - b.priority),
    actions,
    warnings,
    additionalInfo
  };
};

/**
 * Determines if specific product features should be displayed
 */
export const shouldShowFeature = (product: Product, featureId: string): boolean => {
  const isBespoke = product.type === 'bespoke';
  const isReadyToWear = product.type === 'ready-to-wear';

  switch (featureId) {
    case 'customization-options':
      return isBespoke && !!product.bespokeOptions?.customization;
    
    case 'fabric-choices':
      return isBespoke && !!product.bespokeOptions?.fabricChoices?.length;
    
    case 'style-options':
      return isBespoke && !!product.bespokeOptions?.styleOptions?.length;
    
    case 'measurements-required':
      return isBespoke && !!product.bespokeOptions?.measurementsRequired?.length;
    
    case 'production-time':
      return isBespoke && !!product.bespokeOptions?.productionTime;
    
    case 'care-instructions':
      return isBespoke && !!product.bespokeOptions?.careInstructions;
    
    case 'rtw-sizes':
      return isReadyToWear && !!product.rtwOptions?.sizes?.length;
    
    case 'rtw-colors':
      return isReadyToWear && !!product.rtwOptions?.colors?.length;
    
    case 'rtw-fabric':
      return isReadyToWear && !!product.rtwOptions?.fabric;
    
    case 'rtw-season':
      return isReadyToWear && !!product.rtwOptions?.season;
    
    case 'user-sizes':
      return !!product.userSizes?.length;
    
    case 'custom-sizes':
      return !!product.customSizes;
    
    default:
      return true;
  }
};

/**
 * Gets the appropriate styling classes for product type
 */
export const getTypeSpecificStyling = (product: Product) => {
  const isBespoke = product.type === 'bespoke';
  
  return {
    primaryColor: isBespoke ? 'purple' : 'blue',
    badgeClasses: isBespoke 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800',
    sectionClasses: isBespoke 
      ? 'bg-purple-50 border-purple-200' 
      : 'bg-blue-50 border-blue-200',
    textClasses: isBespoke 
      ? 'text-purple-900' 
      : 'text-blue-900',
    accentClasses: isBespoke 
      ? 'text-purple-700' 
      : 'text-blue-700'
  };
};

/**
 * Filters and organizes product parameters by relevance to product type
 */
export const getRelevantParameters = (product: Product) => {
  const isBespoke = product.type === 'bespoke';
  const isReadyToWear = product.type === 'ready-to-wear';

  const commonParameters = [
    'category',
    'availability',
    'status',
    'deliveryTimeline',
    'returnPolicy'
  ];

  const bespokeParameters = [
    'customSizes',
    'wear_category',
    'wear_quantity',
    ...commonParameters
  ];

  const rtwParameters = [
    'featured',
    'isNewArrival',
    'isBestSeller',
    ...commonParameters
  ];

  return {
    primary: isBespoke ? bespokeParameters : rtwParameters,
    secondary: ['isPublished', 'createdAt', 'updatedAt'],
    hidden: isBespoke 
      ? ['featured', 'isNewArrival', 'isBestSeller'] 
      : ['customSizes', 'wear_category', 'wear_quantity']
  };
};