import { GuestLayout } from "@/components/auth/guest-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage(): React.ReactElement {
  return (
    <GuestLayout
      title="Create Account"
      subtitle="Enter your information to create your account"
    >
      <RegisterForm />
    </GuestLayout>
  );
}
