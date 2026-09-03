"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Copy, Mail, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LIFESTYLE_IMAGES } from "@/lib/images";
import { toast } from "sonner";

const STORAGE_KEY = "pc_welcome_popup_seen";
const SHOW_DELAY_MS = 3500;
const WELCOME_CODE = "WELCOME5";

/**
 * First-order 5% off popup, shown once per browser (localStorage flag, not
 * per page view) a few seconds after arrival so it doesn't interrupt the
 * initial page load. Backed by the real WELCOME5 coupon in data/coupons.json
 * rather than a decorative code, the copy button and "use at checkout"
 * message are genuinely functional.
 */
export function WelcomePopup() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [claimed, setClaimed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setOpen(false);
    window.localStorage.setItem(STORAGE_KEY, "1");
  }

  function handleOpenChange(next: boolean) {
    if (!next) dismiss();
    else setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClaimed(true);
    window.localStorage.setItem(STORAGE_KEY, "1");
  }

  function handleCopy() {
    navigator.clipboard.writeText(WELCOME_CODE);
    setCopied(true);
    toast.success("Code copied, paste it at checkout.");
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl sm:grid sm:grid-cols-2">
        <DialogTitle className="sr-only">Get 5% off your first order</DialogTitle>

        <div className="relative hidden min-h-[380px] sm:block">
          <Image
            src={LIFESTYLE_IMAGES.newsletter}
            alt="A golden retriever puppy holding a flower"
            fill
            sizes="(min-width: 640px) 380px, 0px"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10">
          {!claimed ? (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Sparkles className="size-5" />
              </span>
              <h2 className="mt-4 font-heading text-2xl font-semibold text-ink">
                Get 5% off your first order
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Pop your email in and we&apos;ll send a welcome code for 5% off, plus the odd care tip
                from us.
              </p>
              <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="default" size="lg" className="w-full">
                  Get my code
                </Button>
              </form>
              <button
                type="button"
                onClick={dismiss}
                className="mt-3 text-xs text-gray-500 underline hover:text-ink cursor-pointer"
              >
                No thanks, I&apos;ll pay full price
              </button>
            </>
          ) : (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-success-light text-success">
                <Check className="size-5" strokeWidth={2.5} />
              </span>
              <h2 className="mt-4 font-heading text-2xl font-semibold text-ink">You&apos;re in!</h2>
              <p className="mt-2 text-sm text-gray-500">
                Use this code at checkout to get 5% off your first order.
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-5 flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/60 px-4 py-3 text-left cursor-pointer"
              >
                <span className="font-heading text-lg font-bold tracking-wide text-blue-700">
                  {WELCOME_CODE}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                  {copied ? (
                    <>
                      <Check className="size-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copy
                    </>
                  )}
                </span>
              </button>
              <Button variant="outline" size="lg" className="mt-4 w-full" onClick={dismiss}>
                Continue shopping
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
