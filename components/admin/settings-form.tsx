"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/types";
import { toast } from "sonner";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [form, setForm] = React.useState(settings);
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Settings saved");
    } else {
      toast.error("Could not save settings");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label>Default markup percentage</Label>
          <Input
            type="number"
            value={form.default_markup_percentage}
            onChange={(e) => setForm({ ...form, default_markup_percentage: Number(e.target.value) })}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Applied to new products fetched from Amazon, unless adjusted per product.
          </p>
        </div>
        <div>
          <Label>Free shipping threshold (£)</Label>
          <Input
            type="number"
            value={form.free_shipping_threshold}
            onChange={(e) => setForm({ ...form, free_shipping_threshold: Number(e.target.value) })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Standard shipping cost (£)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.standard_shipping_cost}
            onChange={(e) => setForm({ ...form, standard_shipping_cost: Number(e.target.value) })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Order notification email</Label>
          <Input
            type="email"
            value={form.admin_notification_email}
            onChange={(e) => setForm({ ...form, admin_notification_email: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>
      <Button variant="default" className="mt-6" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
