export const EUROPE_COUNTRIES = [
  "GB",
  "UK",
  "FR",
  "DE",
  "IT",
  "ES",
  "NL",
  "BE",
  "SE",
  "NO",
  "DK",
  "FI",
  "IE",
  "PL",
  "PT",
  "CH",
  "AT",
];

export const isEuropeanOrder = (countryCode: string) => {
  return EUROPE_COUNTRIES.includes(countryCode.toUpperCase());
};