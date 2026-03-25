import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { getSession } from "@/lib/auth/session";

const items = [
  { label: "我的投稿", href: "/me/submissions" },
  { label: "我的收藏", href: "/me/favorites" },
];

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return <section className="min-w-0 flex-1">{children}</section>;
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="hidden md:block">
        <DashboardSidebar items={items} title="个人中心" />
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
