import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

// GDPR art. 15 / 20: everything we hold about one email, as JSON.
export async function GET(request: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const [orders, inquiries, privacyRequests, withdrawals, chats] = await Promise.all([
    db.order.findMany({ where: { email }, include: { items: true } }),
    db.inquiry.findMany({ where: { email } }),
    db.privacyRequest.findMany({ where: { email } }),
    db.withdrawalRequest.findMany({ where: { email } }),
    db.chatConversation.findMany({ where: { visitorEmail: email }, include: { messages: true } }),
  ]);
  const body = JSON.stringify({ email, exportedAt: new Date().toISOString(), orders, inquiries, privacyRequests, withdrawals, chats }, null, 2);
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="smarthomekj-data-${email.replace(/[^a-z0-9]/g, "_")}.json"`,
    },
  });
}
