"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryNode, Section } from "@/lib/categories";
import { toast } from "sonner";

export function NewCategoryForm({ nodes }: { nodes: CategoryNode[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [section, setSection] = React.useState<Section>("carriers");
  const [parentPath, setParentPath] = React.useState<string>("carriers");
  const [saving, setSaving] = React.useState(false);

  const parentOptions = nodes.filter((n) => n.section === section);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Please give the category a name.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, section, parentPath }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Category created", { description: "It will appear on the live site within a few seconds." });
      router.push("/admin/categories");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Could not create category");
    }
  }

  return (
    <div className="max-w-lg rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <Label>Category name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="e.g. Senior Dog Carriers" />
        </div>
        <div>
          <Label>Section</Label>
          <Select
            value={section}
            onValueChange={(v) => {
              setSection(v as Section);
              setParentPath(v);
            }}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="carriers">Carriers</SelectItem>
              <SelectItem value="strollers">Strollers</SelectItem>
              <SelectItem value="beds">Beds</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Parent category</Label>
          <Select value={parentPath} onValueChange={setParentPath}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parentOptions.map((node) => (
                <SelectItem key={node.path} value={node.path}>
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="default" size="lg" className="w-fit" onClick={handleSave} disabled={saving}>
          {saving ? "Creating..." : "Create Category"}
        </Button>
      </div>
    </div>
  );
}
