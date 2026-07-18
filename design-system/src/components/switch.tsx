import { Switch as BaseSwitch } from "@base-ui/react/switch";
import * as React from "react";
import { cn } from "../lib/utils.js";

export type SwitchProps = React.ComponentProps<typeof BaseSwitch.Root>;

export const Switch = React.forwardRef<React.ComponentRef<typeof BaseSwitch.Root>, SwitchProps>(
  ({ className, ...props }, ref) => (
    <BaseSwitch.Root
      ref={ref}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="pointer-events-none block size-3.5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[checked]:translate-x-4 data-[unchecked]:translate-x-0" />
    </BaseSwitch.Root>
  ),
);
Switch.displayName = "Switch";
