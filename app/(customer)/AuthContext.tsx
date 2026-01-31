"use client";

import { createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  email: string;
  role: "CUSTOMER" | "VENDOR";
};

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
