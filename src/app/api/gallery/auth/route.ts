import { NextResponse } from "next/server";
import { GALLERY_COOKIE, galleryToken, isPasswordCorrect } from "../auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    // ignore — treated as wrong password below
  }

  if (!isPasswordCorrect(password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GALLERY_COOKIE, galleryToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 6, // 6 hours
  });
  return res;
}
