import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage(): Promise<React.ReactElement> {
  return (
    <AuthLayout
      title="Sign In"
      subtitle="Enter your credentials to access your account"
    >
      <LoginForm />
    </AuthLayout>
  );
}
