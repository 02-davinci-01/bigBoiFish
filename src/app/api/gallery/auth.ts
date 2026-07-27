import { createHmac, timingSafeEqual } from "crypto";

/**
 * Server-only gallery auth helpers.
 *
 * The password the visitor types is compared to GALLERY_PASSWORD (default
 * "goldFish"). On success we hand out a cookie whose value is an HMAC signed
 * with GALLERY_SECRET — unforgeable without the secret, and httpOnly so client
 * JS can never read it. The image route re-derives and compares this token.
 */

export const GALLERY_COOKIE = "gallery_session";

const PASSWORD = process.env.GALLERY_PASSWORD ?? "goldFish";
const SECRET =
  process.env.GALLERY_SECRET ??
  "bigBoiFish::change-me-in-prod::a7f3c1e9d240b5"; // fallback so it works out of the box

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function isPasswordCorrect(input: string): boolean {
  return safeEqual(input, PASSWORD);
}

/** The signed token we store in the cookie and expect back on image requests. */
export function galleryToken(): string {
  return createHmac("sha256", SECRET).update("gallery:granted").digest("hex");
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return safeEqual(cookieValue, galleryToken());
}
