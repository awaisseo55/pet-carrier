"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Settings,
  ShoppingCart,
  Ticket,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/homepage", label: "Homepage", icon: ImageIcon },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function useAdminLogout() {
  const router = useRouter();
  return React.useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }, [router]);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-emerald-100 text-emerald-800" : "text-gray-500 hover:bg-muted"
            )}
          >
            <link.icon className="size-4.5" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Persistent left sidebar, shown on desktop only (lg breakpoint and up). */
export function AdminNav() {
  const handleLogout = useAdminLogout();

  return (
    <nav className="flex h-full flex-col justify-between p-4">
      <div className="flex flex-col gap-1">
        <Link href="/admin" className="mb-4 px-2 font-heading text-lg font-semibold text-emerald-700">
          Pet Carrier Admin
        </Link>
        <NavLinks />
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-muted cursor-pointer"
      >
        <LogOut className="size-4.5" />
        Sign Out
      </button>
    </nav>
  );
}

/**
 * Top bar with a hamburger toggle, shown on mobile only. Order fulfilment
 * often happens on the go, so the admin nav must be reachable without a
 * desktop-width sidebar.
 */
export function AdminMobileNav() {
  const [open, setOpen] = React.useState(false);
  const handleLogout = useAdminLogout();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <Link href="/admin" className="font-heading text-lg font-semibold text-emerald-700">
          Pet Carrier Admin
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-full text-ink hover:bg-muted cursor-pointer"
          aria-label="Toggle admin menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-card p-4">
          <NavLinks onNavigate={() => setOpen(false)} />
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-muted cursor-pointer"
          >
            <LogOut className="size-4.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
