import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth/cookie";
import { signSessionToken } from "@/lib/auth/token";

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
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!name || !email || !password) {
    return NextResponse.redirect(new URL(`/register?error=missing_fields&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  if (password.length < 8) {
    return NextResponse.redirect(new URL(`/register?error=weak_password&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const existed = await prisma.user.findUnique({ where: { email } });

  if (existed) {
    return NextResponse.redirect(new URL(`/register?error=email_exists&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      display_name: name,
      role: "USER",
    },
  });

  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.display_name,
  });

  await setSessionCookie(token);
  return NextResponse.redirect(new URL(next, request.url), 303);
}
