export type PricingModel = "FLAT" | "BASE_PLUS_HOURLY" | "INSPECTION_FIRST";

export interface ServiceCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  serviceCount?: number;
}

export interface ServiceAreaSummaryDTO {
  id: string;
  name: string;
  slug: string;
  pinCode: string;
}

export interface ServiceDTO {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  included: string[];
  excluded: string[];
  conditions: string[];
  pricingModel: PricingModel;
  basePrice: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  category?: ServiceCategoryDTO;
  serviceAreas?: ServiceAreaSummaryDTO[];
}

export interface ServiceFilters {
  query?: string;
  category?: string;
  locality?: string;
}
