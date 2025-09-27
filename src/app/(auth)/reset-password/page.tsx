import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

async function ResetPasswordContent({
  searchParams,
}: ResetPasswordPageProps): Promise<React.ReactElement> {
  const { token, email } = await searchParams;

  if (!token) {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
          <div className="text-red-800">
            <h3 className="mb-2 text-lg font-medium">Invalid Reset Link</h3>
            <p className="text-sm">
              The password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>
        </div>
        <div className="text-center">
          <a
            href="/forgot-password"
            className="text-primary font-medium hover:underline"
          >
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<React.ReactElement> {
  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password below">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
