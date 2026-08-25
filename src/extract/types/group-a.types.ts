export interface GroupA {
  title: string | null;

  price: number | null;
  currency: string | null;

  propertyType: string | null;
  purpose: string | null;

  bedrooms: number | null;
  bathrooms: number | null;

  areaSqm: number | null;
  location: string | null;

  latitude: number | null;
  longitude: number | null;

  sourceUrl: string | null;

  // Existing derived fields
  pricePerSqm: number | null;
  totalInstallmentCost: number | null;

  pricePeriod: string | null;
  agencyName: string | null;
  isVerified: boolean | null;
  dateListed: string | null;

  language: string | null;

  governorate: string | null;
  city: string | null;
  district: string | null;
}