"use client";

import Script from "next/script";

export function TurnstileWidget({
  siteKey,
  action,
}: {
  siteKey: string;
  action: string;
}) {
  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Script defer src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div
        className="cf-turnstile"
        data-action={action}
        data-response-field-name="turnstile_token"
        data-sitekey={siteKey}
        data-theme="auto"
      />
      <p className="text-xs text-muted-foreground">此表单受 Turnstile 保护，以减少机器人滥用。</p>
    </div>
  );
}
