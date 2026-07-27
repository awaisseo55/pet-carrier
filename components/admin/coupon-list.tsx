"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Coupon } from "@/lib/types";
import { toast } from "sonner";

export function CouponList({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function toggleActive(coupon: Coupon) {
    setBusy(true);
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(coupon.is_active ? "Coupon deactivated" : "Coupon activated");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not update coupon");
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete "${code}"?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Coupon deleted");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not delete coupon");
    }
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center text-gray-500">
        No coupons yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-gray-500">
            <th className="p-3">Code</th>
            <th className="p-3">Discount</th>
            <th className="p-3">Min order</th>
            <th className="p-3">Usage</th>
            <th className="p-3">Valid until</th>
            <th className="p-3">Active</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr key={coupon.id} className="border-b border-border last:border-0 hover:bg-gray-50">
              <td className="p-3 font-medium">{coupon.code}</td>
              <td className="p-3">{coupon.type === "percentage" ? `${coupon.value}%` : formatPrice(coupon.value)}</td>
              <td className="p-3">{coupon.min_order_value > 0 ? formatPrice(coupon.min_order_value) : "None"}</td>
              <td className="p-3">
                {coupon.usage_count} {coupon.usage_limit > 0 ? `/ ${coupon.usage_limit}` : "(unlimited)"}
              </td>
              <td className="p-3">{new Date(coupon.valid_until).toLocaleDateString("en-GB")}</td>
              <td className="p-3">
                <Switch checked={coupon.is_active} onCheckedChange={() => toggleActive(coupon)} disabled={busy} />
              </td>
              <td className="p-3">
                <div className="flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete"
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    disabled={busy}
                  >
                    <Trash2 className="size-4 text-alert" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
