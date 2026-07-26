import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        // "default" is the main brand CTA colour (emerald), used implicitly
        // by most buttons. "primary" is kept as an alias for the same style
        // so existing call sites don't need to change. Coral lives on
        // "secondary" instead, for the rare case a button should stand out
        // as an accent rather than the primary action (badges use coral via
        // components/ui/badge.tsx, not this component).
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-emerald-700",
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-emerald-700",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-coral-600",
        outline:
          "border-2 border-primary text-primary bg-transparent hover:bg-emerald-50",
        ghost: "text-ink hover:bg-emerald-50 hover:text-emerald-700",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
        subtle: "bg-gray-100 text-ink hover:bg-emerald-100",
      },
      size: {
        default: "h-11 px-6 py-2 has-[>svg]:px-5",
        sm: "h-9 px-4 text-sm has-[>svg]:px-3.5",
        lg: "h-13 px-8 text-base has-[>svg]:px-7",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
