// lib/services/websiteHitsService.ts
import { db } from '@/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { GeolocationService } from './geolocationService';

export interface WebsiteHit {
  visitor_id: string;
  page_url: string;
  page_title: string;
  referrer: string;
  user_agent: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  country: string;
  state: string;
  city?: string;
  ip?: string;
  timestamp: Timestamp;
  session_id: string;
}

export class WebsiteHitsService {
  private static readonly COLLECTION_NAME = 'web_hits';
  private static readonly VISITOR_ID_KEY = 'stitches_visitor_id';
  private static readonly SESSION_ID_KEY = 'stitches_session_id';
  private static readonly LAST_VISIT_KEY = 'stitches_last_visit';

  /**
   * Generate a unique visitor ID
   */
  private static generateVisitorId(): string {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create visitor ID from localStorage
   */
  private static getVisitorId(): string {
    if (typeof window === 'undefined') return '';

    let visitorId = localStorage.getItem(this.VISITOR_ID_KEY);
    
    if (!visitorId) {
      visitorId = this.generateVisitorId();
      localStorage.setItem(this.VISITOR_ID_KEY, visitorId);
    }

    return visitorId;
  }

  /**
   * Get or create session ID from sessionStorage
   */
  private static getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem(this.SESSION_ID_KEY);
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  }

  /**
   * Check if visitor has already been recorded today
   */
  private static async hasVisitedToday(visitorId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check localStorage first for quick check
    const lastVisit = localStorage.getItem(this.LAST_VISIT_KEY);
    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit);
      const today = new Date();
      
      // If last visit was today, don't record again
      if (
        lastVisitDate.getDate() === today.getDate() &&
        lastVisitDate.getMonth() === today.getMonth() &&
        lastVisitDate.getFullYear() === today.getFullYear()
      ) {
        return true;
      }
    }

    // Double-check with Firestore
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hitsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('visitor_id', '==', visitorId),
        where('timestamp', '>=', Timestamp.fromDate(today))
      );

      const snapshot = await getDocs(hitsQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking visit history:', error);
      return false;
    }
  }

  /**
   * Detect device type
   */
  private static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const ua = navigator.userAgent;
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Detect browser
   */
  private static getBrowser(): string {
    if (typeof window === 'undefined') return 'Unknown';

    const ua = navigator.userAgent;
    
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    
    return 'Other';
  }

  /**
   * Detect operating system
   */
  private static getOS(): string {
    if (typeof window === 'undefined') return 'Unknown';

    const ua = navigator.userAgent;
    
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    
    return 'Other';
  }

  /**
   * Record a website hit
   */
  static async recordHit(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const visitorId = this.getVisitorId();
      
      // Check if visitor has already been recorded today
      const hasVisited = await this.hasVisitedToday(visitorId);
      
      if (hasVisited) {
        console.log('Visitor already recorded today, skipping...');
        return;
      }

      // Get location data
      const locationData = await GeolocationService.getUserLocation();

      // Get session ID
      const sessionId = this.getSessionId();

      // Create hit record
      const hitData: WebsiteHit = {
        visitor_id: visitorId,
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || 'Direct',
        user_agent: navigator.userAgent,
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
        country: locationData.country,
        state: locationData.state,
        city: locationData.city,
        ip: locationData.ip,
        timestamp: Timestamp.now(),
        session_id: sessionId,
      };

      // Save to Firestore
      await addDoc(collection(db, this.COLLECTION_NAME), hitData);

      // Update last visit timestamp in localStorage
      localStorage.setItem(this.LAST_VISIT_KEY, new Date().toISOString());

      console.log('Website hit recorded successfully');
    } catch (error) {
      console.error('Error recording website hit:', error);
      // Don't throw error to prevent app disruption
    }
  }

  /**
   * Get total hits count
   */
  static async getTotalHits(): Promise<number> {
    try {
      const hitsQuery = query(collection(db, this.COLLECTION_NAME));
      const snapshot = await getDocs(hitsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total hits:', error);
      return 0;
    }
  }

  /**
   * Get unique visitors count
   */
  static async getUniqueVisitors(): Promise<number> {
    try {
      const hitsQuery = query(collection(db, this.COLLECTION_NAME));
      const snapshot = await getDocs(hitsQuery);
      
      const uniqueVisitors = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data() as WebsiteHit;
        uniqueVisitors.add(data.visitor_id);
      });
      
      return uniqueVisitors.size;
    } catch (error) {
      console.error('Error getting unique visitors:', error);
      return 0;
    }
  }

  /**
   * Get hits for today
   */
  static async getTodayHits(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hitsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('timestamp', '>=', Timestamp.fromDate(today))
      );
      
      const snapshot = await getDocs(hitsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting today hits:', error);
      return 0;
    }
  }
}
