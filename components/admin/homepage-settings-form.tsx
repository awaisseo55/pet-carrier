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
import type { HomepageSettings, Product } from "@/lib/types";
import { toast } from "sonner";

export function HomepageSettingsForm({
  settings,
  products,
}: {
  settings: HomepageSettings;
  products: Product[];
}) {
  const router = useRouter();
  const [heading, setHeading] = React.useState(settings.hero_heading);
  const [subheading, setSubheading] = React.useState(settings.hero_subheading);
  const [badges, setBadges] = React.useState(settings.trust_badges.join(", "));
  const [featuredProductId, setFeaturedProductId] = React.useState(settings.featured_product_id || "");
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/homepage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_heading: heading,
        hero_subheading: subheading,
        trust_badges: badges.split(",").map((b) => b.trim()).filter(Boolean),
        featured_product_id: featuredProductId || null,
        shop_by_pet_categories: settings.shop_by_pet_categories,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Homepage updated");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not save changes");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <Label>Hero heading</Label>
          <Input value={heading} onChange={(e) => setHeading(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Hero subheading</Label>
          <textarea
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <Label>Trust badges (comma separated)</Label>
          <Input value={badges} onChange={(e) => setBadges(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Featured product</Label>
          <Select value={featuredProductId} onValueChange={setFeaturedProductId}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Choose a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button variant="default" className="mt-4" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
