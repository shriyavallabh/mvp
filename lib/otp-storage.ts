// Shared OTP storage for send-otp and verify-otp routes
// In development: In-memory Map (global singleton)
// In production: Vercel KV (Redis)

// Use global to ensure singleton across API route imports
declare global {
  var otpStorage: Map<string, { otp: string; expiresAt: number }> | undefined;
}

export const otpStorage = global.otpStorage || new Map<string, { otp: string; expiresAt: number }>();

if (!global.otpStorage) {
  global.otpStorage = otpStorage;
}

// Cleanup expired OTPs every 5 minutes (only in development)
if (process.env.NODE_ENV === 'development' && !global.otpCleanupStarted) {
  global.otpCleanupStarted = true as any;
  setInterval(() => {
    const now = Date.now();
    for (const [phone, data] of otpStorage.entries()) {
      if (data.expiresAt < now) {
        otpStorage.delete(phone);
        console.log(`[OTP CLEANUP] Removed expired OTP for ${phone}`);
      }
    }
  }, 5 * 60 * 1000);
}
