import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LazyRegisterForm } from "@/components/auth/lazy-register-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterPage(): React.ReactElement {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Enter your information to create your account"
    >
      <Suspense
        fallback={
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
        }
      >
        <LazyRegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
