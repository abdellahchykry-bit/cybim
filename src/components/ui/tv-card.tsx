import * as React from "react";
import { cn } from "@/lib/utils";

interface TVCardProps extends React.HTMLAttributes<HTMLDivElement> {
  focusable?: boolean;
}

const TVCard = React.forwardRef<HTMLDivElement, TVCardProps>(
  ({ className, focusable = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        tabIndex={focusable ? 0 : undefined}
        className={cn(
          "rounded-xl border border-border card-gradient p-6 transition-all duration-200",
          focusable && "tv-focus cursor-pointer hover:border-primary/50",
          className
        )}
        {...props}
      />
    );
  }
);

TVCard.displayName = "TVCard";

const TVCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
TVCardHeader.displayName = "TVCardHeader";

const TVCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display text-xl font-bold leading-none tracking-wide", className)}
    {...props}
  />
));
TVCardTitle.displayName = "TVCardTitle";

const TVCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
TVCardDescription.displayName = "TVCardDescription";

const TVCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-4", className)} {...props} />
));
TVCardContent.displayName = "TVCardContent";

export { TVCard, TVCardHeader, TVCardTitle, TVCardDescription, TVCardContent };
