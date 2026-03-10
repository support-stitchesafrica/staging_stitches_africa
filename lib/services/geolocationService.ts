// lib/services/geolocationService.ts

export interface GeolocationData {
  country: string;
  state: string;
  city?: string;
  ip?: string;
}

export class GeolocationService {
  /**
   * Get user's geolocation data from IP address
   * Uses multiple fallback APIs for reliability
   */
  static async getUserLocation(): Promise<GeolocationData> {
    // Try multiple APIs in sequence
    const apis = [
      // API 1: ipapi.co (free, no key required, 30 req/min)
      async () => {
        const response = await fetch('https://ipapi.co/json/', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error('ipapi.co failed');
        const data = await response.json();
        if (data.error) throw new Error(data.reason || 'Rate limit exceeded');
        return {
          country: data.country_name || 'Unknown',
          state: data.region || 'Unknown',
          city: data.city || undefined,
          ip: data.ip || undefined,
        };
      },
      
      // API 2: ip-api.com (free, no key required, 45 req/min)
      async () => {
        const response = await fetch('http://ip-api.com/json/', {
          method: 'GET',
        });
        if (!response.ok) throw new Error('ip-api.com failed');
        const data = await response.json();
        if (data.status === 'fail') throw new Error(data.message || 'Failed');
        return {
          country: data.country || 'Unknown',
          state: data.regionName || 'Unknown',
          city: data.city || undefined,
          ip: data.query || undefined,
        };
      },
      
      // API 3: ipwhois.app (free, no key required, good for international)
      async () => {
        const response = await fetch('https://ipwhois.app/json/', {
          method: 'GET',
        });
        if (!response.ok) throw new Error('ipwhois.app failed');
        const data = await response.json();
        if (!data.success) throw new Error('Failed');
        return {
          country: data.country || 'Unknown',
          state: data.region || 'Unknown',
          city: data.city || undefined,
          ip: data.ip || undefined,
        };
      },
      
      // API 4: ipify + ipapi (two-step, very reliable)
      async () => {
        // First get IP
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (!ipResponse.ok) throw new Error('ipify failed');
        const ipData = await ipResponse.json();
        const ip = ipData.ip;
        
        // Then get location
        const locResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        if (!locResponse.ok) throw new Error('ipapi failed');
        const locData = await locResponse.json();
        if (locData.error) throw new Error('Rate limit');
        
        return {
          country: locData.country_name || 'Unknown',
          state: locData.region || 'Unknown',
          city: locData.city || undefined,
          ip: ip,
        };
      },
    ];

    // Try each API in sequence
    for (let i = 0; i < apis.length; i++) {
      try {
        console.log(`Trying geolocation API ${i + 1}...`);
        const result = await apis[i]();
        console.log(`Geolocation success with API ${i + 1}:`, result.country);
        return result;
      } catch (error) {
        console.warn(`Geolocation API ${i + 1} failed:`, error);
        // Continue to next API
      }
    }

    // All APIs failed, use timezone-based fallback
    console.warn('All geolocation APIs failed, using timezone fallback');
    return this.getLocationFromTimezone();
  }

  /**
   * Fallback: Estimate location from timezone
   */
  private static getLocationFromTimezone(): GeolocationData {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Comprehensive timezone to country mapping
      const timezoneMap: Record<string, { country: string; state: string }> = {
        // North America - United States
        'America/New_York': { country: 'United States', state: 'New York' },
        'America/Chicago': { country: 'United States', state: 'Illinois' },
        'America/Los_Angeles': { country: 'United States', state: 'California' },
        'America/Denver': { country: 'United States', state: 'Colorado' },
        'America/Phoenix': { country: 'United States', state: 'Arizona' },
        'America/Anchorage': { country: 'United States', state: 'Alaska' },
        'Pacific/Honolulu': { country: 'United States', state: 'Hawaii' },
        'America/Detroit': { country: 'United States', state: 'Michigan' },
        'America/Indianapolis': { country: 'United States', state: 'Indiana' },
        'America/Kentucky/Louisville': { country: 'United States', state: 'Kentucky' },
        
        // North America - Canada
        'America/Toronto': { country: 'Canada', state: 'Ontario' },
        'America/Vancouver': { country: 'Canada', state: 'British Columbia' },
        'America/Edmonton': { country: 'Canada', state: 'Alberta' },
        'America/Winnipeg': { country: 'Canada', state: 'Manitoba' },
        'America/Halifax': { country: 'Canada', state: 'Nova Scotia' },
        'America/St_Johns': { country: 'Canada', state: 'Newfoundland' },
        'America/Montreal': { country: 'Canada', state: 'Quebec' },
        
        // North America - Mexico
        'America/Mexico_City': { country: 'Mexico', state: 'Mexico City' },
        'America/Cancun': { country: 'Mexico', state: 'Quintana Roo' },
        'America/Tijuana': { country: 'Mexico', state: 'Baja California' },
        
        // Europe - Western
        'Europe/London': { country: 'United Kingdom', state: 'England' },
        'Europe/Dublin': { country: 'Ireland', state: 'Dublin' },
        'Europe/Paris': { country: 'France', state: 'Île-de-France' },
        'Europe/Madrid': { country: 'Spain', state: 'Madrid' },
        'Europe/Lisbon': { country: 'Portugal', state: 'Lisbon' },
        'Europe/Amsterdam': { country: 'Netherlands', state: 'North Holland' },
        'Europe/Brussels': { country: 'Belgium', state: 'Brussels' },
        'Europe/Luxembourg': { country: 'Luxembourg', state: 'Luxembourg' },
        
        // Europe - Central
        'Europe/Berlin': { country: 'Germany', state: 'Berlin' },
        'Europe/Vienna': { country: 'Austria', state: 'Vienna' },
        'Europe/Zurich': { country: 'Switzerland', state: 'Zurich' },
        'Europe/Rome': { country: 'Italy', state: 'Lazio' },
        'Europe/Prague': { country: 'Czech Republic', state: 'Prague' },
        'Europe/Warsaw': { country: 'Poland', state: 'Masovian' },
        'Europe/Budapest': { country: 'Hungary', state: 'Budapest' },
        
        // Europe - Northern
        'Europe/Stockholm': { country: 'Sweden', state: 'Stockholm' },
        'Europe/Oslo': { country: 'Norway', state: 'Oslo' },
        'Europe/Copenhagen': { country: 'Denmark', state: 'Copenhagen' },
        'Europe/Helsinki': { country: 'Finland', state: 'Helsinki' },
        'Atlantic/Reykjavik': { country: 'Iceland', state: 'Reykjavik' },
        
        // Europe - Eastern
        'Europe/Moscow': { country: 'Russia', state: 'Moscow' },
        'Europe/Kiev': { country: 'Ukraine', state: 'Kyiv' },
        'Europe/Bucharest': { country: 'Romania', state: 'Bucharest' },
        'Europe/Athens': { country: 'Greece', state: 'Attica' },
        'Europe/Istanbul': { country: 'Turkey', state: 'Istanbul' },
        
        // Asia - East
        'Asia/Tokyo': { country: 'Japan', state: 'Tokyo' },
        'Asia/Seoul': { country: 'South Korea', state: 'Seoul' },
        'Asia/Shanghai': { country: 'China', state: 'Shanghai' },
        'Asia/Hong_Kong': { country: 'Hong Kong', state: 'Hong Kong' },
        'Asia/Taipei': { country: 'Taiwan', state: 'Taipei' },
        'Asia/Manila': { country: 'Philippines', state: 'Manila' },
        
        // Asia - Southeast
        'Asia/Singapore': { country: 'Singapore', state: 'Singapore' },
        'Asia/Bangkok': { country: 'Thailand', state: 'Bangkok' },
        'Asia/Jakarta': { country: 'Indonesia', state: 'Jakarta' },
        'Asia/Kuala_Lumpur': { country: 'Malaysia', state: 'Kuala Lumpur' },
        'Asia/Ho_Chi_Minh': { country: 'Vietnam', state: 'Ho Chi Minh City' },
        
        // Asia - South
        'Asia/Kolkata': { country: 'India', state: 'Delhi' },
        'Asia/Dubai': { country: 'United Arab Emirates', state: 'Dubai' },
        'Asia/Karachi': { country: 'Pakistan', state: 'Sindh' },
        'Asia/Dhaka': { country: 'Bangladesh', state: 'Dhaka' },
        'Asia/Colombo': { country: 'Sri Lanka', state: 'Western' },
        
        // Middle East
        'Asia/Riyadh': { country: 'Saudi Arabia', state: 'Riyadh' },
        'Asia/Jerusalem': { country: 'Israel', state: 'Jerusalem' },
        'Asia/Tehran': { country: 'Iran', state: 'Tehran' },
        'Asia/Baghdad': { country: 'Iraq', state: 'Baghdad' },
        
        // Oceania
        'Australia/Sydney': { country: 'Australia', state: 'New South Wales' },
        'Australia/Melbourne': { country: 'Australia', state: 'Victoria' },
        'Australia/Brisbane': { country: 'Australia', state: 'Queensland' },
        'Australia/Perth': { country: 'Australia', state: 'Western Australia' },
        'Pacific/Auckland': { country: 'New Zealand', state: 'Auckland' },
        'Pacific/Fiji': { country: 'Fiji', state: 'Central' },
        
        // Africa
        'Africa/Cairo': { country: 'Egypt', state: 'Cairo' },
        'Africa/Lagos': { country: 'Nigeria', state: 'Lagos' },
        'Africa/Johannesburg': { country: 'South Africa', state: 'Gauteng' },
        'Africa/Nairobi': { country: 'Kenya', state: 'Nairobi' },
        'Africa/Casablanca': { country: 'Morocco', state: 'Casablanca' },
        'Africa/Algiers': { country: 'Algeria', state: 'Algiers' },
        'Africa/Accra': { country: 'Ghana', state: 'Greater Accra' },
        'Africa/Addis_Ababa': { country: 'Ethiopia', state: 'Addis Ababa' },
        
        // South America
        'America/Sao_Paulo': { country: 'Brazil', state: 'São Paulo' },
        'America/Buenos_Aires': { country: 'Argentina', state: 'Buenos Aires' },
        'America/Santiago': { country: 'Chile', state: 'Santiago' },
        'America/Lima': { country: 'Peru', state: 'Lima' },
        'America/Bogota': { country: 'Colombia', state: 'Bogotá' },
        'America/Caracas': { country: 'Venezuela', state: 'Caracas' },
        
        // Central America & Caribbean
        'America/Panama': { country: 'Panama', state: 'Panama' },
        'America/Costa_Rica': { country: 'Costa Rica', state: 'San José' },
        'America/Guatemala': { country: 'Guatemala', state: 'Guatemala' },
        'America/Havana': { country: 'Cuba', state: 'Havana' },
        'America/Jamaica': { country: 'Jamaica', state: 'Kingston' },
      };

      const location = timezoneMap[timezone];
      if (location) {
        return {
          country: location.country,
          state: location.state,
        };
      }

      // Extract region from timezone for unmapped timezones
      const parts = timezone.split('/');
      const region = parts[0];
      const city = parts[parts.length - 1]?.replace(/_/g, ' ');
      
      // Map regions to general areas
      const regionMap: Record<string, string> = {
        'America': 'Americas',
        'Europe': 'Europe',
        'Asia': 'Asia',
        'Africa': 'Africa',
        'Pacific': 'Pacific',
        'Atlantic': 'Atlantic',
        'Indian': 'Indian Ocean',
        'Antarctica': 'Antarctica',
      };

      return {
        country: regionMap[region] || region || 'Unknown',
        state: city || 'Unknown',
      };
    } catch (error) {
      return {
        country: 'Unknown',
        state: 'Unknown',
      };
    }
  }

  /**
   * Get user's timezone
   */
  static getUserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Get user's browser language
   */
  static getUserLanguage(): string {
    try {
      return navigator.language || 'en-US';
    } catch (error) {
      return 'en-US';
    }
  }
}
