import { notFound } from "next/navigation";

import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { getAccountUserById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = await requireAuth();

  const user = await getAccountUserById(session.user.id);

  if (user == null) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">账户设置</h1>
        <p className="text-sm text-muted-foreground">当前阶段支持基础资料查看与密码修改。</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">账户信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email：</span>
            {user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Display Name：</span>
            {user.display_name}
          </p>
          <p className="text-muted-foreground">Role：{user.role}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
