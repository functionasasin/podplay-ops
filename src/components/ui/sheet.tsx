import { DrawerPreview as DrawerPrimitive } from '@base-ui/react/drawer';
import * as React from 'react';
import { cn } from '@/lib/utils';

const Sheet = DrawerPrimitive.Root;
const SheetTrigger = DrawerPrimitive.Trigger;
const SheetClose = DrawerPrimitive.Close;
const SheetPortal = DrawerPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Backdrop
    ref={ref as React.Ref<HTMLDivElement>}
    className={cn('fixed inset-0 z-50 bg-black/80', className)}
    {...(props as object)}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DrawerPrimitive.Popup
      ref={ref}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-background shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </DrawerPrimitive.Popup>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent };
