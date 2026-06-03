import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

const REDIS_KEY = "site:kill";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!process.env.DEADMAN_SECRET || secret !== process.env.DEADMAN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const message = body.message?.trim().toUpperCase();

  if (message === "DEAD") {
    await redis.set(REDIS_KEY, "true");
    return NextResponse.json({ status: "killed" });
  }

  if (message === "ALIVE") {
    await redis.del(REDIS_KEY);
    return NextResponse.json({ status: "revived" });
  }

  return NextResponse.json({ status: "ignored", message });
}
