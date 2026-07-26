import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Settings</h1>
      <p className="mt-1 text-brown-soft">Store-wide markup rules and shipping defaults.</p>

      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-border bg-cream-dark/40 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Data storage</p>
        <p className="mt-1">
          Products, orders and settings are currently stored as JSON files under <code>/data</code>.
          This keeps things simple to inspect and edit while the store is small. When order volume
          grows, migrate this to Supabase or Postgres, the data shapes in <code>lib/types.ts</code>{" "}
          are already structured for that move.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border bg-cream-dark/40 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Keepa price and stock sync</p>
        <p className="mt-1">
          Not yet active. TODO: once sales pick up, wire up the Keepa API to keep prices and stock
          status in sync with Amazon automatically. See the note in <code>lib/products.ts</code>.
        </p>
      </div>
    </div>
  );
}
