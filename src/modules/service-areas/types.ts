export interface ServiceAreaDTO {
  id: string;
  name: string;
  slug: string;
  city: string;
  pinCode: string;
  displayOrder: number;
  isActive: boolean;
  serviceCount?: number;
}
