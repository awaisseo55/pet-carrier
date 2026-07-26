import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav, AdminMobileNav } from "@/components/admin/admin-nav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:gap-6 lg:px-8">
      <div className="lg:hidden">
        <AdminMobileNav />
      </div>
      <aside className="hidden w-56 shrink-0 rounded-lg bg-gray-800 lg:block">
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
