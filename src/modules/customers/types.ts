import type { AuthenticatedUser } from "@/modules/auth/types";

export interface CustomerProfileDTO {
  preferredLanguage?: string;
  defaultAddressId?: string | null;
  notes?: string | null;
}

export interface CustomerWithProfileDTO {
  user: AuthenticatedUser;
  profile: CustomerProfileDTO;
  linkedGoogle: boolean;
}

export interface UpdateCustomerProfileInput {
  fullName?: string;
  preferredLanguage?: string;
  notes?: string;
}
