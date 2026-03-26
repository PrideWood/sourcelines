const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function getTurnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY ?? "";
}

function getTurnstileSecretKey() {
  return process.env.TURNSTILE_SECRET_KEY ?? "";
}

export function isTurnstileEnabled() {
  return getTurnstileSiteKey().length > 0 && getTurnstileSecretKey().length > 0;
}

export async function verifyTurnstileToken({
  token,
  ip,
}: {
  token: string;
  ip?: string;
}) {
  if (!isTurnstileEnabled()) {
    return true;
  }

  if (!token) {
    return false;
  }

  const body = new URLSearchParams({
    secret: getTurnstileSecretKey(),
    response: token,
  });

  if (ip) {
    body.set("remoteip", ip);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
