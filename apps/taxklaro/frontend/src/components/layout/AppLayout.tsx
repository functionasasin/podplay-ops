import { useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent } from '../ui/sheet';
import { SidebarContent } from './SidebarContent';

// Desktop: fixed 256px sidebar + main content
// Mobile: hamburger → Sheet drawer from left
export function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen" data-testid="app-layout">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-64 flex-col border-r border-border/60 bg-background"
        data-testid="sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0" data-testid="sidebar-mobile">
          <SidebarContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display text-lg tracking-tight text-foreground">
            <span className="text-primary">₱</span>TaxKlaro
          </span>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
