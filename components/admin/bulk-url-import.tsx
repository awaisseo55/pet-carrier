"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AmazonFetchPreview } from "@/app/api/admin/amazon/fetch/route";

const MAX_URLS = 100;

interface Outcome {
  url: string;
  ok: boolean;
  title?: string;
  error?: string;
}

export function BulkUrlImport({ onAddManually }: { onAddManually: (url: string) => void }) {
  const [urlsText, setUrlsText] = React.useState("");
  const [fetching, setFetching] = React.useState(false);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);

  const urlCount = urlsText.split("\n").map((u) => u.trim()).filter(Boolean).length;

  async function handleFetchAll() {
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      toast.error("Paste at least one Amazon URL.");
      return;
    }
    if (urls.length > MAX_URLS) {
      toast.error(`Please paste ${MAX_URLS} URLs or fewer at a time.`);
      return;
    }

    setFetching(true);
    setOutcomes([]);

    try {
      const fetchRes = await fetch("/api/admin/amazon/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const fetchData = await fetchRes.json();
      if (!fetchRes.ok) {
        toast.error(fetchData.error || "Could not fetch these URLs.");
        setFetching(false);
        return;
      }

      const previews: AmazonFetchPreview[] = fetchData.results;
      const newOutcomes: Outcome[] = [];

      // Successful fetches are saved straight away, this tab is the
      // hands-off bulk path (see the Amazon URL tab for reviewing each
      // product before it publishes).
      const toSave = previews.filter((p) => p.ok);
      if (toSave.length > 0) {
        const saveRes = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products: toSave.map((p) => ({
              ...p,
              category_slugs: p.category_slugs?.length ? p.category_slugs : [],
              is_active: true,
              is_featured: false,
            })),
          }),
        });
        const saveData = await saveRes.json();
        if (saveRes.ok) {
          for (const product of saveData.products) {
            newOutcomes.push({ url: product.amazon_url, ok: true, title: product.title });
          }
        } else {
          for (const p of toSave) {
            newOutcomes.push({ url: p.amazon_url, ok: false, error: saveData.error || "Could not save" });
          }
        }
      }

      for (const p of previews) {
        if (!p.ok) {
          newOutcomes.push({ url: p.amazon_url, ok: false, error: p.error });
        }
      }

      setOutcomes(newOutcomes);
      const savedCount = newOutcomes.filter((o) => o.ok).length;
      toast.success(`Imported ${savedCount} of ${urls.length} product(s)`);
    } catch {
      toast.error("Something went wrong fetching these URLs.");
    } finally {
      setFetching(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  }

  const pending = outcomes.filter((o) => !o.ok);
  const succeeded = outcomes.filter((o) => o.ok);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <label className="text-sm font-medium text-ink">Amazon UK product URLs (one per line, up to {MAX_URLS})</label>
        <p className="mt-1 text-sm text-gray-500">
          Products that fetch successfully are imported straight away with default pricing and categories. Anything
          that fails is added to a pending list below so you can complete it manually.
        </p>
        <textarea
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          rows={8}
          placeholder={"https://www.amazon.co.uk/dp/B0XXXXXXXX\nhttps://www.amazon.co.uk/dp/B0YYYYYYYY"}
          className="mt-3 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button variant="default" onClick={handleFetchAll} disabled={fetching}>
            {fetching ? <Loader2 className="size-4 animate-spin" /> : null}
            {fetching ? "Fetching all..." : "Fetch All"}
          </Button>
          <span className="text-sm text-gray-500">{urlCount} URL(s) entered</span>
        </div>
      </div>

      {succeeded.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 font-medium text-ink">
            <CheckCircle2 className="size-5 text-success" />
            Imported successfully ({succeeded.length})
          </div>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-gray-600">
            {succeeded.map((o, i) => (
              <li key={i}>{o.title}</li>
            ))}
          </ul>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-lg border border-alert-light bg-alert-light/40 p-6">
          <div className="flex items-center gap-2 font-medium text-ink">
            <AlertTriangle className="size-5 text-alert" />
            Pending manual entry ({pending.length})
          </div>
          <p className="mt-1 text-sm text-gray-600">
            These URLs could not be fetched automatically. Copy the URL and add the product using the Add Manually
            tab.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {pending.map((o, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm">
                <div>
                  <p className="break-all text-ink">{o.url}</p>
                  <p className="text-xs text-alert">{o.error}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyUrl(o.url)}>
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                  <Button size="sm" variant="default" onClick={() => onAddManually(o.url)}>
                    Add manually
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
