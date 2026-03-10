/**
 * Product Collections Visual Designer - Template Configurations
 * 
 * This file contains pre-designed layout templates for product collections.
 * Each template defines a specific arrangement of products and text elements.
 */

import { Template, CanvasState, CanvasElement } from '@/types/collections';

/**
 * Helper function to create a product image element placeholder
 */
function createProductSlot(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number
): CanvasElement {
  return {
    id,
    type: 'image',
    position: { x, y },
    size: { width, height },
    rotation: 0,
    zIndex,
    // These will be filled in when template is applied
    imageUrl: '',
    productId: '',
  };
}

/**
 * Helper function to create a text element
 */
function createTextElement(
  id: string,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  zIndex: number,
  options: {
    fontFamily?: string;
    color?: string;
    fontWeight?: string;
  } = {}
): CanvasElement {
  return {
    id,
    type: 'text',
    position: { x, y },
    size: { width: 400, height: fontSize * 1.5 },
    rotation: 0,
    zIndex,
    text,
    fontSize,
    fontFamily: options.fontFamily || 'Arial',
    color: options.color || '#000000',
    fontWeight: options.fontWeight || 'bold',
  };
}

/**
 * Template 1: Grid Layout
 * 4 products arranged in a 2x2 grid with title text
 */
const gridLayoutTemplate: Template = {
  id: 'grid-layout',
  name: 'Grid Layout',
  thumbnail: '/templates/grid-layout.png',
  productSlots: 4,
  layout: {
    elements: [
      // Title text
      createTextElement(
        'text-title',
        'Featured Collection',
        50,
        50,
        48,
        0,
        { fontWeight: 'bold', color: '#1a1a1a' }
      ),
      // Product slots in 2x2 grid
      createProductSlot('product-1', 50, 150, 550, 550, 1),
      createProductSlot('product-2', 620, 150, 550, 550, 2),
      createProductSlot('product-3', 50, 720, 550, 550, 3),
      createProductSlot('product-4', 620, 720, 550, 550, 4),
    ],
    backgroundColor: '#f5f5f5',
    dimensions: { width: 1200, height: 1300 },
  },
};

/**
 * Template 2: Hero Banner
 * 1 large product with 2 smaller products and promotional text
 */
const heroBannerTemplate: Template = {
  id: 'hero-banner',
  name: 'Hero Banner',
  thumbnail: '/templates/hero-banner.png',
  productSlots: 3,
  layout: {
    elements: [
      // Large hero product
      createProductSlot('product-1', 50, 50, 700, 700, 1),
      // Promotional text
      createTextElement(
        'text-title',
        'New Arrivals',
        800,
        100,
        56,
        0,
        { fontWeight: 'bold', color: '#2c3e50' }
      ),
      createTextElement(
        'text-subtitle',
        'Shop the latest collection',
        800,
        180,
        24,
        1,
        { fontWeight: 'normal', color: '#7f8c8d' }
      ),
      // Two smaller products
      createProductSlot('product-2', 800, 280, 350, 350, 2),
      createProductSlot('product-3', 800, 650, 350, 350, 3),
    ],
    backgroundColor: '#ffffff',
    dimensions: { width: 1200, height: 1050 },
  },
};

/**
 * Template 3: Carousel Style
 * 3 products in a horizontal row with centered title
 */
const carouselStyleTemplate: Template = {
  id: 'carousel-style',
  name: 'Carousel Style',
  thumbnail: '/templates/carousel-style.png',
  productSlots: 3,
  layout: {
    elements: [
      // Centered title
      createTextElement(
        'text-title',
        'Trending Now',
        400,
        50,
        48,
        0,
        { fontWeight: 'bold', color: '#34495e' }
      ),
      // Three products in a row
      createProductSlot('product-1', 50, 150, 350, 500, 1),
      createProductSlot('product-2', 425, 150, 350, 500, 2),
      createProductSlot('product-3', 800, 150, 350, 500, 3),
    ],
    backgroundColor: '#ecf0f1',
    dimensions: { width: 1200, height: 700 },
  },
};

/**
 * Template 4: Magazine Layout
 * Asymmetric arrangement with large text overlay
 */
const magazineLayoutTemplate: Template = {
  id: 'magazine-layout',
  name: 'Magazine Layout',
  thumbnail: '/templates/magazine-layout.png',
  productSlots: 4,
  layout: {
    elements: [
      // Large title with background
      createTextElement(
        'text-title',
        'SUMMER',
        50,
        50,
        72,
        5,
        { fontWeight: 'bold', color: '#e74c3c' }
      ),
      createTextElement(
        'text-subtitle',
        'COLLECTION 2024',
        50,
        140,
        36,
        6,
        { fontWeight: 'normal', color: '#2c3e50' }
      ),
      // Asymmetric product arrangement
      createProductSlot('product-1', 50, 250, 500, 500, 1),
      createProductSlot('product-2', 570, 250, 300, 300, 2),
      createProductSlot('product-3', 890, 250, 260, 260, 3),
      createProductSlot('product-4', 570, 570, 580, 400, 4),
    ],
    backgroundColor: '#fef9e7',
    dimensions: { width: 1200, height: 1020 },
  },
};

/**
 * Template 5: Minimal
 * Single large product with prominent text area
 */
const minimalTemplate: Template = {
  id: 'minimal',
  name: 'Minimal',
  thumbnail: '/templates/minimal.png',
  productSlots: 1,
  layout: {
    elements: [
      // Large product image
      createProductSlot('product-1', 100, 100, 600, 600, 1),
      // Text area on the right
      createTextElement(
        'text-title',
        'Exclusive',
        750,
        200,
        64,
        0,
        { fontWeight: 'bold', color: '#1a1a1a' }
      ),
      createTextElement(
        'text-subtitle',
        'Limited Edition',
        750,
        290,
        32,
        1,
        { fontWeight: 'normal', color: '#555555' }
      ),
      createTextElement(
        'text-description',
        'Discover our handpicked selection',
        750,
        360,
        20,
        2,
        { fontWeight: 'normal', color: '#888888' }
      ),
    ],
    backgroundColor: '#ffffff',
    dimensions: { width: 1200, height: 800 },
  },
};

/**
 * Template 6: Promotional Banner
 * Wide banner format with large product image and promotional text
 * Perfect for landing page banners
 */
const promotionalBannerTemplate: Template = {
  id: 'promotional-banner',
  name: 'Promotional Banner',
  thumbnail: '/templates/promotional-banner.png',
  productSlots: 1,
  layout: {
    elements: [
      // Large product image on left
      createProductSlot('product-1', 50, 50, 550, 700, 1),
      // Badge text
      createTextElement(
        'text-badge',
        'Featured Collection',
        650,
        120,
        24,
        0,
        { fontWeight: 'bold', color: '#ffffff' }
      ),
      // Main title
      createTextElement(
        'text-title',
        'New Collection',
        650,
        200,
        56,
        1,
        { fontWeight: 'bold', color: '#1a1a1a' }
      ),
      // Description
      createTextElement(
        'text-description',
        'Discover our curated collection of exclusive items',
        650,
        290,
        24,
        2,
        { fontWeight: 'normal', color: '#555555' }
      ),
    ],
    backgroundColor: '#f5f5f5',
    dimensions: { width: 1200, height: 800 },
  },
};

/**
 * All available templates
 */
export const TEMPLATES: Template[] = [
  gridLayoutTemplate,
  heroBannerTemplate,
  carouselStyleTemplate,
  magazineLayoutTemplate,
  minimalTemplate,
  promotionalBannerTemplate,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

/**
 * Get templates that support a specific number of products
 */
export function getTemplatesByProductCount(count: number): Template[] {
  return TEMPLATES.filter((template) => template.productSlots <= count);
}
