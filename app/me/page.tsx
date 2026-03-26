import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; next?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (!session) {
    const next = params.next && params.next.startsWith("/") ? params.next : "/me";
    const hint = params.intent === "submit" ? "投稿前请先登录或注册账号。" : "登录后即可查看收藏、投稿记录和账户设置。";

    return (
      <div className="mx-auto max-w-md space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">我的</h1>
          <p className="text-sm text-muted-foreground">登录后管理收藏、投稿与账户信息。</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">登录后可使用完整功能</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{hint}</p>
            <div className="grid grid-cols-1 gap-2">
              <Link className={buttonVariants()} href={`/login?next=${encodeURIComponent(next)}`} prefetch>
                去登录
              </Link>
              <Link className={buttonVariants({ variant: "outline" })} href={`/register?next=${encodeURIComponent(next)}`} prefetch>
                去注册
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">我的</h1>
        <p className="text-sm text-muted-foreground">你好，{session.user.name}</p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">账户中心</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link className="flex h-12 items-center justify-between rounded-md px-3 text-sm hover:bg-accent hover:text-accent-foreground" href="/me/favorites" prefetch>
            <span>我的收藏</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link className="flex h-12 items-center justify-between rounded-md px-3 text-sm hover:bg-accent hover:text-accent-foreground" href="/me/submissions" prefetch>
            <span>我的投稿</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link className="flex h-12 items-center justify-between rounded-md px-3 text-sm hover:bg-accent hover:text-accent-foreground" href="/settings/account" prefetch>
            <span>账户设置</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <form action="/auth/logout" className="pt-1" method="post">
            <button className={`${buttonVariants({ variant: "outline" })} h-11 w-full`} type="submit">
              退出登录
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
