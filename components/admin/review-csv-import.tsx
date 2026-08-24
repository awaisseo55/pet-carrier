"use client";

import * as React from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Upload, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REVIEW_FIELDS, detectReviewColumnMapping, type ReviewField } from "@/lib/review-csv-fields";
import { toast } from "sonner";

const BATCH_SIZE = 5;

interface RowResult {
  row: number;
  ok: boolean;
  productTitle?: string;
  reviewId?: string;
  error?: string;
}

type Step = "upload" | "mapping" | "importing" | "results";

export function ReviewCsvImportDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("upload");
  const [fileName, setFileName] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, ReviewField>>({});
  const [dragActive, setDragActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [results, setResults] = React.useState<RowResult[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResults([]);
    setProgress(0);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
    if (results.length > 0 && !next) router.refresh();
  }

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }

    setFileName(file.name);
    setParsing(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setParsing(false);
        const detectedHeaders = result.meta.fields || [];
        if (detectedHeaders.length === 0 || result.data.length === 0) {
          toast.error("Could not read any rows from that file.");
          return;
        }
        setHeaders(detectedHeaders);
        setRows(result.data);
        setMapping(detectReviewColumnMapping(detectedHeaders));
        setStep("mapping");
      },
      error: (error) => {
        setParsing(false);
        toast.error(`Could not parse that file: ${error.message}`);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    const hasProductMatch = Object.values(mapping).includes("product_match");
    const hasRating = Object.values(mapping).includes("rating");
    const hasBody = Object.values(mapping).includes("body");
    if (!hasProductMatch || !hasRating || !hasBody) {
      toast.error("Map at least the Product, Rating and Review Text columns before importing.");
      return;
    }

    setStep("importing");
    setProgress(0);

    const mappedRows: Record<ReviewField, string>[] = rows.map((row) => {
      const mapped: Partial<Record<ReviewField, string>> = {};
      for (const header of headers) {
        const field = mapping[header];
        if (field && field !== "ignore") {
          mapped[field] = row[header] || "";
        }
      }
      return mapped as Record<ReviewField, string>;
    });

    const allResults: RowResult[] = [];
    for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
      const batch = mappedRows.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch("/api/admin/reviews/csv-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch }),
        });
        const data = await res.json();
        if (res.ok) {
          allResults.push(...data.results.map((r: RowResult) => ({ ...r, row: r.row + i })));
        } else {
          batch.forEach((_, idx) => allResults.push({ row: i + idx + 1, ok: false, error: data.error }));
        }
      } catch {
        batch.forEach((_, idx) => allResults.push({ row: i + idx + 1, ok: false, error: "Network error" }));
      }
      setProgress(Math.round(((i + batch.length) / mappedRows.length) * 100));
    }

    setResults(allResults);
    setStep("results");
  }

  const imported = results.filter((r) => r.ok).length;
  const skipped = results.length - imported;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UploadCloud className="size-4" />
          Import Reviews
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import reviews from CSV</DialogTitle>
          <DialogDescription>
            Each review is matched to an existing product by slug, ASIN or product ID, exact match only, a row is
            skipped rather than guessed if no product matches. Verified status and moderation settings behave exactly
            as they do for any other review.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-border bg-gray-50 hover:border-blue-400"
              }`}
            >
              <Upload className="size-8 text-gray-400" />
              <p className="font-medium text-ink">
                {parsing ? "Processing..." : "Drop CSV file here or click to browse"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-gray-50 p-3 text-sm text-gray-600">
              <AlertTriangle className="size-4 shrink-0 text-gray-400" />
              <span>
                Export or save your spreadsheet as CSV before uploading.{" "}
                <a
                  href="/example-reviews.csv"
                  download
                  className="font-medium text-blue-700 hover:underline"
                >
                  Download an example CSV
                </a>{" "}
                to see the ideal format.
              </span>
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-blue-600" />
              <p className="font-medium text-ink">{fileName}</p>
              <span className="text-sm text-gray-500">({rows.length} rows detected)</span>
            </div>

            <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-left text-gray-500">
                    <th className="p-3">CSV Column</th>
                    <th className="p-3">Sample Data</th>
                    <th className="p-3">Map To</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header) => (
                    <tr key={header} className="border-b border-border last:border-0">
                      <td className="p-3 font-medium">{header}</td>
                      <td className="max-w-[160px] truncate p-3 text-gray-500">{rows[0]?.[header] || "—"}</td>
                      <td className="p-3">
                        <Select
                          value={mapping[header] || "ignore"}
                          onValueChange={(value) =>
                            setMapping((prev) => ({ ...prev, [header]: value as ReviewField }))
                          }
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REVIEW_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button variant="default" onClick={handleImport}>
                Import {rows.length} Review{rows.length === 1 ? "" : "s"}
              </Button>
              <Button variant="outline" onClick={reset}>
                Start over
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div>
            <p className="font-medium text-ink">Importing reviews...</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-gray-500">{progress}% complete</p>
          </div>
        )}

        {step === "results" && (
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-ink">
              <CheckCircle2 className="size-5 text-success" />
              Imported {imported} review{imported === 1 ? "" : "s"}
              {skipped > 0 && `, ${skipped} skipped due to errors`}
            </div>

            {skipped > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto overflow-x-auto rounded-lg border border-alert-light">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-alert-light text-left">
                      <th className="p-2">Row</th>
                      <th className="p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .filter((r) => !r.ok)
                      .map((r) => (
                        <tr key={r.row} className="border-b border-border last:border-0">
                          <td className="p-2">Row {r.row}</td>
                          <td className="p-2 text-alert">{r.error}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <p className="p-3 text-xs text-gray-500">
                  Fix these rows in your spreadsheet and re-upload just those rows to try again.
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={reset}>
                Import another file
              </Button>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
