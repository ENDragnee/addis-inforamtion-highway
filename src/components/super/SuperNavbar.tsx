'use client';

import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, GitBranch } from 'lucide-react';
import Link from 'next/link';

// Re-using the navItems for the mobile-friendly sheet menu
const navItems = [
  { href: '/super/dashboard', label: 'Dashboard' },
  { href: '/super/dashboard/institutions', label: 'Institutions' },
  { href: '/super/dashboard/datarequests', label: 'Data Requests' },
];

export default function SuperNavbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      
      {/* Mobile-only Hamburger Menu using Shadcn's Sheet component */}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/super/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <GitBranch className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">TrustBroker Admin</span>
            </Link>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Breadcrumbs or Search could go here in the future */}
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Placeholder for future Search Bar */}
      </div>

      {/* Theme Switcher aligned to the right */}
      <ThemeSwitcher />
      
      {/* A User Profile Dropdown would typically go here as well */}
    </header>
  );
}
