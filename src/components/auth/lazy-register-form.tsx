"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the register form with client-side rendering
const RegisterForm = dynamic(
  () =>
    import("@/components/auth/register-form").then(mod => ({
      default: mod.RegisterForm,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
    ssr: false,
  }
);

export function LazyRegisterForm(): React.ReactElement {
  return <RegisterForm />;
}
