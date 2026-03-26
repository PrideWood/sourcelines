import Link from "next/link";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTurnstileSiteKey } from "@/lib/security/turnstile";

function getErrorMessage(error: string | undefined) {
  if (error === "email_exists") return "该邮箱已被注册。";
  if (error === "weak_password") return "密码至少需要 8 位。";
  if (error === "missing_fields") return "请完整填写昵称、邮箱和密码。";
  if (error === "turnstile_failed") return "人机验证未通过，请重试。";
  if (error === "rate_limited") return "请求过于频繁，请稍后再试。";
  return "";
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);
  const next = params.next && params.next.startsWith("/") ? params.next : "/";
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>注册</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          <form action="/auth/register" className="space-y-4" method="post">
            <input name="next" type="hidden" value={next} />
            <div className="space-y-2">
              <Label htmlFor="name">昵称</Label>
              <Input id="name" name="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" />
            </div>
            <TurnstileWidget action="register" siteKey={turnstileSiteKey} />
            <Button className="w-full" type="submit">
              创建账号
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            已有账号？
            <Link className="ml-1 underline-offset-4 hover:underline" href={`/login?next=${encodeURIComponent(next)}`}>
              去登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
