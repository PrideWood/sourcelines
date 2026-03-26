"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileHomeBrandBar() {
  const pathname = usePathname();
  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="border-b border-border/80 bg-background/95 md:hidden">
      <div className="container flex h-14 items-center justify-center">
        <Link className="font-sans text-lg font-semibold tracking-tight" href="/">
          SourceLines
        </Link>
      </div>
    </div>
  );
}
