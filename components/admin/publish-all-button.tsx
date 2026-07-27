"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Safety net alongside the automatic per-save revalidation: forces every page on the site fresh, in case an admin isn't sure a change has shown up yet. */
export function PublishAllButton() {
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/admin/revalidate", { method: "POST" });
    setLoading(false);

    if (res.ok) {
      toast.success("Site refreshed. Every page will now show the latest data.");
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not refresh the site.");
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
      {loading ? "Refreshing..." : "Publish All Changes"}
    </Button>
  );
}
