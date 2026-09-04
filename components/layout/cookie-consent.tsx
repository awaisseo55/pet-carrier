"use client";

import * as React from "react";
import Link from "next/link";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pc_cookie_consent";
type Consent = "all" | "essential";

/**
 * Small floating card, not a full-width legacy bar, so it doesn't block the
 * page or fight the centred WelcomePopup dialog for attention. Genuinely
 * gates the Ahrefs analytics script (rendered here, not in layout.tsx's
 * <head>) rather than just decorating an already-loading script: it only
 * mounts once the visitor has actively chosen "Accept all".
 */
export function CookieConsent() {
  const [consent, setConsent] = React.useState<Consent | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "all" || stored === "essential") {
        setConsent(stored);
      } else {
        setVisible(true);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function choose(next: Consent) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setConsent(next);
    setVisible(false);
  }

  return (
    <>
      {hydrated && consent === "all" && (
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="oe+0WxSevsXawq740ab8Pw"
          strategy="afterInteractive"
        />
      )}

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-24 z-50 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm"
            role="dialog"
            aria-label="Cookie preferences"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-xl">
              <button
                type="button"
                onClick={() => choose("essential")}
                aria-label="Dismiss and keep essential cookies only"
                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>

              <span className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Cookie className="size-4.5" />
              </span>

              <h2 className="mt-3 font-heading text-base font-semibold text-ink">We use cookies</h2>
              <p className="mt-1.5 pr-4 text-sm text-gray-500">
                Essential cookies keep your basket and sign-in working. With your permission we&apos;d
                also like to use analytics cookies to understand how the site&apos;s used.{" "}
                <Link href="/privacy" className="text-blue-600 underline-offset-2 hover:underline">
                  Cookie policy
                </Link>
              </p>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="default" size="sm" className="flex-1" onClick={() => choose("all")}>
                  Accept all
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => choose("essential")}>
                  Essential only
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
