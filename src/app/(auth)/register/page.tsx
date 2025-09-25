import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";

// Lazy load the register form
const RegisterForm = dynamic(
  () =>
    import("@/components/auth/register-form").then(mod => ({
      default: mod.RegisterForm,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 rounded bg-gray-200"></div>
          <div className="h-10 rounded bg-gray-200"></div>
        </div>
        <div className="h-10 rounded bg-gray-200"></div>
        <div className="h-10 rounded bg-gray-200"></div>
        <div className="h-10 rounded bg-gray-200"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function RegisterPage(): React.ReactElement {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Enter your information to create your account"
    >
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded bg-gray-200"></div>
              <div className="h-10 rounded bg-gray-200"></div>
            </div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
