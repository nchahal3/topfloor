import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isWebhookRoute = (pathname: string) =>
  pathname.startsWith("/api/webhook") || pathname.startsWith("/api/clerk-webhook");

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

export default function middleware(req: NextRequest) {
  // Bypass Clerk entirely for webhook routes — they use their own signature verification
  if (isWebhookRoute(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) await auth.protect();
  })(req as never, new Response() as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
