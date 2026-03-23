import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

const items = [
  { label: "我的投稿", href: "/me/submissions" },
  { label: "我的收藏", href: "/me/favorites" },
];

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <DashboardSidebar items={items} title="个人中心" />
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
