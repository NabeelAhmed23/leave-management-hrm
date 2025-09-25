import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LazyLoginForm } from "@/components/auth/lazy-login-form";
import { Skeleton } from "@/components/ui/skeleton";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.ReactElement> {
  const { callbackUrl } = await searchParams;
  return (
    <AuthLayout
      title="Sign In"
      subtitle="Enter your credentials to access your account"
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <LazyLoginForm callbackUrl={callbackUrl} />
      </Suspense>
    </AuthLayout>
  );
}
