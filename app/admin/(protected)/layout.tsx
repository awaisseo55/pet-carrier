import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <aside className="hidden w-56 shrink-0 rounded-2xl border border-border bg-card lg:block">
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
