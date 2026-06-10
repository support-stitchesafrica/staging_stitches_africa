/* eslint-disable @typescript-eslint/no-explicit-any */
// DHL Shipping Service for Next.js
export interface ShippingTier {
  tierKey: string;
  minWeight: number;
  maxWeight: number;
  width: number;
  length: number;
  height: number;
  description: string;
}

export interface PackageDimensions {
  width: number;
  length: number;
  height: number;
}

export interface ShippingAddress {
  streetAddress: string;
  postcode: string;
  city: string;
  state: string;
  countryCode: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}


export interface ShippingRate {
  deliveryDate: string;
  amount: number;
  courierName: string;
  packageWeight: number;
  packageDimensions: PackageDimensions;
  currency?: string; // Optional: 'USD', 'NGN', etc. Defaults to 'USD' if not specified
  // Metadata for order creation
  dhlData?: {
    plannedShippingDate?: string;
    productCode?: string;
  };
}

export interface CartItemForShipping {
  weight?: number;
  dimensions?: {
    width?: number;
    length?: number;
    height?: number;
  };
  price: number;
  quantity: number;
}

export class ShippingTierUtility {
  // Define shipping tiers based on weight ranges
  static readonly shippingTiers: ShippingTier[] = [
    {
      tierKey: 'small',
      minWeight: 0.1,
      maxWeight: 1.0,
      width: 25,
      length: 20,
      height: 5,
      description: 'Light items such as scarves, accessories, small tops, fabric samples, or light native shirts.',
    },
    {
      tierKey: 'medium',
      minWeight: 1.1,
      maxWeight: 2.5,
      width: 35,
      length: 30,
      height: 8,
      description: 'One-piece dresses, blouses, standard ready-to-wear outfits, or light bespoke clothing.',
    },
    {
      tierKey: 'large',
      minWeight: 2.6,
      maxWeight: 5.0,
      width: 45,
      length: 40,
      height: 10,
      description: 'Two-piece sets, heavier materials, or double-fabric orders.',
    },
    {
      tierKey: 'xl',
      minWeight: 5.1,
      maxWeight: 8.0,
      width: 55,
      length: 45,
      height: 15,
      description: 'Thick fabric outfits, traditional attires, or bulkier ready-to-wear bundles.',
    },
    {
      tierKey: 'xxl',
      minWeight: 8.1,
      maxWeight: 12.0,
      width: 65,
      length: 55,
      height: 20,
      description: 'Bulk fabric orders, multi-item shipments, or high-volume bespoke deliveries.',
    },
  ];

  static getShippingTierByWeight(weight?: number): ShippingTier {
    if (!weight || weight <= 0) {
      return this.getDefaultTier();
    }

    // Add 0.5kg buffer to the weight
    const adjustedWeight = weight + 0.5;

    for (const tier of this.shippingTiers) {
      if (adjustedWeight >= tier.minWeight && adjustedWeight <= tier.maxWeight) {
        return tier;
      }
    }

    // If weight exceeds all tiers, return the largest tier
    return this.shippingTiers[this.shippingTiers.length - 1];
  }

  static getDefaultTier(): ShippingTier {
    return this.shippingTiers.find(tier => tier.tierKey === 'medium')!;
  }

  static getShippingTierByKey(tierKey?: string): ShippingTier | null {
    if (!tierKey) return null;
    return this.shippingTiers.find(tier => tier.tierKey === tierKey) || null;
  }

  static getPackageDimensions({
    weight,
    width,
    length,
    height,
    tierKey,
  }: {
    weight?: number;
    width?: number;
    length?: number;
    height?: number;
    tierKey?: string;
  }): PackageDimensions {
    // If manual override dimensions are provided, use them
    if (width && length && height) {
      return {
        width: Math.round(width),
        length: Math.round(length),
        height: Math.round(height),
      };
    }

    // If tier key is provided, use that tier's dimensions
    if (tierKey) {
      const tier = this.getShippingTierByKey(tierKey);
      if (tier) {
        return {
          width: tier.width,
          length: tier.length,
          height: tier.height,
        };
      }
    }

    // Fallback to weight-based tier
    const tier = this.getShippingTierByWeight(weight);
    return {
      width: tier.width,
      length: tier.length,
      height: tier.height,
    };
  }

  static getPackageWeight(actualWeight?: number): number {
    const baseWeight = actualWeight || 0.0;

    // If weight is 0 or null, use the maximum weight from the Medium tier
    if (baseWeight <= 0) {
      return this.getDefaultTier().maxWeight; // Use max weight from Medium tier (2.5kg)
    }

    return baseWeight;
  }
}

export class DHLShippingService {
  // Get JWT token from Firebase Auth
  private static async getAuthToken(): Promise<string> {
    try {
      const { loadModuleWithRetry } = await import('../utils/module-helpers');
      // Direct import for local module to bypass list of supported modules in helper
      const firebaseModule = await import('../firebase');
      const auth = await firebaseModule.getFirebaseAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get the Firebase ID token (JWT)
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Failed to get authentication token');
    }
  }

  // Call Firebase Cloud Function for DHL Export Package Rate
  private static async getDhlExportPackageRate(payload: {
    plannedShippingDateAndTime: string;
    receiverDetails: any;
    packages: any[];
    accessToken?: string;
  }): Promise<any> {
    try {
      const { loadFirebaseModule } = await import('../utils/module-helpers');
      const functionsModule = await loadFirebaseModule('firebase/functions', 'dhl_functions');
      // Direct import for local module to bypass list of supported modules in helper
      const firebaseModule = await import('../firebase');
      const functions = await firebaseModule.getFirebaseFunctions();
      
      if (!functions) {
        throw new Error('Firebase Functions service is not available. Cannot calculate DHL export rates.');
      }
      
      const getDhlExportRate = functionsModule.httpsCallable(functions, 'getDhlExportPackageRate');
      const result = await getDhlExportRate(payload);
      
      return result.data;
    } catch (error) {
      console.error('Error calling getDhlExportPackageRate:', error);
      throw error;
    }
  }

  // Call Firebase Cloud Function for DHL Domestic Rate
  private static async getDhlDomesticRate(payload: {
    plannedShippingDateAndTime: string;
    receiverDetails: any;
    packages: any[];
    accessToken?: string;
  }): Promise<any> {
    try {
      const response = await fetch('/api/shipping/dhl-domestic-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? `DHL rate request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error calling getDhlDomesticRate:', error);
      throw error;
    }
  }

  // Format shipping date for DHL API
  private static formatShippingDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString();
  }

  static calculateCombinedPackageData(items: CartItemForShipping[]): {
    weight: number;
    dimensions: PackageDimensions;
    actualWeight: number;
    volumetricWeight: number;
  } {
    let totalWeight = 0.0;
    let maxWidth = 0;
    let maxLength = 0;
    let totalHeight = 0;

    console.log('=== COMBINING MULTIPLE ITEMS ===');
    console.log('Number of items:', items.length);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const weight = item.weight || 0.0;
      const dimensions = item.dimensions || {};
      const width = dimensions.width || 0;
      const length = dimensions.length || 0;
      const height = dimensions.height || 0;

      totalWeight += weight * item.quantity;
      maxWidth = Math.max(maxWidth, width);
      maxLength = Math.max(maxLength, length);
      totalHeight += height * item.quantity;

      console.log(`Item ${i + 1}: ${weight}kg, ${width}x${length}x${height}cm, qty: ${item.quantity}`);
    }

    // Calculate volumetric weight: (L × W × H) / 5000
    const volumetricWeight = (maxLength * maxWidth * totalHeight) / 5000;

    // Use the higher of actual weight or volumetric weight
    const billableWeight = Math.max(totalWeight, volumetricWeight);

    const combinedDimensions = {
      width: maxWidth,
      length: maxLength,
      height: totalHeight,
    };

    console.log('=== COMBINED PACKAGE CALCULATION ===');
    console.log('Total Actual Weight:', totalWeight + 'kg');
    console.log('Combined Dimensions:', `${maxWidth}x${maxLength}x${totalHeight}cm`);
    console.log('Volumetric Weight:', volumetricWeight + 'kg');
    console.log('Billable Weight:', billableWeight + 'kg', `(${totalWeight > volumetricWeight ? 'actual' : 'volumetric'})`);
    console.log('=====================================');

    return {
      weight: billableWeight,
      dimensions: combinedDimensions,
      actualWeight: totalWeight,
      volumetricWeight: volumetricWeight,
    };
  }

 static async getShippingRate({
  address,
  weight,
  width,
  length,
  height,
  tierKey,
  multipleItems,
}: {
  address: ShippingAddress;
  weight?: number;
  width?: number;
  length?: number;
  height?: number;
  tierKey?: string;
  multipleItems?: CartItemForShipping[];
}): Promise<ShippingRate | null> {
  try {
    // 1. Calculate Standard Variables (Dimensions, Weight, Item Count)
    let totalItemCount = 1; // Default for single item
    
    if (multipleItems && multipleItems.length > 0) {
      totalItemCount = multipleItems.reduce((total, item) => total + item.quantity, 0);
      console.log('=== MULTIPLE ITEMS SHIPPING ===');
      console.log(`Total items: ${totalItemCount}`);
    }

    // 2. Define Fallback Fixed Rate (Base logic)
    // Fixed shipping rate: flat $30 for the whole order (not per item)
    const fixedShippingAmount = 30;

    // 3. Prepare Package Data (Needed for both Fixed and Dynamic)
    let packageDimensions: PackageDimensions;
    let packageWeight: number;

    if (multipleItems && multipleItems.length > 0) {
      const combinedData = this.calculateCombinedPackageData(multipleItems);
      packageWeight = combinedData.weight;
      packageDimensions = combinedData.dimensions;
    } else {
      packageDimensions = ShippingTierUtility.getPackageDimensions({
        weight,
        width,
        length,
        height,
        tierKey,
      });
      packageWeight = ShippingTierUtility.getPackageWeight(weight);
    }

    // 4. Logic: Domestic (Nigeria) Check - Use comprehensive detection
    const isNigerianAddress = address.countryCode?.toUpperCase() === 'NG' || 
                               address.countryCode?.toUpperCase() === 'NGA';
    
    if (isNigerianAddress) {
        console.log('=== DOMESTIC SHIPMENT DETECTED (NG) - ATTEMPTING DYNAMIC RATE ===');
        console.log('Address countryCode:', address.countryCode);
        try {
            // Attempt to get Auth Token (optional, don't fail if missing)
            let accessToken: string | undefined;
            try {
                accessToken = await this.getAuthToken();
            } catch (e) {
                console.warn('Proceeding without auth token for rate calculation', e);
            }

            // Calculate a safe planned shipping date (tomorrow) to avoid "past date" errors
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Ensure it's a weekday if needed (optional, but simply adding 24h is usually enough for "planned")
            
            // Construct Payload in DHL API format
            // All 5 required receiverDetails fields must be non-empty: addressLine1, cityName, countyName, postalCode, countryCode
            const safeCity = address.city || 'Lagos';
            const safeState = address.state || safeCity;
            const safePostcode = address.postcode || '100001';
            const safeStreet = address.streetAddress || safeCity;

            // Format date as DHL expects: YYYY-MM-DDTHH:mm:ss GMT+01:00
            const tomorrowFormatted = (() => {
                const d = tomorrow;
                const pad = (n: number) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} GMT+01:00`;
            })();

            const payload: any = {
                plannedShippingDateAndTime: tomorrowFormatted,
                receiverDetails: {
                    addressLine1: safeStreet,
                    addressLine2: `${safeCity}, ${safeState}`,
                    addressLine3: safePostcode,
                    postalCode: safePostcode,
                    cityName: safeCity,
                    countyName: safeState,
                    countryCode: 'NG',
                },
                packages: [{
                    weight: Math.ceil(packageWeight),
                    dimensions: {
                        length: Math.round(packageDimensions.length),
                        width: Math.round(packageDimensions.width),
                        height: Math.round(packageDimensions.height),
                    },
                }],
                accessToken,
            };

            
            
            const dhlResult = await this.getDhlDomesticRate(payload);
            

            // Extract Price matching Flutter's DomesticRateResponseModel logic
            // Flutter: response['products'][0]['totalPrice'][0]['price']
            let dynamicAmount = 0;
                 let finalDeliveryDate = '';
                 let productCode = '';

                 if (dhlResult && dhlResult.products && Array.isArray(dhlResult.products) && dhlResult.products.length > 0) {
                     const product = dhlResult.products[0];
                     
                     // Get price
                     if (product.totalPrice && Array.isArray(product.totalPrice) && product.totalPrice.length > 0) {
                         dynamicAmount = Number(product.totalPrice[0].price);
                     }
                     
                     // Get estimated delivery date
                     if (product.deliveryCapabilities && product.deliveryCapabilities.estimatedDeliveryDateAndTime) {
                         finalDeliveryDate = product.deliveryCapabilities.estimatedDeliveryDateAndTime;
                     }

                     // Get product code
                     if (product.productCode) {
                         productCode = product.productCode;
                     } else if (product.globalProductCode) {
                         productCode = product.globalProductCode;
                     }
                 } else {
                     console.warn('DHL Response structure did not match expected Flutter model format:', dhlResult);
                 }

                 if (dynamicAmount > 0) {
                     // Domestic rate is already in NGN - no conversion needed
                     console.log(`✅ Using Dynamic DHL Rate (NGN): ${dynamicAmount}`);
                     
                     return {
                        deliveryDate: finalDeliveryDate,
                        amount: dynamicAmount,
                        currency: 'NGN',
                        courierName: 'DHL Domestic Express',
                        packageWeight,
                        packageDimensions,
                        dhlData: {
                          plannedShippingDate: tomorrow.toISOString(),
                          productCode
                        }
                     };
            } else {
                console.warn('DHL Rate returned 0 or invalid format, using domestic fallback.');
                const domesticFallbackNGN = 5700 * totalItemCount;
                return {
                    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    amount: domesticFallbackNGN,
                    courierName: 'DHL Domestic Fixed Rate',
                    packageWeight,
                    packageDimensions,
                    currency: 'NGN'
                };
            }

        } catch (dhlError) {
            console.warn('DHL Domestic Rate unavailable (backend credentials issue), using fallback rate');
            console.log('Falling back to domestic fixed rate (₦5,700)...');
            
            // Domestic fallback: ₦5,700 per item
            const domesticFallbackNGN = 5700 * totalItemCount;
            
            
            return {
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                amount: domesticFallbackNGN,
                courierName: 'DHL Domestic Fixed Rate',
                packageWeight,
                packageDimensions,
                currency: 'NGN'
            };
        }
    }

    // 5. International: attempt getDhlExportPackageRate, fallback to fixed $30
    console.log('=== INTERNATIONAL SHIPMENT - ATTEMPTING DHL EXPORT RATE ===');
    try {
      let accessToken: string | undefined;
      try {
        accessToken = await this.getAuthToken();
      } catch (e) {
        console.warn('Proceeding without auth token for export rate calculation', e);
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const exportPayload: any = {
        plannedShippingDateAndTime: tomorrow.toISOString(),
        dataModel: 'REGULAR',
        customerDetails: {
          shipperDetails: {
            addressLine1: '10/11 Olubunmi Owa Street, off Admiralty Way',
            addressLine2: 'Lekki Phase 1',
            addressLine3: 'Lekki',
            postalCode: '100001',
            cityName: 'Lagos',
            countyName: 'Lagos',
            countryCode: 'NG',
          },
          receiverDetails: {
            addressLine1: address.streetAddress,
            addressLine2: `${address.city}, ${address.state || address.city}`,
            addressLine3: address.postcode || 'N/A',
            postalCode: address.postcode || '',
            cityName: address.city,
            countyName: address.state || address.city,
            countryCode: address.countryCode.toUpperCase(),
          },
        },
        packages: [{
          weight: Math.ceil(packageWeight),
          dimensions: {
            length: Math.round(packageDimensions.length),
            width: Math.round(packageDimensions.width),
            height: Math.round(packageDimensions.height),
          },
        }],
        accessToken,
      };

      const exportResult = await this.getDhlExportPackageRate(exportPayload);

      let dynamicAmount = 0;
      let finalDeliveryDate = '';
      let productCode = '';

      if (exportResult?.products && Array.isArray(exportResult.products) && exportResult.products.length > 0) {
        const product = exportResult.products[0];
        if (product.totalPrice && Array.isArray(product.totalPrice) && product.totalPrice.length > 0) {
          dynamicAmount = Number(product.totalPrice[0].price);
        }
        if (product.deliveryCapabilities?.estimatedDeliveryDateAndTime) {
          finalDeliveryDate = product.deliveryCapabilities.estimatedDeliveryDateAndTime;
        }
        productCode = product.productCode || product.globalProductCode || '';
      }

      if (dynamicAmount > 0) {
        console.log(`✅ DHL Export Rate (USD): ${dynamicAmount}`);
        return {
          deliveryDate: finalDeliveryDate,
          amount: dynamicAmount,
          courierName: 'DHL International Express',
          packageWeight,
          packageDimensions,
          dhlData: {
            plannedShippingDate: tomorrow.toISOString(),
            productCode,
          },
        };
      }

      console.warn('DHL Export Rate returned 0, falling back to fixed rate.');
    } catch (exportError) {
      console.error('❌ Failed to get DHL Export Rate:', exportError);
      console.log('Falling back to fixed international rate ($30)...');
    }

    // Return fixed rate fallback
    return {
      deliveryDate: '',
      amount: fixedShippingAmount,
      courierName: 'DHL Fixed Rate',
      packageWeight,
      packageDimensions,
    };
  } catch (error) {
    

    // Ultimate Fallback
    const fallbackAmount = 30;

    return {
      deliveryDate: '',
      amount: fallbackAmount,
      courierName: 'DHL Fixed Rate',
      packageWeight: weight || 1,
      packageDimensions: {
        width: width || 30,
        length: length || 30,
        height: height || 10,
      },
    };
  }
}


  // Country code mapping
  static getCountryCode(countryName: string): string {
    const countryCodes: Record<string, string> = {
      "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD", "Angola": "AO",
      "Antigua and Barbuda": "AG", "Argentina": "AR", "Armenia": "AM", "Australia": "AU",
      "Austria": "AT", "Azerbaijan": "AZ", "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD",
      "Barbados": "BB", "Belarus": "BY", "Belgium": "BE", "Belize": "BZ", "Benin": "BJ",
      "Bhutan": "BT", "Bolivia": "BO", "Bosnia and Herzegovina": "BA", "Botswana": "BW",
      "Brazil": "BR", "Brunei": "BN", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI",
      "Cambodia": "KH", "Cameroon": "CM", "Canada": "CA", "Cape Verde": "CV",
      "Central African Republic": "CF", "Chad": "TD", "Chile": "CL", "China": "CN",
      "Colombia": "CO", "Comoros": "KM", "Congo": "CG", "Congo (Democratic Republic)": "CD",
      "Costa Rica": "CR", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY", "Czech Republic": "CZ",
      "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM", "Dominican Republic": "DO",
      "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ",
      "Eritrea": "ER", "Estonia": "EE", "Eswatini": "SZ", "Ethiopia": "ET", "Fiji": "FJ",
      "Finland": "FI", "France": "FR", "Gabon": "GA", "Gambia": "GM", "Georgia": "GE",
      "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Grenada": "GD", "Guatemala": "GT",
      "Guinea": "GN", "Guinea-Bissau": "GW", "Guyana": "GY", "Haiti": "HT", "Honduras": "HN",
      "Hungary": "HU", "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR",
      "Iraq": "IQ", "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Jamaica": "JM",
      "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE", "Kiribati": "KI",
      "Kuwait": "KW", "Kyrgyzstan": "KG", "Laos": "LA", "Latvia": "LV", "Lebanon": "LB",
      "Lesotho": "LS", "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI", "Lithuania": "LT",
      "Luxembourg": "LU", "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY", "Maldives": "MV",
      "Mali": "ML", "Malta": "MT", "Marshall Islands": "MH", "Mauritania": "MR",
      "Mauritius": "MU", "Mexico": "MX", "Micronesia": "FM", "Moldova": "MD", "Monaco": "MC",
      "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ",
      "Myanmar (Burma)": "MM", "Namibia": "NA", "Nauru": "NR", "Nepal": "NP",
      "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI", "Niger": "NE",
      "Nigeria": "NG", "North Korea": "KP", "North Macedonia": "MK", "Norway": "NO",
      "Oman": "OM", "Pakistan": "PK", "Palau": "PW", "Palestine": "PS", "Panama": "PA",
      "Papua New Guinea": "PG", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH",
      "Poland": "PL", "Portugal": "PT", "Qatar": "QA", "Romania": "RO", "Russia": "RU",
      "Rwanda": "RW", "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC",
      "Saint Vincent and the Grenadines": "VC", "Samoa": "WS", "San Marino": "SM",
      "Sao Tome and Principe": "ST", "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS",
      "Seychelles": "SC", "Sierra Leone": "SL", "Singapore": "SG", "Slovakia": "SK",
      "Slovenia": "SI", "Solomon Islands": "SB", "Somalia": "SO", "South Africa": "ZA",
      "South Korea": "KR", "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK",
      "Sudan": "SD", "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Syria": "SY",
      "Taiwan": "TW", "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH",
      "Timor-Leste": "TL", "Togo": "TG", "Tonga": "TO", "Trinidad and Tobago": "TT",
      "Tunisia": "TN", "Turkey": "TR", "Turkmenistan": "TM", "Tuvalu": "TV", "Uganda": "UG",
      "Ukraine": "UA", "United Arab Emirates": "AE", "United Kingdom": "GB",
      "United States": "US", "Uruguay": "UY", "Uzbekistan": "UZ", "Vanuatu": "VU",
      "Vatican City": "VA", "Venezuela": "VE", "Vietnam": "VN", "Yemen": "YE",
      "Zambia": "ZM", "Zimbabwe": "ZW"
    };

    return countryCodes[countryName.trim()] || "US";
  }
}