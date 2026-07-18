import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import * as React from "react";
import { cn } from "../lib/utils.js";

export const TooltipProvider = BaseTooltip.Provider;
export const Tooltip = BaseTooltip.Root;

export const TooltipTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseTooltip.Trigger>,
  React.ComponentProps<typeof BaseTooltip.Trigger>
>(({ className, ...props }, ref) => (
  <BaseTooltip.Trigger ref={ref as never} className={cn(className)} {...props} />
));
TooltipTrigger.displayName = "TooltipTrigger";

export const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof BaseTooltip.Popup>,
  React.ComponentProps<typeof BaseTooltip.Popup> & {
    sideOffset?: number;
  }
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <BaseTooltip.Portal>
    <BaseTooltip.Positioner sideOffset={sideOffset}>
      <BaseTooltip.Popup
        ref={ref}
        className={cn(
          "relative z-50 max-w-xs rounded-md border border-border bg-popover px-2.5 py-1.5 text-sm text-popover-foreground shadow-md transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      >
        {children}
      </BaseTooltip.Popup>
    </BaseTooltip.Positioner>
  </BaseTooltip.Portal>
));
TooltipContent.displayName = "TooltipContent";
