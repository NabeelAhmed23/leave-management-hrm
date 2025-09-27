"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { EyeOpenIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/schemas/auth.schema";
import { useResetPasswordMutation } from "@/hooks/use-auth";
import { AppError } from "@/utils/app-error";

interface ResetPasswordFormProps {
  token: string;
  email?: string;
}

export function ResetPasswordForm({
  token,
  email,
}: ResetPasswordFormProps): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resetPasswordMutation = useResetPasswordMutation();

  const form = useForm<ResetPasswordInput & { confirmPassword: string }>({
    resolver: zodResolver(
      resetPasswordSchema
        .extend({
          confirmPassword: resetPasswordSchema.shape.password,
        })
        .refine(data => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        })
    ),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (
    data: ResetPasswordInput & { confirmPassword: string }
  ): Promise<void> => {
    const { ...resetData } = data;
    try {
      await resetPasswordMutation.mutateAsync({ ...resetData, email });
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {resetPasswordMutation.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {resetPasswordMutation.error instanceof AppError
                ? resetPasswordMutation.error.message
                : "An unexpected error occurred"}
            </div>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter your new password"
                      type={showPassword ? "text" : "password"}
                      className="pr-10"
                      {...field}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Confirm your new password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeNoneIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeOpenIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-muted-foreground text-center text-sm">
        Remember your password?{" "}
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
