"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CouponType } from "@/lib/types";
import { toast } from "sonner";

export function NewCouponForm() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<CouponType>("percentage");
  const [value, setValue] = React.useState("10");
  const [minOrder, setMinOrder] = React.useState("0");
  const [validUntil, setValidUntil] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState("0");
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (!code.trim()) {
      toast.error("Enter a coupon code.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        type,
        value: Number(value),
        min_order_value: Number(minOrder),
        valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
        usage_limit: Number(usageLimit),
        is_active: true,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Coupon created");
      setCode("");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Could not create coupon");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">New Coupon</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Code</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" className="mt-1.5" />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage off</SelectItem>
              <SelectItem value="fixed">Fixed amount off</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Value {type === "percentage" ? "(%)" : "(£)"}</Label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Minimum order value (£)</Label>
          <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Valid until</Label>
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Usage limit (0 = unlimited)</Label>
          <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <Button variant="default" className="mt-4" onClick={handleSave} disabled={saving}>
        {saving ? "Creating..." : "Create Coupon"}
      </Button>
    </div>
  );
}
