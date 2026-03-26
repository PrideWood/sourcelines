import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/cookie";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
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
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));
  const turnstileToken = String(formData.get("turnstile_token") ?? "");
  const ip = getRequestIp(request);

  if (!email || !password) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/login?error=missing_fields&next=${encodeURIComponent(next)}`), 303);
  }

  try {
    await enforceRateLimit({
      key: `login:ip:${ip}`,
      limit: 15,
      windowSeconds: 10 * 60,
      message: "请求过于频繁，请稍后再试。",
    });
    await enforceRateLimit({
      key: `login:email:${email}`,
      limit: 8,
      windowSeconds: 10 * 60,
      message: "请求过于频繁，请稍后再试。",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.redirect(toAbsoluteUrl(request, `/login?error=rate_limited&next=${encodeURIComponent(next)}`), 303);
    }
    throw error;
  }

  const turnstilePassed = await verifyTurnstileToken({
    token: turnstileToken,
    ip,
  });

  if (!turnstilePassed) {
    return NextResponse.redirect(toAbsoluteUrl(request, `/login?error=turnstile_failed&next=${encodeURIComponent(next)}`), 303);
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
