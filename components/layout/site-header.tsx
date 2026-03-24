import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { UserMenu } from "@/components/layout/user-menu";

const navItems = [
  { href: "/quotes", label: "引文" },
  { href: "/submit", label: "投稿" },
  { href: "/search", label: "检索" },
];

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-border/80 bg-background/95">
      <div className="container flex h-16 items-center justify-between">
        <Link className="font-sans text-lg font-semibold tracking-tight" href="/">
          SourceLines
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        {session ? (
          <UserMenu role={session.user.role} userName={session.user.name} />
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
