import { GuestLayout } from "@/components/auth/guest-layout";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage(): Promise<React.ReactElement> {
  return (
    <GuestLayout
      title="Sign In"
      subtitle="Enter your credentials to access your account"
    >
      <LoginForm />
    </GuestLayout>
  );
}
