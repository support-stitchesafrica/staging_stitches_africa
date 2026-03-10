import { SocialPixelConfig } from '@/types/storefront';

export interface PixelEvent {
  eventType: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';
  eventData?: {
    content_type?: string;
    content_ids?: string[];
    content_name?: string;
    value?: number;
    currency?: string;
    num_items?: number;
  };
}

export interface PixelValidationResult {
  isValid: boolean;
  platform: 'facebook' | 'tiktok' | 'snapchat';
  errors: string[];
}

export class PixelService {
  private static instance: PixelService;
  private loadedPixels: Set<string> = new Set();

  static getInstance(): PixelService {
    if (!PixelService.instance) {
      PixelService.instance = new PixelService();
    }
    return PixelService.instance;
  }

  /**
   * Validate pixel ID format for different platforms
   */
  validatePixelId(pixelId: string, platform: 'facebook' | 'tiktok' | 'snapchat'): PixelValidationResult {
    const result: PixelValidationResult = {
      isValid: false,
      platform,
      errors: []
    };

    if (!pixelId || pixelId.trim().length === 0) {
      result.errors.push('Pixel ID cannot be empty');
      return result;
    }

    const trimmedId = pixelId.trim();

    switch (platform) {
      case 'facebook':
        // Facebook Pixel IDs are typically 15-16 digit numbers
        if (!/^\d{15,16}$/.test(trimmedId)) {
          result.errors.push('Facebook Pixel ID must be 15-16 digits');
        } else {
          result.isValid = true;
        }
        break;

      case 'tiktok':
        // TikTok Pixel IDs are typically alphanumeric, around 20 characters
        if (!/^[A-Z0-9]{15,25}$/.test(trimmedId.toUpperCase())) {
          result.errors.push('TikTok Pixel ID must be 15-25 alphanumeric characters');
        } else {
          result.isValid = true;
        }
        break;

      case 'snapchat':
        // Snapchat Pixel IDs are typically UUID format or similar
        if (!/^[a-f0-9-]{20,40}$/i.test(trimmedId)) {
          result.errors.push('Snapchat Pixel ID must be a valid format (20-40 characters, alphanumeric with hyphens)');
        } else {
          result.isValid = true;
        }
        break;

      default:
        result.errors.push('Unsupported platform');
    }

    return result;
  }

  /**
   * Load Facebook Pixel
   */
  private loadFacebookPixel(pixelId: string): void {
    if (this.loadedPixels.has(`fb-${pixelId}`)) return;

    // Facebook Pixel base code
    const fbScript = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
    `;

    const script = document.createElement('script');
    script.innerHTML = fbScript;
    document.head.appendChild(script);

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.head.appendChild(noscript);

    this.loadedPixels.add(`fb-${pixelId}`);
  }

  /**
   * Load TikTok Pixel
   */
  private loadTikTokPixel(pixelId: string): void {
    if (this.loadedPixels.has(`tt-${pixelId}`)) return;

    const ttScript = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;

    const script = document.createElement('script');
    script.innerHTML = ttScript;
    document.head.appendChild(script);

    this.loadedPixels.add(`tt-${pixelId}`);
  }

  /**
   * Load Snapchat Pixel
   */
  private loadSnapchatPixel(pixelId: string): void {
    if (this.loadedPixels.has(`sc-${pixelId}`)) return;

    const scScript = `
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
      {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
      a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
      r.src=n;var u=t.getElementsByTagName(s)[0];
      u.parentNode.insertBefore(r,u);})(window,document,
      'https://sc-static.net/scevent.min.js');
      snaptr('init', '${pixelId}', {
        'user_email': '__INSERT_USER_EMAIL__'
      });
      snaptr('track', 'PAGE_VIEW');
    `;

    const script = document.createElement('script');
    script.innerHTML = scScript;
    document.head.appendChild(script);

    this.loadedPixels.add(`sc-${pixelId}`);
  }

  /**
   * Initialize pixels based on configuration
   */
  initializePixels(config: SocialPixelConfig): void {
    if (config.facebook?.enabled && config.facebook.pixelId) {
      this.loadFacebookPixel(config.facebook.pixelId);
    }

    if (config.tiktok?.enabled && config.tiktok.pixelId) {
      this.loadTikTokPixel(config.tiktok.pixelId);
    }

    if (config.snapchat?.enabled && config.snapchat.pixelId) {
      this.loadSnapchatPixel(config.snapchat.pixelId);
    }
  }

  /**
   * Fire pixel events
   */
  fireEvent(config: SocialPixelConfig, event: PixelEvent): void {
    const { eventType, eventData } = event;

    // Facebook Pixel events
    if (config.facebook?.enabled && config.facebook.pixelId) {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', eventType, eventData || {});
      }
    }

    // TikTok Pixel events
    if (config.tiktok?.enabled && config.tiktok.pixelId) {
      if (typeof window !== 'undefined' && (window as any).ttq) {
        const ttqEventType = this.mapToTikTokEvent(eventType);
        (window as any).ttq.track(ttqEventType, eventData || {});
      }
    }

    // Snapchat Pixel events
    if (config.snapchat?.enabled && config.snapchat.pixelId) {
      if (typeof window !== 'undefined' && (window as any).snaptr) {
        const scEventType = this.mapToSnapchatEvent(eventType);
        (window as any).snaptr('track', scEventType, eventData || {});
      }
    }
  }

  /**
   * Map standard events to TikTok event names
   */
  private mapToTikTokEvent(eventType: string): string {
    const mapping: Record<string, string> = {
      'PageView': 'ViewContent',
      'ViewContent': 'ViewContent',
      'AddToCart': 'AddToCart',
      'InitiateCheckout': 'InitiateCheckout',
      'Purchase': 'CompletePayment'
    };
    return mapping[eventType] || eventType;
  }

  /**
   * Map standard events to Snapchat event names
   */
  private mapToSnapchatEvent(eventType: string): string {
    const mapping: Record<string, string> = {
      'PageView': 'PAGE_VIEW',
      'ViewContent': 'VIEW_CONTENT',
      'AddToCart': 'ADD_CART',
      'InitiateCheckout': 'START_CHECKOUT',
      'Purchase': 'PURCHASE'
    };
    return mapping[eventType] || eventType;
  }

  /**
   * Remove all loaded pixels (useful for testing or cleanup)
   */
  clearPixels(): void {
    this.loadedPixels.clear();
    
    // Remove Facebook Pixel
    if (typeof window !== 'undefined') {
      delete (window as any).fbq;
      delete (window as any)._fbq;
    }

    // Remove TikTok Pixel
    if (typeof window !== 'undefined') {
      delete (window as any).ttq;
    }

    // Remove Snapchat Pixel
    if (typeof window !== 'undefined') {
      delete (window as any).snaptr;
    }

    // Remove script tags
    const scripts = document.querySelectorAll('script[src*="fbevents.js"], script[src*="events.js"], script[src*="scevent.min.js"]');
    scripts.forEach(script => script.remove());
  }
}

export const pixelService = PixelService.getInstance();