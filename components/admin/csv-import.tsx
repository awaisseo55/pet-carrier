"use client";

import * as React from "react";
import Papa from "papaparse";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_FIELDS, detectColumnMapping, type ProductField } from "@/lib/csv-fields";
import { toast } from "sonner";

const BATCH_SIZE = 5;

interface RowResult {
  row: number;
  ok: boolean;
  title?: string;
  id?: string;
  error?: string;
}

type Step = "upload" | "mapping" | "importing" | "results";

export function CsvImport() {
  const [step, setStep] = React.useState<Step>("upload");
  const [fileName, setFileName] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, ProductField>>({});
  const [useAI, setUseAI] = React.useState(true);
  const [dragActive, setDragActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [results, setResults] = React.useState<RowResult[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file. XLSX support is coming soon, export as CSV for now.");
      return;
    }

    setFileName(file.name);
    setParsing(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsing(false);
        const detectedHeaders = results.meta.fields || [];
        if (detectedHeaders.length === 0 || results.data.length === 0) {
          toast.error("Could not read any rows from that file.");
          return;
        }
        setHeaders(detectedHeaders);
        setRows(results.data);
        setMapping(detectColumnMapping(detectedHeaders));
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
    const hasTitle = Object.values(mapping).includes("title");
    const hasPrice = Object.values(mapping).includes("price");
    if (!hasTitle || !hasPrice) {
      toast.error("Map at least the Product Name and Price columns before importing.");
      return;
    }

    setStep("importing");
    setProgress(0);

    const mappedRows: Record<ProductField, string>[] = rows.map((row) => {
      const mapped: Partial<Record<ProductField, string>> = {};
      for (const header of headers) {
        const field = mapping[header];
        if (field && field !== "ignore") {
          mapped[field] = row[header] || "";
        }
      }
      return mapped as Record<ProductField, string>;
    });

    const allResults: RowResult[] = [];
    for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
      const batch = mappedRows.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch("/api/admin/products/csv-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch, useAI }),
        });
        const data = await res.json();
        if (res.ok) {
          allResults.push(
            ...data.results.map((r: RowResult) => ({ ...r, row: r.row + i }))
          );
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

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResults([]);
    setProgress(0);
  }

  const imported = results.filter((r) => r.ok).length;
  const skipped = results.length - imported;

  if (step === "results") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-semibold text-ink">
            <CheckCircle2 className="size-5 text-success" />
            Imported {imported} product{imported === 1 ? "" : "s"} successfully
            {skipped > 0 && `, ${skipped} skipped due to errors`}
          </div>

          {skipped > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-alert-light">
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
            <Button variant="default" asChild>
              <Link href="/admin/products">View imported products</Link>
            </Button>
            <Button variant="outline" onClick={reset}>
              Import another file
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="font-medium text-ink">Importing products...</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-gray-500">{progress}% complete</p>
      </div>
    );
  }

  if (step === "mapping") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-emerald-600" />
            <p className="font-medium text-ink">{fileName}</p>
            <span className="text-sm text-gray-500">({rows.length} rows detected)</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            We detected these columns in your file. Map them to product fields, we&apos;ve pre-filled our best guess.
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
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
                    <td className="max-w-[200px] truncate p-3 text-gray-500">{rows[0]?.[header] || "—"}</td>
                    <td className="p-3">
                      <Select
                        value={mapping[header] || "ignore"}
                        onValueChange={(value) =>
                          setMapping((prev) => ({ ...prev, [header]: value as ProductField }))
                        }
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_FIELDS.map((field) => (
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

          <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={useAI} onCheckedChange={(c) => setUseAI(!!c)} />
            <Sparkles className="size-4 text-emerald-600" />
            Use AI to enhance descriptions (recommended)
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Rewrites descriptions to be more engaging, fills in missing meta titles/descriptions. Falls back to your
            original CSV copy if <code>ANTHROPIC_API_KEY</code> isn&apos;t set.
          </p>

          <div className="mt-5 flex gap-3">
            <Button variant="default" size="lg" onClick={handleImport}>
              Import {rows.length} Product{rows.length === 1 ? "" : "s"}
            </Button>
            <Button variant="outline" size="lg" onClick={reset}>
              Start over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          dragActive ? "border-emerald-500 bg-emerald-50" : "border-border bg-gray-50 hover:border-emerald-400"
        }`}
      >
        <Upload className="size-10 text-gray-400" />
        <p className="font-medium text-ink">
          {parsing ? "Processing..." : "Drop CSV file here or click to browse"}
        </p>
        <p className="text-sm text-gray-500">Compatible with Helium 10, AMZScout, Jungle Scout and manual spreadsheets.</p>
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

      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-gray-50 p-4 text-sm text-gray-600">
        <AlertTriangle className="size-4 shrink-0 text-gray-400" />
        <span>
          XLSX support is coming soon. For now, export or save your spreadsheet as CSV before uploading.{" "}
          <a href="/example-products.csv" download className="font-medium text-emerald-700 hover:underline">
            Download an example CSV
          </a>{" "}
          to see the ideal format.
        </span>
      </div>
    </div>
  );
}
