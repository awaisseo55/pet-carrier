import type { Metadata } from "next";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Pet Carrier account to view orders and manage your details.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-center font-serif text-3xl font-semibold text-foreground">Sign In</h1>
      <p className="mt-2 text-center text-brown-soft">Welcome back, your pets missed you.</p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <LoginForm />
      </div>
    </div>
  );
}
