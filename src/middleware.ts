import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

const redis = Redis.fromEnv();

export async function middleware(req: NextRequest) {
  try {
    const killed = await redis.get("site:kill");
    if (killed) {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch {
    // fail open — if Redis is down, let traffic through
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/deadman|_next/static|_next/image|favicon.ico).*)",
  ],
};
