"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const shopLinks = [
  { href: "/shop/dogs", label: "Dogs" },
  { href: "/shop/cats", label: "Cats" },
  { href: "/shop/small-animals", label: "Small Animals" },
  { href: "/shop/birds", label: "Birds" },
  { href: "/shop", label: "View All" },
];

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-2xl font-semibold text-sage-700 shrink-0">
          Pet Carrier
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-base font-medium rounded-full">
                Shop
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {shopLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild className="text-base font-medium rounded-full">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Account" asChild>
            <Link href="/account">
              <User className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cart" className="relative" onClick={openCart}>
            <ShoppingBag className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                {itemCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border px-4 py-3 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl gap-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for carriers, e.g. small dog carrier"
            />
            <Button type="submit" variant="primary">
              Search
            </Button>
          </form>
        </div>
      )}

      <div
        className={cn(
          "lg:hidden overflow-hidden border-t border-border transition-[max-height]",
          mobileOpen ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Shop
          </span>
          {shopLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-2 py-2 hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-2 py-2 hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
