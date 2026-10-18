import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  visitorId: z.string().min(8).max(64),
  analytics: z.boolean(),
  marketing: z.boolean(),
  version: z.string().max(10),
});

// Stores proof of the visitor's cookie choice (GDPR art. 7(1)).
export async function POST(request: NextRequest) {
  if (!rateLimit(`consent:${clientIp(request.headers)}`, 10, 60_000)) return NextResponse.json({}, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await db.consentRecord.create({
    data: { ...parsed.data, userAgent: request.headers.get("user-agent")?.slice(0, 300) },
  });
  return NextResponse.json({ ok: true });
}
