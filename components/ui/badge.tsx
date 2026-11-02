import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold w-fit whitespace-nowrap tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-forest-100 text-forest-800 border-forest-200",
        // Discount/sale badges (e.g. "Save £15"). Amber, not red: a pink-red
        // badge fights the forest/cream palette.
        secondary: "bg-ember-500 text-white border-transparent",
        outline: "bg-transparent text-foreground border-border",
        success: "bg-success-light text-success border-transparent",
        alert: "bg-alert-light text-alert border-transparent",
        warning: "bg-warning-light text-warning border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
