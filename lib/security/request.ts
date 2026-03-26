type HeaderSource = Request | Headers | { get(name: string): string | null };

export function getRequestIp(input: HeaderSource) {
  const headers = input instanceof Request ? input.headers : input;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
