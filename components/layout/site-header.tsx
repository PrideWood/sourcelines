import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

const navItems = [
  { href: "/quotes", label: "引文" },
  { href: "/submit", label: "投稿" },
  { href: "/search", label: "检索" },
  { href: "/tags/philosophy", label: "标签" },
];

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-border/80 bg-background/95">
      <div className="container flex h-16 items-center justify-between">
        <Link className="font-sans text-lg font-semibold tracking-tight" href="/">
          SourceLines
          <span className="ml-2 text-xs font-normal uppercase text-muted-foreground">internal: Quotes</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        {session ? (
          <details className="relative">
            <summary
              className={`${buttonVariants({ size: "sm", variant: "outline" })} list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden`}
            >
              {session.user.name}
            </summary>

            <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-border bg-card p-1 shadow-sm">
              <Link className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" href="/me/favorites">
                我的收藏
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" href="/me/submissions">
                我的投稿
              </Link>
              {session.user.role === "ADMIN" ? (
                <>
                  <Link className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" href="/admin/submissions">
                    审核投稿
                  </Link>
                  <Link className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" href="/admin/quotes">
                    管理条目
                  </Link>
                </>
              ) : null}
              <form action="/auth/logout" method="post">
                <button
                  className="mt-1 block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  type="submit"
                >
                  退出登录
                </button>
              </form>
            </div>
          </details>
        ) : (
          <div className="flex items-center gap-2">
            <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href="/login">
              登录
            </Link>
            <Link className={buttonVariants({ size: "sm" })} href="/register">
              注册
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
