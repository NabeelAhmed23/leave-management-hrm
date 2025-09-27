import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage(): React.ReactElement {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email address and we'll send you a reset link"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
