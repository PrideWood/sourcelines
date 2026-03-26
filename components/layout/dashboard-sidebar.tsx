import Link from "next/link";

import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
};

export function DashboardSidebar({
  items,
  title,
}: {
  items: SidebarItem[];
  title: string;
}) {
  return (
    <aside className="w-full rounded-lg border border-border bg-card p-4 md:w-64">
      <h2 className="mb-3 font-sans text-sm font-semibold text-muted-foreground">{title}</h2>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link className={cn("block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground")} href={item.href} prefetch>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
