import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

export interface CountryStats {
  country: string;
  count: number;
}

export interface RegionStats {
  region: string;
  count: number;
}

export interface CityStats {
  city: string;
  count: number;
}

export interface PageViewStats {
  totalViews: number;
  countries: CountryStats[];
  regions: RegionStats[];
  cities: CityStats[];
}

/**
 * Fetch total page views and breakdown by country, region, and city
 */
export async function getPageViewStats(): Promise<PageViewStats> {
  const pageViewsRef = collection(db, "pageViews");
  const snapshot = await getDocs(pageViewsRef);

  const totalViews = snapshot.size;

  const countryMap: Record<string, number> = {};
  const regionMap: Record<string, number> = {};
  const cityMap: Record<string, number> = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    const country = data.country || "Unknown";
    const region = data.region || "Unknown";
    const city = data.city || "Unknown";

    countryMap[country] = (countryMap[country] || 0) + 1;
    regionMap[region] = (regionMap[region] || 0) + 1;
    cityMap[city] = (cityMap[city] || 0) + 1;
  });

  const countries: CountryStats[] = Object.entries(countryMap).map(
    ([country, count]) => ({ country, count })
  );

  const regions: RegionStats[] = Object.entries(regionMap).map(
    ([region, count]) => ({ region, count })
  );

  const cities: CityStats[] = Object.entries(cityMap).map(
    ([city, count]) => ({ city, count })
  );

  return { totalViews, countries, regions, cities };
}
