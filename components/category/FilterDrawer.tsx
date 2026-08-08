"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  resultCount: number;
  onApply: () => void;
  onClearAll: () => void;
}

/** Mobile slide-in filter drawer: a full-height Sheet with a sticky footer holding "Clear All" and "Apply Filters", so selections only take effect once confirmed rather than live-updating the page underneath. */
export function FilterDrawer({ open, onOpenChange, children, resultCount, onApply, onClearAll }: FilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] max-w-[90vw] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Filter Products</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">{children}</div>
        <SheetFooter className="flex-row gap-3 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClearAll}>
            Clear All
          </Button>
          <Button className="flex-1" onClick={onApply}>
            Apply Filters ({resultCount})
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
