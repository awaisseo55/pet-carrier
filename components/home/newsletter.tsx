"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Newsletter() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("You're on the list! Look out for your 10% off code by email.");
    e.currentTarget.reset();
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-blue-700 px-6 py-12 text-center sm:px-12">
          <h2 className="font-heading text-3xl font-semibold text-white sm:text-4xl">
            Get pet care tips and 10% off your first order
          </h2>
          <p className="mt-3 text-blue-100">
            Join our newsletter for seasonal care guides, new arrivals and a welcome discount.
          </p>
          <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              className="bg-white border-transparent"
            />
            <Button type="submit" variant="default" size="lg" className="shrink-0">
              Get 10% off
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
