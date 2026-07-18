import { Select as BaseSelect } from "@base-ui/react/select";
import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils.js";

export const Select = BaseSelect.Root;

export const SelectValue = BaseSelect.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Trigger>,
  React.ComponentProps<typeof BaseSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors data-[popup-open]:bg-accent hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground",
      className,
    )}
    {...props}
  >
    {children}
    <BaseSelect.Icon className="ml-2 size-4 opacity-50">
      <svg viewBox="0 0 16 16" fill="currentColor" className="block size-4">
        <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
      </svg>
    </BaseSelect.Icon>
  </BaseSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Popup>,
  React.ComponentProps<typeof BaseSelect.Popup>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Portal>
    <BaseSelect.Positioner className="z-50 outline-hidden" sideOffset={4}>
      <BaseSelect.Popup
        ref={ref}
        className={cn(
          "min-w-[var(--anchor-width)] origin-[var(--transform-origin)] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-hidden transition-[transform,opacity] data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      >
        <BaseSelect.List className="relative max-h-[var(--available-height)] overflow-y-auto py-1">
          {children}
        </BaseSelect.List>
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  </BaseSelect.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Item>,
  React.ComponentProps<typeof BaseSelect.Item>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Item
    ref={ref}
    className={cn(
      "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1.5 pr-2 pl-2.5 text-sm outline-hidden select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
      className,
    )}
    {...props}
  >
    <BaseSelect.ItemIndicator className="col-start-1 flex items-center justify-center">
      <Check className="size-4" />
    </BaseSelect.ItemIndicator>
    <BaseSelect.ItemText className="col-start-2">{children}</BaseSelect.ItemText>
  </BaseSelect.Item>
));
SelectItem.displayName = "SelectItem";
