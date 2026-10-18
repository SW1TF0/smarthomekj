import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionMaxAge, signSession, verifySession, type SessionPayload } from "./session";

export async function getAdmin(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(role?: "ADMIN"): Promise<SessionPayload> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (role && admin.role !== role) redirect("/admin?error=forbidden");
  return admin;
}

export async function startSession(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
