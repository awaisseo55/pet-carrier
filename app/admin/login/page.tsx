"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: formData.get("password") }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Incorrect password.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Lock className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold">Admin Access</h1>
            <p className="text-sm text-muted-foreground">Pet Carrier control panel</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoFocus />
          </div>
          <Button type="submit" variant="default" size="lg" disabled={loading}>
            {loading ? "Checking..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
