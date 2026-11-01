import "server-only";
import { getAuthRepository, type IAuthRepository } from "@/modules/auth/store";
import type { CustomerWithProfileDTO, UpdateCustomerProfileInput } from "./types";

export class CustomerService {
  async getCustomerDetails(
    userId: string,
    repo?: IAuthRepository
  ): Promise<CustomerWithProfileDTO | null> {
    const r = repo ?? (await getAuthRepository());
    const user = await r.findUserById(userId);
    if (!user) return null;

    const profile = (await r.getCustomerProfile(userId)) ?? {
      preferredLanguage: "en",
    };

    const oauth = await r.findOAuthAccount("google", user.id);

    return {
      user,
      profile,
      linkedGoogle: !!oauth,
    };
  }

  async updateCustomer(
    userId: string,
    input: UpdateCustomerProfileInput,
    repo?: IAuthRepository
  ): Promise<CustomerWithProfileDTO | null> {
    const r = repo ?? (await getAuthRepository());
    let user = await r.findUserById(userId);
    if (!user) return null;

    if (input.fullName !== undefined) {
      user = await r.updateUser(userId, { fullName: input.fullName });
    }

    const updatedProfile = await r.updateCustomerProfile(userId, {
      preferredLanguage: input.preferredLanguage,
      notes: input.notes,
    });

    const oauth = await r.findOAuthAccount("google", user.id);

    return {
      user,
      profile: updatedProfile,
      linkedGoogle: !!oauth,
    };
  }
}

export const customerService = new CustomerService();
