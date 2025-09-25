import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

interface ServerAuthCheckProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export async function ServerAuthCheck({
  children,
  requireAuth = true,
  redirectTo = "/login",
}: ServerAuthCheckProps): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);

  if (requireAuth && !session) {
    redirect(redirectTo);
  }

  if (!requireAuth && session) {
    redirect("/");
  }

  return <>{children}</>;
}
