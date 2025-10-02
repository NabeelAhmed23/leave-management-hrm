import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        `border-input bg-background ring-offset-background placeholder:text-muted-foreground "focus-visible:ring-ring "text-base "disabled:cursor-not-allowed flex min-h-[80px] w-full rounded-md border px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 md:text-sm`,
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
