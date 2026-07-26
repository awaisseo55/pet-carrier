import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        // "default"/"primary" is the orange CTA colour (Add to Basket,
        // Checkout, Sign In). "secondary"/"outline" are the neutral
        // white-with-border style for less prominent actions. "ghost" and
        // "link" use brand blue, matching the site's link colour.
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-coral-600",
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-coral-600",
        secondary:
          "bg-white text-ink border border-border shadow-sm hover:bg-gray-50",
        outline:
          "border border-border text-ink bg-white shadow-sm hover:bg-gray-50",
        ghost: "text-ink hover:bg-blue-50 hover:text-blue-700",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-800 rounded-none",
        subtle: "bg-gray-100 text-ink hover:bg-gray-200",
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
