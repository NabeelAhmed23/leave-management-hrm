"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/schemas/auth.schema";
import { useForgotPasswordMutation } from "@/hooks/use-auth";
import { AppError } from "@/utils/app-error";

export function ForgotPasswordForm(): React.ReactElement {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const forgotPasswordMutation = useForgotPasswordMutation();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput): Promise<void> => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      setIsSubmitted(true);
    } catch {
      // Error is handled by the mutation
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-green-800">
            <h3 className="mb-2 text-lg font-medium">Check your email</h3>
            <p className="text-sm">
              We&apos;ve sent password reset instructions to your email address.
              If you don&apos;t see the email, check your spam folder.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {forgotPasswordMutation.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {forgotPasswordMutation.error instanceof AppError
                ? forgotPasswordMutation.error.message
                : "An unexpected error occurred"}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email address"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Sending Reset Email...
              </>
            ) : (
              "Send Reset Email"
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
