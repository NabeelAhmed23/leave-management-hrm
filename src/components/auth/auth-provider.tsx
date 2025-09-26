"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
  session: Session | null;
  children: React.ReactNode;
}

export function AuthProvider({
  session,
  children,
}: AuthProviderProps): React.ReactElement {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
