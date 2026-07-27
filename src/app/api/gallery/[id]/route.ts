import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { GALLERY_COOKIE, isValidSession } from "../auth";
import { GALLERY_ITEMS } from "@/data/gallery";

export const runtime = "nodejs";

const VALID_IDS = new Set(GALLERY_ITEMS.map((i) => i.id));

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${GALLERY_COOKIE}=`))
    ?.slice(GALLERY_COOKIE.length + 1);

  if (!isValidSession(token)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || !VALID_IDS.has(n)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const file = path.join(process.cwd(), "private", "gallery", `${n}.webp`);
    const bytes = await readFile(file);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        // private: tied to a session cookie, must never be shared-cached
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
