"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function TestEmailCard() {
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [sendingOwner, setSendingOwner] = React.useState(false);
  const [sendingCustomer, setSendingCustomer] = React.useState(false);

  async function send(kind: "owner" | "customer") {
    if (kind === "owner") setSendingOwner(true);
    else setSendingCustomer(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, to: kind === "customer" ? customerEmail : undefined }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        toast.success(kind === "owner" ? "Test email sent to the admin notification address" : `Test email sent to ${customerEmail}`);
      } else {
        toast.error(data?.error || "Could not send the test email.");
      }
    } catch {
      toast.error("Could not send the test email.");
    } finally {
      setSendingOwner(false);
      setSendingCustomer(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-ink">Email delivery test</h2>
      <p className="mt-1 text-sm text-gray-500">
        Send a controlled test email to confirm Resend is configured correctly. This never runs automatically.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <Button type="button" variant="outline" onClick={() => send("owner")} disabled={sendingOwner}>
            {sendingOwner ? "Sending..." : "Send owner test email"}
          </Button>
          <p className="mt-1 text-xs text-gray-500">Sends to the admin notification address.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="testCustomerEmail">Customer-style test (optional)</Label>
          <Input
            id="testCustomerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => send("customer")}
          disabled={sendingCustomer || !customerEmail}
        >
          {sendingCustomer ? "Sending..." : "Send customer test email"}
        </Button>
      </div>
    </div>
  );
}
