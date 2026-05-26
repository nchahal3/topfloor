import { createHmac } from "crypto";

export function getAdminToken(): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD!)
    .update("topfloor-admin-session-v1")
    .digest("hex");
}
