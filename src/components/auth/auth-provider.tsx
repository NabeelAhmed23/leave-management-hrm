"use client";

import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps): React.ReactElement {
  return <SessionProvider>{children}</SessionProvider>;
}
