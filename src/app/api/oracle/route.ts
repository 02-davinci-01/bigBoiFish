import { NextResponse } from "next/server";

const MESSAGES = {
  affirm: "the divine traveller affirms of this sorcery",
  negate: "the divine traveller negates this sorcery",
} as const;

export async function POST(req: Request) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return NextResponse.json({ ok: true });

  let type: "affirm" | "negate" = "affirm";
  try {
    const body = await req.json();
    if (body.type === "negate") type = "negate";
  } catch {}

  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      Title: "Hermit's Oracle",
      Tags: type === "affirm" ? "bubbles" : "runner",
    },
    body: MESSAGES[type],
  });

  return NextResponse.json({ ok: true });
}
