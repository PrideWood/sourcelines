import { cookies } from "next/headers";
import type { AuthSession } from "@/types/auth";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

export async function getSession(): Promise<AuthSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    return {
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
      expiresAt,
    };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}
