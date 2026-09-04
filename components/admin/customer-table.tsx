"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
  orderCount: number;
  totalSpent: number;
}

export function CustomerTable({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = customers.filter((c) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return `${c.name} ${c.email}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mt-6">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="h-10 pl-9"
          />
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-100/40 py-16 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="text-gray-500">No customer accounts yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center text-gray-500">
          No customers match this search.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Total spent</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-medium">{customer.name}</td>
                  <td className="p-3 text-muted-foreground">{customer.email}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3">
                    {customer.orderCount > 0 ? (
                      <Badge variant="outline">{customer.orderCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="p-3">{customer.orderCount > 0 ? formatPrice(customer.totalSpent) : "—"}</td>
                  <td className="p-3">
                    {customer.orderCount > 0 && (
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(customer.email)}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                      >
                        View orders
                        <ChevronRight className="size-3.5" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
