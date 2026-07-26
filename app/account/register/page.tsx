import type { Metadata } from "next";
import { RegisterForm } from "@/components/account/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Pet Carrier account to track your orders and save your details.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-center font-heading text-3xl font-semibold text-foreground">Create Account</h1>
      <p className="mt-2 text-center text-gray-500">Join us for quicker checkout and order tracking.</p>
      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
