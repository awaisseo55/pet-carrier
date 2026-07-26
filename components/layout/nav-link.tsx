"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  exact = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "px-3 py-2 text-sm font-semibold tracking-wide text-ink transition-colors hover:text-blue-700",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active && "text-blue-700 underline underline-offset-8 decoration-2",
        className
      )}
    >
      {children}
    </Link>
  );
}
