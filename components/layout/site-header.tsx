import Link from "next/link";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileHomeBrandBar } from "@/components/layout/mobile-home-brand-bar";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { UserMenu } from "@/components/layout/user-menu";

const navItems = [
  { href: "/browse", label: "浏览" },
  { href: "/submit", label: "投稿" },
];

export async function SiteHeader() {
  const session = await getSession();
  const myHref = "/me";

  return (
    <>
      <header>
        <MobileHomeBrandBar />

        <div className="container hidden h-16 items-center justify-between border-b border-border/80 bg-background/95 md:flex">
          <Link className="font-sans text-lg font-semibold tracking-tight" href="/">
            SourceLines
          </Link>

          <nav className="items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          {session ? <UserMenu role={session.user.role} userName={session.user.name} /> : null}
          {!session ? (
            <div className="flex items-center gap-2">
              <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href="/login">
                登录
              </Link>
              <Link className={buttonVariants({ size: "sm" })} href="/register">
                注册
              </Link>
            </div>
          ) : null}
        </div>
      </header>
      <MobileBottomNav myHref={myHref} />
    </>
  );
}
