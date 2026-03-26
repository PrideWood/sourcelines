export function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  const hostCandidate = forwardedHost && forwardedHost.length > 0 ? forwardedHost : requestUrl.host;
  const host = hostCandidate.startsWith("0.0.0.0") ? requestUrl.host : hostCandidate;

  const protocolCandidate = forwardedProto && forwardedProto.length > 0 ? forwardedProto : requestUrl.protocol.replace(":", "");
  const protocol = protocolCandidate === "http" || protocolCandidate === "https" ? protocolCandidate : "https";

  return `${protocol}://${host}`;
}

export function toAbsoluteUrl(request: Request, path: string) {
  return new URL(path, getRequestOrigin(request));
}
