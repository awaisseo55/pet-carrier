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

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Settings saved", { description: "Changes will appear across the site within a few seconds." });
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not save settings");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Store</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Store name</Label>
            <Input value={form.store_name} onChange={(e) => update("store_name", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={(e) => update("tagline", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>VAT rate (%)</Label>
            <Input type="number" value={form.vat_rate} onChange={(e) => update("vat_rate", Number(e.target.value))} className="mt-1.5" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Contact</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Contact email</Label>
            <Input value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Contact phone</Label>
            <Input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.contact_address} onChange={(e) => update("contact_address", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Order notification email</Label>
            <Input
              value={form.admin_notification_email}
              onChange={(e) => update("admin_notification_email", e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Social Media</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Instagram</Label>
            <Input value={form.social_instagram} onChange={(e) => update("social_instagram", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input value={form.social_facebook} onChange={(e) => update("social_facebook", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>TikTok</Label>
            <Input value={form.social_tiktok} onChange={(e) => update("social_tiktok", e.target.value)} className="mt-1.5" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Pricing and Shipping</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Default markup percentage</Label>
            <Input
              type="number"
              value={form.default_markup_percentage}
              onChange={(e) => update("default_markup_percentage", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Free shipping threshold (£)</Label>
            <Input
              type="number"
              value={form.free_shipping_threshold}
              onChange={(e) => update("free_shipping_threshold", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Standard shipping (£)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.standard_shipping_cost}
              onChange={(e) => update("standard_shipping_cost", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Express shipping (£)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.express_shipping_cost}
              onChange={(e) => update("express_shipping_cost", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Next-day shipping (£)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.next_day_shipping_cost}
              onChange={(e) => update("next_day_shipping_cost", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Email Templates</h2>
        <p className="mt-1 text-sm text-gray-500">Preview of the order confirmation email customers receive.</p>
        <div className="mt-3 rounded-lg border border-dashed border-border bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-ink">Subject: Your {form.store_name} order is confirmed</p>
          <p className="mt-2">Thanks for your order! We&apos;re getting it ready to dispatch from the UK.</p>
          <p className="mt-2 text-xs text-gray-500">
            Full templates live in <code>lib/email.ts</code>, connected via the Resend API once{" "}
            <code>RESEND_API_KEY</code> is set.
          </p>
        </div>
      </div>

      <Button variant="default" size="lg" className="w-fit" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>

      <div className="rounded-lg border border-dashed border-border bg-gray-50 p-5 text-sm text-gray-500">
        <p className="font-medium text-foreground">Data storage</p>
        <p className="mt-1">
          Products, orders, categories and settings are currently stored as JSON files under <code>/data</code>.
          This keeps things simple to inspect and edit while the store is small. When order volume grows, migrate
          this to Supabase or Postgres, the data shapes in <code>lib/types.ts</code> are already structured for that
          move.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-gray-50 p-5 text-sm text-gray-500">
        <p className="font-medium text-foreground">Keepa price and stock sync</p>
        <p className="mt-1">
          Not yet active. TODO: once sales pick up, wire up the Keepa API to keep prices and stock status in sync
          with Amazon automatically. See the note in <code>lib/products.ts</code>.
        </p>
      </div>
    </div>
  );
}
