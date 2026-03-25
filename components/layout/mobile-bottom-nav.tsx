"use client";

import Link from "next/link";
import { Compass, Home, PenSquare, User } from "lucide-react";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  myHref: string;
};

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/browse", label: "浏览", icon: Compass },
  { href: "/submit", label: "投稿", icon: PenSquare },
];

export function MobileBottomNav({ myHref }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isSharePreviewPath = /^\/quotes\/[^/]+\/share$/.test(pathname);
  if (isSharePreviewPath) {
    return null;
  }

  function isBrowsePath(path: string) {
    return path === "/browse" || path.startsWith("/browse") || path === "/quotes" || path === "/search";
  }

  function isMyPath(path: string) {
    return (
      path === "/me" ||
      path.startsWith("/me/") ||
      path.startsWith("/settings") ||
      path === "/login" ||
      path === "/register"
    );
  }

  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <li key={item.href}>
            {(() => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/browse"
                    ? isBrowsePath(pathname)
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex h-12 flex-col items-center justify-center rounded-md px-2 text-[11px] transition-colors ${
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  href={item.href}
                >
                  <Icon className="mb-0.5 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })()}
          </li>
        ))}
        <li>
          {(() => {
            const active = isMyPath(pathname);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex h-12 flex-col items-center justify-center rounded-md px-2 text-[11px] transition-colors ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                href={myHref}
              >
                <User className="mb-0.5 h-4 w-4" />
                <span>我的</span>
              </Link>
            );
          })()}
        </li>
      </ul>
    </nav>
  );
}
