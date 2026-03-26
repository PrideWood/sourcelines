import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/cookie";
import { toAbsoluteUrl } from "@/lib/http/request-url";

export async function POST(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(toAbsoluteUrl(request, "/"), 303);
}
