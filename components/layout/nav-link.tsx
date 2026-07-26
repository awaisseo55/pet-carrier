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
        "relative rounded-full px-4 py-2 text-base font-medium text-brown transition-colors",
        "after:absolute after:left-4 after:right-4 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-sage-600 after:transition-transform after:duration-200",
        "hover:text-sage-700 hover:after:scale-x-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active && "text-sage-700 after:scale-x-100",
        className
      )}
    >
      {children}
    </Link>
  );
}
