import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { requireAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const items = [
  { label: "审核队列", href: "/admin/submissions" },
  { label: "管理条目", href: "/admin/quotes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <DashboardSidebar items={items} title="后台管理" />
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
