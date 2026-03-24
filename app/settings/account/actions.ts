"use server";

import type { ChangePasswordState } from "@/app/settings/account/form-state";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

function readField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();

  if (session == null) {
    return {
      formError: "登录状态已失效，请重新登录。",
      fieldErrors: {},
    };
  }

  const currentPassword = readField(formData, "currentPassword");
  const newPassword = readField(formData, "newPassword");
  const confirmPassword = readField(formData, "confirmPassword");

  const fieldErrors: ChangePasswordState["fieldErrors"] = {};

  if (currentPassword.trim().length === 0) {
    fieldErrors.currentPassword = "请输入当前密码。";
  }

  if (newPassword.length < 8) {
    fieldErrors.newPassword = "新密码至少需要 8 位。";
  }

  if (confirmPassword !== newPassword) {
    fieldErrors.confirmPassword = "两次输入的新密码不一致。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      formError: "修改失败，请检查表单。",
      fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password_hash: true },
  });

  if (user == null) {
    return {
      formError: "用户不存在或已被删除。",
      fieldErrors: {},
    };
  }

  const currentPasswordValid = await verifyPassword(currentPassword, user.password_hash);

  if (currentPasswordValid === false) {
    return {
      formError: "当前密码不正确。",
      fieldErrors: {
        currentPassword: "当前密码不正确。",
      },
    };
  }

  const nextPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: nextPasswordHash,
    },
  });

  return {
    successMessage: "密码修改成功。当前登录状态保持有效。",
    fieldErrors: {},
  };
}
