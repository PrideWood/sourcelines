import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth/cookie";
import { signSessionToken } from "@/lib/auth/token";
import { toAbsoluteUrl } from "@/lib/http/request-url";
import { getRequestIp, normalizeEmail } from "@/lib/security/request";
import { enforceRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

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
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));
  const turnstileToken = String(formData.get("turnstile_token") ?? "");
  const ip = getRequestIp(request);

  if (!name || !email || !password) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/register?error=missing_fields&next=${encodeURIComponent(next)}`), 303);
  }

  if (password.length < 8) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/register?error=weak_password&next=${encodeURIComponent(next)}`), 303);
  }

  try {
    await enforceRateLimit({
      key: `register:ip:${ip}`,
      limit: 5,
      windowSeconds: 60 * 60,
      message: "请求过于频繁，请稍后再试。",
    });
    await enforceRateLimit({
      key: `register:email:${email}`,
      limit: 3,
      windowSeconds: 60 * 60,
      message: "请求过于频繁，请稍后再试。",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.redirect(toAbsoluteUrl(request, `/register?error=rate_limited&next=${encodeURIComponent(next)}`), 303);
    }
    throw error;
  }

  const turnstilePassed = await verifyTurnstileToken({
    token: turnstileToken,
    ip,
  });

  if (!turnstilePassed) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/register?error=turnstile_failed&next=${encodeURIComponent(next)}`), 303);
  }

  const existed = await prisma.user.findUnique({ where: { email } });

  if (existed) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/register?error=email_exists&next=${encodeURIComponent(next)}`), 303);
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
  return NextResponse.redirect(toAbsoluteUrl(request, next), 303);
}
