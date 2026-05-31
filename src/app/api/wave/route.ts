import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function POST(req: Request) {
  // Lifetime counter (optional, no TTL)
  await redis.incr("wave:total");

  // Fire a notification on every click
  await sendNotification(req);

  return NextResponse.json({ ok: true });
}

async function sendNotification(req: Request) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      Title: "Someone transmitted from your site",
      Tags: "star2",
    },
    body: `Time: ${time}\nIP: ${ip}`,
  });
}
