"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";

type UserMenuProps = {
  userName: string;
  role: "USER" | "ADMIN";
};

export function UserMenu({ userName, role }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (open === false) {
        return;
      }

      const target = event.target as Node | null;
      if (rootRef.current != null && target != null && rootRef.current.contains(target) === false) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonVariants({ size: "sm", variant: "outline" })}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        type="button"
      >
        {userName}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-border bg-card p-1 shadow-sm">
          <Link
            className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            href="/me/favorites"
            onClick={() => {
              setOpen(false);
            }}
          >
            我的收藏
          </Link>
          <Link
            className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            href="/me/submissions"
            onClick={() => {
              setOpen(false);
            }}
          >
            我的投稿
          </Link>
          <Link
            className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            href="/settings/account"
            onClick={() => {
              setOpen(false);
            }}
          >
            账户设置
          </Link>
          {role === "ADMIN" ? (
            <>
              <Link
                className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                href="/admin/submissions"
                onClick={() => {
                  setOpen(false);
                }}
              >
                审核投稿
              </Link>
              <Link
                className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                href="/admin/quotes"
                onClick={() => {
                  setOpen(false);
                }}
              >
                管理条目
              </Link>
              <Link
                className="block rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                href="/admin/tags"
                onClick={() => {
                  setOpen(false);
                }}
              >
                标签管理
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
      ) : null}
    </div>
  );
}
