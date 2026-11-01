export interface SendOtpParams {
  phone: string; // E.164 e.g. +919876543210
  otp: string;   // 6 digits
}

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IOtpProvider {
  readonly name: string;
  sendOtp(params: SendOtpParams): Promise<SendOtpResult>;
}

/**
 * In-memory development and test mock provider.
 * Strictly avoids invoking paid SMS APIs while allowing robust testing and dev workflows.
 */
export class DevMockOtpProvider implements IOtpProvider {
  public readonly name = "mock";
  private sentMessages: Array<{ phone: string; otp: string; timestamp: Date }> = [];

  async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    const entry = {
      phone: params.phone,
      otp: params.otp,
      timestamp: new Date(),
    };
    this.sentMessages.push(entry);

    if (process.env.NODE_ENV === "development") {
      // Safe masked log in development
      const maskedPhone = params.phone.replace(/(\+\d{2})(\d{2})\d{4}(\d{4})/, "$1 $2****$3");
      console.log(`[GharSewa Dev OTP] Code sent to ${maskedPhone}: ${params.otp}`);
    }

    return {
      success: true,
      messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  /**
   * Helper for tests to inspect the latest code sent to a phone number.
   */
  getLastOtpForPhone(phone: string): string | undefined {
    const matches = this.sentMessages.filter((m) => m.phone === phone);
    return matches.length > 0 ? matches[matches.length - 1].otp : undefined;
  }

  clear(): void {
    this.sentMessages = [];
  }
}

/**
 * Production Adapter Template for MSG91 (Recommended for India / TRAI DLT Compliance)
 *
 * Requirements for production activation:
 * 1. TRAI DLT Registration with Principal Entity ID and Approved Header (e.g. GHRSEW).
 * 2. Approved DLT SMS Template with GharSewa OTP format.
 * 3. MSG91 AuthKey and Flow ID in environment variables (`MSG91_AUTH_KEY`, `MSG91_OTP_FLOW_ID`).
 * 4. Pricing: Approx ₹0.12 - ₹0.18 per SMS in India (Transactional route).
 */
export class Msg91OtpProvider implements IOtpProvider {
  public readonly name = "msg91";

  async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const flowId = process.env.MSG91_OTP_FLOW_ID;

    if (!authKey || !flowId) {
      return {
        success: false,
        error: "MSG91 provider credentials not configured in environment.",
      };
    }

    try {
      const response = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: flowId,
          recipients: [
            {
              mobiles: params.phone.replace("+", ""),
              otp: params.otp,
            },
          ],
        }),
      });

      if (!response.ok) {
        return { success: false, error: `MSG91 API error: HTTP ${response.status}` };
      }

      const data = (await response.json()) as { type?: string; message?: string };
      return {
        success: data.type === "success",
        messageId: data.message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown MSG91 failure",
      };
    }
  }
}

/**
 * Production Adapter Template for Twilio Verify / Programmable Messaging
 * Pricing: Approx $0.05 per international SMS (significantly higher than domestic Indian gateways).
 */
export class TwilioOtpProvider implements IOtpProvider {
  public readonly name = "twilio";

  async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_PHONE;

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        error: "Twilio credentials not configured in environment.",
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: params.phone,
        From: fromNumber,
        Body: `Your GharSewa verification code is: ${params.otp}. Valid for 5 minutes. Do not share.`,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return { success: false, error: `Twilio HTTP error ${response.status}` };
      }

      const data = (await response.json()) as { sid?: string };
      return { success: true, messageId: data.sid };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown Twilio failure",
      };
    }
  }
}

let activeProvider: IOtpProvider | null = null;
const globalForOtp = globalThis as unknown as {
  devMockProvider?: DevMockOtpProvider;
};

export const devMockProvider =
  globalForOtp.devMockProvider ??
  (globalForOtp.devMockProvider = new DevMockOtpProvider());

export function getOtpProvider(): IOtpProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const configured = process.env.OTP_PROVIDER || "mock";
  if (configured === "msg91") {
    activeProvider = new Msg91OtpProvider();
  } else if (configured === "twilio") {
    activeProvider = new TwilioOtpProvider();
  } else {
    activeProvider = devMockProvider;
  }
  return activeProvider;
}

export function setOtpProviderForTesting(provider: IOtpProvider | null): void {
  activeProvider = provider;
}
