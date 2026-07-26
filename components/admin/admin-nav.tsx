"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderTree, Image as ImageIcon, LayoutDashboard, LogOut, Newspaper, Package, Settings, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/homepage", label: "Homepage", icon: ImageIcon },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex h-full flex-col justify-between p-4">
      <div className="flex flex-col gap-1">
        <Link href="/admin" className="mb-4 px-2 font-serif text-lg font-semibold text-sage-700">
          Pet Carrier Admin
        </Link>
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sage-100 text-sage-800" : "text-brown-soft hover:bg-muted"
              )}
            >
              <link.icon className="size-4.5" />
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brown-soft hover:bg-muted cursor-pointer"
      >
        <LogOut className="size-4.5" />
        Sign Out
      </button>
    </nav>
  );
}
