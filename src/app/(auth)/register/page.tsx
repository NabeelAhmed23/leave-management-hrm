import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage(): React.ReactElement {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Enter your information to create your account"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
