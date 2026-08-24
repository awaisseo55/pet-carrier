import { SettingsForm } from "@/components/admin/settings-form";
import { TestEmailCard } from "@/components/admin/test-email-card";
import { getSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Settings</h1>
      <p className="mt-1 text-gray-500">Store details, contact info, pricing and shipping defaults.</p>

      <div className="mt-6 flex flex-col gap-6">
        <SettingsForm settings={settings} />
        <TestEmailCard />
      </div>
    </div>
  );
}
