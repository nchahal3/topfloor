import { vi } from "vitest";

// Stub env vars used across all route handlers
process.env.STRIPE_SECRET_KEY = "sk_test_stub";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_stub";
process.env.CLERK_SECRET_KEY = "sk_test_clerk_stub";
process.env.CRON_SECRET = "cron_secret_stub";
process.env.DISCORD_GUILD_ID = "guild_123";
process.env.DISCORD_PRO_ROLE_ID = "role_456";
process.env.DISCORD_BOT_TOKEN = "bot_token_stub";
process.env.RESEND_API_KEY = "re_stub";
process.env.COACH_EMAIL = "coach@test.com";
process.env.NEXT_PUBLIC_URL = "https://topfloortradesofficial.com";
process.env.DISCORD_LOG_WEBHOOK_URL = "https://discord.test/webhook/log";
process.env.DISCORD_BOOKINGS_WEBHOOK_URL = "https://discord.test/webhook/bookings";
process.env.DISCORD_VC_INVITE_URL = "https://discord.gg/teststub";
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "svc@test.iam.gserviceaccount.com";
process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nstub\\n-----END PRIVATE KEY-----";
process.env.GOOGLE_CALENDAR_ID = "topfloor@topfloortradesofficial.com";

// Silence console.error in tests unless explicitly tested
vi.spyOn(console, "error").mockImplementation(() => {});
