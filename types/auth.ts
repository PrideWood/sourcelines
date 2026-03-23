export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: Date;
};

export type AuthRole = "USER" | "ADMIN";
