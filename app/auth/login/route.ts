import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookie";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { signSessionToken } from "@/lib/auth/token";
import { toAbsoluteUrl } from "@/lib/http/request-url";

function safeRedirectPath(nextValue: string | null) {
  if (!nextValue || !nextValue.startsWith("/")) {
    return "/";
  }

  if (nextValue.startsWith("//")) {
    return "/";
  }

  return nextValue;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/login?error=missing_fields&next=${encodeURIComponent(next)}`), 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/login?error=invalid_credentials&next=${encodeURIComponent(next)}`), 303);
  }

  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/login?error=invalid_credentials&next=${encodeURIComponent(next)}`), 303);
  }

  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.display_name,
  });

  await setSessionCookie(token);
  return NextResponse.redirect(toAbsoluteUrl(request, next), 303);
}
