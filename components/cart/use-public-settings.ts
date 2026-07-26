"use client";

import * as React from "react";

export interface PublicSettings {
  free_shipping_threshold: number;
  standard_shipping_cost: number;
  express_shipping_cost: number;
  next_day_shipping_cost: number;
  vat_rate: number;
  currency: string;
}

const DEFAULTS: PublicSettings = {
  free_shipping_threshold: 50,
  standard_shipping_cost: 3.99,
  express_shipping_cost: 6.99,
  next_day_shipping_cost: 9.99,
  vat_rate: 20,
  currency: "GBP",
};

export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = React.useState<PublicSettings>(DEFAULTS);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        // keep defaults if this fails
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
