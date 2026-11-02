import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        // "default"/"primary" is the burnt amber CTA colour (Add to Basket,
        // Checkout, Sign In). "forest" is the dark brand-green button used
        // where a CTA sits on an amber or busy background. "secondary"/
        // "outline" are the neutral white-with-border style for less
        // prominent actions. "ghost" and "link" use the forest accent.
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-ember-600 hover:shadow-md hover:-translate-y-0.5",
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-ember-600 hover:shadow-md hover:-translate-y-0.5",
        forest:
          "bg-forest-700 text-white shadow-sm hover:bg-forest-800 hover:shadow-md hover:-translate-y-0.5",
        secondary: "bg-white text-ink border border-border shadow-sm hover:bg-gray-50 hover:border-gray-300",
        outline:
          "border border-forest-300 text-forest-800 bg-transparent hover:bg-forest-50 hover:border-forest-500",
        ghost: "text-ink hover:bg-forest-50 hover:text-forest-700",
        link: "text-forest-700 underline-offset-4 hover:underline hover:text-forest-900 rounded-none",
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
