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
      <aside className="hidden md:flex w-64 flex-col border-r bg-background" data-testid="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0" data-testid="sidebar-mobile">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">TaxKlaro</span>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
