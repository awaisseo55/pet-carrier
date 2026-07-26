"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmazonImport } from "@/components/admin/amazon-import";
import { ManualProductForm } from "@/components/admin/manual-product-form";
import { CsvImport } from "@/components/admin/csv-import";
import { BulkUrlImport } from "@/components/admin/bulk-url-import";

export function AddProductTabs() {
  const [tab, setTab] = React.useState("amazon");
  const [prefillAmazonUrl, setPrefillAmazonUrl] = React.useState("");

  function handleAddManually(url: string) {
    setPrefillAmazonUrl(url);
    setTab("manual");
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="amazon">Add from Amazon URL</TabsTrigger>
        <TabsTrigger value="manual">Add Manually</TabsTrigger>
        <TabsTrigger value="csv">Import CSV</TabsTrigger>
        <TabsTrigger value="bulk">Bulk URLs</TabsTrigger>
      </TabsList>

      <TabsContent value="amazon" className="mt-6">
        <AmazonImport />
      </TabsContent>
      <TabsContent value="manual" className="mt-6">
        <ManualProductForm key={prefillAmazonUrl} initialAmazonUrl={prefillAmazonUrl} />
      </TabsContent>
      <TabsContent value="csv" className="mt-6">
        <CsvImport />
      </TabsContent>
      <TabsContent value="bulk" className="mt-6">
        <BulkUrlImport onAddManually={handleAddManually} />
      </TabsContent>
    </Tabs>
  );
}
