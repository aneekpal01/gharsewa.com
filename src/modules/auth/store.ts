import "server-only";
import { getDb, checkDatabaseConnection } from "@/lib/db";
import { isDevFallbackAllowed } from "@/lib/env";
import { DatabaseUnavailableError } from "@/lib/errors";
import type { PrismaClient } from "@prisma/client";
import type {
  AuthenticatedUser,
  SessionRecord,
  OtpChallengeRecord,
  RateLimitEventRecord,
  OAuthAccountRecord,
  UserRole,
} from "./types";

export interface CreateUserData {
  phone?: string | null;
  phoneVerified?: boolean;
  email?: string | null;
  emailVerified?: boolean;
  fullName?: string | null;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreateOtpChallengeData {
  phoneHash: string;
  otpHash: string;
  expiresAt: Date;
  maxAttempts?: number;
  ipAddress?: string | null;
}

export interface CreateOAuthAccountData {
  userId: string;
  provider: string;
  providerUserId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface CustomerProfileData {
  preferredLanguage?: string;
  defaultAddressId?: string | null;
  notes?: string | null;
}

export interface IAuthRepository {
  findUserById(id: string): Promise<AuthenticatedUser | null>;
  findUserByPhone(phone: string): Promise<AuthenticatedUser | null>;
  findUserByEmail(email: string): Promise<AuthenticatedUser | null>;
  createUser(data: CreateUserData): Promise<AuthenticatedUser>;
  updateUser(id: string, data: Partial<CreateUserData>): Promise<AuthenticatedUser>;

  createSession(data: CreateSessionData): Promise<SessionRecord>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  findRotatedSession(tokenHash: string, withinSeconds: number): Promise<SessionRecord | null>;
  rotateSession(
    oldTokenHash: string,
    newSessionData: CreateSessionData
  ): Promise<{ oldSession: SessionRecord; newSession: SessionRecord }>;
  updateSessionIdleExpiry(id: string, idleExpiresAt: Date): Promise<void>;
  revokeSession(tokenHash: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<number>;

  createOtpChallenge(data: CreateOtpChallengeData): Promise<OtpChallengeRecord>;
  getLatestOtpChallenge(phoneHash: string): Promise<OtpChallengeRecord | null>;
  incrementOtpAttempts(id: string): Promise<{ attempts: number; maxAttempts: number }>;
  markOtpChallengeUsed(id: string): Promise<void>;
  claimOtpChallenge(id: string): Promise<boolean>;

  recordRateLimitEvent(keyHash: string): Promise<void>;
  countRateLimitEvents(keyHash: string, windowStart: Date): Promise<number>;

  findOAuthAccount(provider: string, providerUserId: string): Promise<OAuthAccountRecord | null>;
  createOAuthAccount(data: CreateOAuthAccountData): Promise<OAuthAccountRecord>;

  ensureCustomerProfile(userId: string, data?: CustomerProfileData): Promise<void>;
  getCustomerProfile(userId: string): Promise<CustomerProfileData | null>;
  updateCustomerProfile(userId: string, data: CustomerProfileData): Promise<CustomerProfileData>;

  recordAuditLog(params: {
    userId?: string | null;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void>;
}

/**
 * PostgreSQL implementation backed by Prisma Client.
 */
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async findUserByPhone(phone: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) return null;
    return {
      id: user.id,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async findUserByEmail(email: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      id: user.id,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async createUser(data: CreateUserData): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.create({
      data: {
        phone: data.phone,
        phoneVerified: data.phoneVerified ?? false,
        email: data.email,
        emailVerified: data.emailVerified ?? false,
        fullName: data.fullName,
        role: data.role ?? "CUSTOMER",
        isActive: data.isActive ?? true,
      },
    });
    return {
      id: user.id,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async updateUser(id: string, data: Partial<CreateUserData>): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        phone: data.phone,
        phoneVerified: data.phoneVerified,
        email: data.email,
        emailVerified: data.emailVerified,
        fullName: data.fullName,
        role: data.role,
        isActive: data.isActive,
      },
    });
    return {
      id: user.id,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async createSession(data: CreateSessionData): Promise<SessionRecord> {
    const row = await this.prisma.session.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        idleExpiresAt: data.idleExpiresAt,
        absoluteExpiresAt: data.absoluteExpiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    return row;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    return this.prisma.session.findUnique({
      where: { tokenHash },
    });
  }

  async findRotatedSession(tokenHash: string, withinSeconds: number): Promise<SessionRecord | null> {
    const threshold = new Date(Date.now() - withinSeconds * 1000);
    const oldSession = await this.prisma.session.findFirst({
      where: {
        tokenHash,
        rotatedAt: { gte: threshold },
        replacedByHash: { not: null },
      },
    });

    if (!oldSession || !oldSession.replacedByHash) return null;

    return this.prisma.session.findUnique({
      where: { tokenHash: oldSession.replacedByHash },
    });
  }

  async rotateSession(
    oldTokenHash: string,
    newSessionData: CreateSessionData
  ): Promise<{ oldSession: SessionRecord; newSession: SessionRecord }> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedOld = await tx.session.update({
        where: { tokenHash: oldTokenHash },
        data: {
          rotatedAt: now,
          replacedByHash: newSessionData.tokenHash,
        },
      });

      const newSession = await tx.session.create({
        data: {
          userId: newSessionData.userId,
          tokenHash: newSessionData.tokenHash,
          idleExpiresAt: newSessionData.idleExpiresAt,
          absoluteExpiresAt: newSessionData.absoluteExpiresAt,
          ipAddress: newSessionData.ipAddress,
          userAgent: newSessionData.userAgent,
        },
      });

      return { oldSession: updatedOld, newSession };
    });
  }

  async updateSessionIdleExpiry(id: string, idleExpiresAt: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { idleExpiresAt },
    });
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async createOtpChallenge(data: CreateOtpChallengeData): Promise<OtpChallengeRecord> {
    return this.prisma.otpChallenge.create({
      data: {
        phoneHash: data.phoneHash,
        otpHash: data.otpHash,
        expiresAt: data.expiresAt,
        maxAttempts: data.maxAttempts ?? 3,
        ipAddress: data.ipAddress,
      },
    });
  }

  async getLatestOtpChallenge(phoneHash: string): Promise<OtpChallengeRecord | null> {
    return this.prisma.otpChallenge.findFirst({
      where: { phoneHash },
      orderBy: { createdAt: "desc" },
    });
  }

  async incrementOtpAttempts(id: string): Promise<{ attempts: number; maxAttempts: number }> {
    const updated = await this.prisma.otpChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
    return { attempts: updated.attempts, maxAttempts: updated.maxAttempts };
  }

  async markOtpChallengeUsed(id: string): Promise<void> {
    await this.prisma.otpChallenge.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async claimOtpChallenge(id: string): Promise<boolean> {
    const res = await this.prisma.otpChallenge.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return res.count > 0;
  }

  async recordRateLimitEvent(keyHash: string): Promise<void> {
    await this.prisma.rateLimitEvent.create({
      data: {
        keyHash,
        windowStart: new Date(),
      },
    });
  }

  async countRateLimitEvents(keyHash: string, windowStart: Date): Promise<number> {
    return this.prisma.rateLimitEvent.count({
      where: {
        keyHash,
        createdAt: { gte: windowStart },
      },
    });
  }

  async findOAuthAccount(provider: string, providerUserId: string): Promise<OAuthAccountRecord | null> {
    return this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
    });
  }

  async createOAuthAccount(data: CreateOAuthAccountData): Promise<OAuthAccountRecord> {
    return this.prisma.oAuthAccount.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        providerUserId: data.providerUserId,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  async ensureCustomerProfile(userId: string, data?: CustomerProfileData): Promise<void> {
    await this.prisma.customerProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredLanguage: data?.preferredLanguage ?? "en",
        defaultAddressId: data?.defaultAddressId,
        notes: data?.notes,
      },
      update: {
        preferredLanguage: data?.preferredLanguage,
        notes: data?.notes,
      },
    });
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfileData | null> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;
    return {
      preferredLanguage: profile.preferredLanguage,
      defaultAddressId: profile.defaultAddressId,
      notes: profile.notes,
    };
  }

  async updateCustomerProfile(userId: string, data: CustomerProfileData): Promise<CustomerProfileData> {
    const profile = await this.prisma.customerProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredLanguage: data.preferredLanguage ?? "en",
        defaultAddressId: data.defaultAddressId,
        notes: data.notes,
      },
      update: {
        preferredLanguage: data.preferredLanguage,
        defaultAddressId: data.defaultAddressId,
        notes: data.notes,
      },
    });
    return {
      preferredLanguage: profile.preferredLanguage,
      defaultAddressId: profile.defaultAddressId,
      notes: profile.notes,
    };
  }

  async recordAuditLog(params: {
    userId?: string | null;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          details: params.details ? (params.details as object) : undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch {
      // Non-fatal logging failure
    }
  }
}

/**
 * In-memory repository for local development and unit tests when PostgreSQL is offline.
 */
export class DevInMemoryAuthRepository implements IAuthRepository {
  private users: Map<string, AuthenticatedUser> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private otpChallenges: Map<string, OtpChallengeRecord> = new Map();
  private rateLimitEvents: RateLimitEventRecord[] = [];
  private oauthAccounts: Map<string, OAuthAccountRecord> = new Map();
  private customerProfiles: Map<string, CustomerProfileData> = new Map();

  async findUserById(id: string): Promise<AuthenticatedUser | null> {
    return this.users.get(id) ?? null;
  }

  async findUserByPhone(phone: string): Promise<AuthenticatedUser | null> {
    for (const u of this.users.values()) {
      if (u.phone === phone) return u;
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<AuthenticatedUser | null> {
    for (const u of this.users.values()) {
      if (u.email?.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async createUser(data: CreateUserData): Promise<AuthenticatedUser> {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const user: AuthenticatedUser = {
      id,
      phone: data.phone ?? null,
      phoneVerified: data.phoneVerified ?? false,
      email: data.email ?? null,
      emailVerified: data.emailVerified ?? false,
      fullName: data.fullName ?? null,
      role: data.role ?? "CUSTOMER",
      isActive: data.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<CreateUserData>): Promise<AuthenticatedUser> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User not found: ${id}`);
    }
    const updated: AuthenticatedUser = {
      ...existing,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      phoneVerified: data.phoneVerified !== undefined ? data.phoneVerified : existing.phoneVerified,
      email: data.email !== undefined ? data.email : existing.email,
      emailVerified: data.emailVerified !== undefined ? data.emailVerified : existing.emailVerified,
      fullName: data.fullName !== undefined ? data.fullName : existing.fullName,
      role: data.role !== undefined ? data.role : existing.role,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
    };
    this.users.set(id, updated);
    return updated;
  }

  async createSession(data: CreateSessionData): Promise<SessionRecord> {
    const id = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const session: SessionRecord = {
      id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      idleExpiresAt: data.idleExpiresAt,
      absoluteExpiresAt: data.absoluteExpiresAt,
      lastAuthenticatedAt: new Date(),
      rotatedAt: null,
      replacedByHash: null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.sessions.set(session.tokenHash, session);
    return session;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    return this.sessions.get(tokenHash) ?? null;
  }

  async findRotatedSession(tokenHash: string, withinSeconds: number): Promise<SessionRecord | null> {
    const threshold = new Date(Date.now() - withinSeconds * 1000);
    const oldSession = this.sessions.get(tokenHash);
    if (
      oldSession &&
      oldSession.rotatedAt &&
      oldSession.rotatedAt >= threshold &&
      oldSession.replacedByHash
    ) {
      return this.sessions.get(oldSession.replacedByHash) ?? null;
    }
    return null;
  }

  async rotateSession(
    oldTokenHash: string,
    newSessionData: CreateSessionData
  ): Promise<{ oldSession: SessionRecord; newSession: SessionRecord }> {
    const oldSession = this.sessions.get(oldTokenHash);
    if (!oldSession) {
      throw new Error("Old session not found for rotation");
    }

    const now = new Date();
    const updatedOld: SessionRecord = {
      ...oldSession,
      rotatedAt: now,
      replacedByHash: newSessionData.tokenHash,
    };
    this.sessions.set(oldTokenHash, updatedOld);

    const newSession = await this.createSession(newSessionData);
    return { oldSession: updatedOld, newSession };
  }

  async updateSessionIdleExpiry(id: string, idleExpiresAt: Date): Promise<void> {
    for (const [hash, ses] of this.sessions.entries()) {
      if (ses.id === id) {
        this.sessions.set(hash, { ...ses, idleExpiresAt });
        break;
      }
    }
  }

  async revokeSession(tokenHash: string): Promise<void> {
    const ses = this.sessions.get(tokenHash);
    if (ses) {
      this.sessions.set(tokenHash, { ...ses, revokedAt: new Date() });
    }
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const [hash, ses] of this.sessions.entries()) {
      if (ses.userId === userId && !ses.revokedAt) {
        this.sessions.set(hash, { ...ses, revokedAt: now });
        count++;
      }
    }
    return count;
  }

  async createOtpChallenge(data: CreateOtpChallengeData): Promise<OtpChallengeRecord> {
    const id = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const challenge: OtpChallengeRecord = {
      id,
      phoneHash: data.phoneHash,
      otpHash: data.otpHash,
      expiresAt: data.expiresAt,
      attempts: 0,
      maxAttempts: data.maxAttempts ?? 3,
      usedAt: null,
      ipAddress: data.ipAddress ?? null,
      createdAt: new Date(),
    };
    this.otpChallenges.set(id, challenge);
    return challenge;
  }

  async getLatestOtpChallenge(phoneHash: string): Promise<OtpChallengeRecord | null> {
    const matching: OtpChallengeRecord[] = [];
    for (const ch of this.otpChallenges.values()) {
      if (ch.phoneHash === phoneHash) {
        matching.push(ch);
      }
    }
    if (matching.length === 0) return null;
    matching.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matching[0];
  }

  async incrementOtpAttempts(id: string): Promise<{ attempts: number; maxAttempts: number }> {
    const challenge = this.otpChallenges.get(id);
    if (!challenge) throw new Error("Challenge not found");
    const updated: OtpChallengeRecord = {
      ...challenge,
      attempts: challenge.attempts + 1,
    };
    this.otpChallenges.set(id, updated);
    return { attempts: updated.attempts, maxAttempts: updated.maxAttempts };
  }

  async markOtpChallengeUsed(id: string): Promise<void> {
    const challenge = this.otpChallenges.get(id);
    if (challenge) {
      this.otpChallenges.set(id, { ...challenge, usedAt: new Date() });
    }
  }

  async claimOtpChallenge(id: string): Promise<boolean> {
    const challenge = this.otpChallenges.get(id);
    if (!challenge || challenge.usedAt !== null) {
      return false;
    }
    this.otpChallenges.set(id, { ...challenge, usedAt: new Date() });
    return true;
  }

  async recordRateLimitEvent(keyHash: string): Promise<void> {
    this.rateLimitEvents.push({
      id: `rle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      keyHash,
      windowStart: new Date(),
      createdAt: new Date(),
    });
  }

  async countRateLimitEvents(keyHash: string, windowStart: Date): Promise<number> {
    return this.rateLimitEvents.filter(
      (e) => e.keyHash === keyHash && e.createdAt >= windowStart
    ).length;
  }

  async findOAuthAccount(provider: string, providerUserId: string): Promise<OAuthAccountRecord | null> {
    const key = `${provider}:${providerUserId}`;
    return this.oauthAccounts.get(key) ?? null;
  }

  async createOAuthAccount(data: CreateOAuthAccountData): Promise<OAuthAccountRecord> {
    const id = `oac-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const record: OAuthAccountRecord = {
      id,
      userId: data.userId,
      provider: data.provider,
      providerUserId: data.providerUserId,
      email: data.email ?? null,
      name: data.name ?? null,
      avatarUrl: data.avatarUrl ?? null,
      linkedAt: new Date(),
    };
    this.oauthAccounts.set(`${data.provider}:${data.providerUserId}`, record);
    return record;
  }

  async ensureCustomerProfile(userId: string, data?: CustomerProfileData): Promise<void> {
    const existing = this.customerProfiles.get(userId) ?? {};
    this.customerProfiles.set(userId, {
      preferredLanguage: data?.preferredLanguage ?? existing.preferredLanguage ?? "en",
      defaultAddressId: data?.defaultAddressId ?? existing.defaultAddressId,
      notes: data?.notes ?? existing.notes,
    });
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfileData | null> {
    return this.customerProfiles.get(userId) ?? null;
  }

  async updateCustomerProfile(userId: string, data: CustomerProfileData): Promise<CustomerProfileData> {
    const existing = this.customerProfiles.get(userId) ?? {};
    const updated = {
      preferredLanguage: data.preferredLanguage ?? existing.preferredLanguage ?? "en",
      defaultAddressId: data.defaultAddressId ?? existing.defaultAddressId,
      notes: data.notes ?? existing.notes,
    };
    this.customerProfiles.set(userId, updated);
    return updated;
  }

  async recordAuditLog(_params: {
    userId?: string | null;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    // In-memory noop or inspect in tests
  }

  clear(): void {
    this.users.clear();
    this.sessions.clear();
    this.otpChallenges.clear();
    this.rateLimitEvents = [];
    this.oauthAccounts.clear();
    this.customerProfiles.clear();
  }
}

const globalForAuth = globalThis as unknown as {
  devInMemoryAuthRepo?: DevInMemoryAuthRepository;
};

export const devInMemoryAuthRepo =
  globalForAuth.devInMemoryAuthRepo ??
  (globalForAuth.devInMemoryAuthRepo = new DevInMemoryAuthRepository());

export async function getAuthRepository(): Promise<IAuthRepository> {
  const isConnected = await checkDatabaseConnection();
  if (isConnected) {
    return new PrismaAuthRepository(getDb());
  }

  if (isDevFallbackAllowed()) {
    return devInMemoryAuthRepo;
  }

  throw new DatabaseUnavailableError("Authentication service is currently unavailable. Please try again shortly.");
}
