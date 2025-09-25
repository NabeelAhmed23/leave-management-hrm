import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";

// Lazy load the login form
const LoginForm = dynamic(
  () =>
    import("@/components/auth/login-form").then(mod => ({
      default: mod.LoginForm,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="h-10 rounded bg-gray-200"></div>
        <div className="h-10 rounded bg-gray-200"></div>
        <div className="h-10 rounded bg-gray-200"></div>
      </div>
    ),
    ssr: false,
  }
);

interface LoginPageProps {
  searchParams: { callbackUrl?: string };
}

export default function LoginPage({
  searchParams,
}: LoginPageProps): React.ReactElement {
  return (
    <AuthLayout
      title="Sign In"
      subtitle="Enter your credentials to access your account"
    >
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
          </div>
        }
      >
        <LoginForm callbackUrl={searchParams.callbackUrl} />
      </Suspense>
    </AuthLayout>
  );
}
