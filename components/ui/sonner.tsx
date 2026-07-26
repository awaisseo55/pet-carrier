"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-card! text-card-foreground! border-border! shadow-warm! rounded-2xl!",
          description: "text-muted-foreground!",
          actionButton: "bg-primary! text-primary-foreground! rounded-full!",
          cancelButton: "bg-muted! text-muted-foreground! rounded-full!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
