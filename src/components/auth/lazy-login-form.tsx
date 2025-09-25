"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the login form with client-side rendering
const LoginForm = dynamic(
  () =>
    import("@/components/auth/login-form").then(mod => ({
      default: mod.LoginForm,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
    ssr: false,
  }
);

interface LazyLoginFormProps {
  callbackUrl?: string;
}

export function LazyLoginForm({
  callbackUrl,
}: LazyLoginFormProps): React.ReactElement {
  return <LoginForm callbackUrl={callbackUrl} />;
}
