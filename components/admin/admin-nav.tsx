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
  Star,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
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

// Admin chrome (sidebar + mobile nav) is dark navy, one of the two allowed
// exceptions to the site's all-light-mode rule. Content areas stay white.
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
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
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
        <Link href="/admin" className="mb-4 px-2 font-heading text-lg font-semibold text-white">
          Pet Carrier Admin
        </Link>
        <NavLinks />
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
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
 * desktop-width sidebar. Kept in the same dark navy as the desktop sidebar.
 */
export function AdminMobileNav() {
  const [open, setOpen] = React.useState(false);
  const handleLogout = useAdminLogout();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3">
        <Link href="/admin" className="font-heading text-lg font-semibold text-white">
          Pet Carrier Admin
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-full text-white hover:bg-white/10 cursor-pointer"
          aria-label="Toggle admin menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-lg bg-gray-800 p-4">
          <NavLinks onNavigate={() => setOpen(false)} />
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <LogOut className="size-4.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
