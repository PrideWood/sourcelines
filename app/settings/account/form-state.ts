export type ChangePasswordState = {
  successMessage?: string;
  formError?: string;
  fieldErrors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
};

export const initialChangePasswordState: ChangePasswordState = {
  fieldErrors: {},
};
