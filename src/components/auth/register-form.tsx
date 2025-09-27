"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { EyeOpenIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { useRegisterMutation } from "@/hooks/use-auth";
import { AppError } from "@/utils/app-error";

export function RegisterForm(): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput): Promise<void> => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        // Show success message and redirect after delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      },
    });
  };

  if (registerMutation.isSuccess) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-600">
            Organization Created Successfully!
          </h1>
          <p className="text-muted-foreground">
            Your organization and HR account have been created. Redirecting to
            login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {registerMutation.error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {registerMutation.error instanceof AppError
              ? registerMutation.error.message
              : "An unexpected error occurred"}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              {...register("lastName")}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization Name</Label>
          <Input
            id="organizationName"
            placeholder="Acme Corporation"
            {...register("organizationName")}
            className={errors.organizationName ? "border-red-500" : ""}
          />
          {errors.organizationName && (
            <p className="text-sm text-red-600">
              {errors.organizationName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="domain">Domain (Optional)</Label>
          <Input
            id="domain"
            placeholder="example.com"
            {...register("domain")}
            className={errors.domain ? "border-red-500" : ""}
          />
          {errors.domain && (
            <p className="text-sm text-red-600">{errors.domain.message}</p>
          )}
          <div className="text-muted-foreground text-xs">
            Leave blank to auto-generate a domain for your organization.
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              {...register("password")}
              className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeNoneIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeOpenIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
          <div className="text-muted-foreground text-xs">
            Password must contain at least 8 characters with uppercase,
            lowercase, number, and special character.
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Registering...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>

      <div className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
