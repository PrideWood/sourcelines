"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/app/settings/account/actions";
import { initialChangePasswordState } from "@/app/settings/account/form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ErrorText({ message }: { message?: string }) {
  if (message == null || message.length === 0) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialChangePasswordState);

  return (
    <form action={formAction} className="space-y-4">
      {state.formError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.formError}</p> : null}
      {state.successMessage ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{state.successMessage}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">当前密码</Label>
        <Input id="currentPassword" name="currentPassword" type="password" />
        <ErrorText message={state.fieldErrors.currentPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">新密码</Label>
        <Input id="newPassword" name="newPassword" type="password" />
        <ErrorText message={state.fieldErrors.newPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认新密码</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" />
        <ErrorText message={state.fieldErrors.confirmPassword} />
      </div>

      <Button disabled={isPending} type="submit">
        {isPending ? "提交中..." : "修改密码"}
      </Button>
    </form>
  );
}
