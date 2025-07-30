'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Link2,
  Building,
  FileCode,
  Users,
  GitBranch,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/relationships', label: 'Relationships', icon: Link2 },
  { href: '/dashboard/institution', label: 'My Institution', icon: Building },
  { href: '/dashboard/schemas', label: 'Data Schemas', icon: FileCode },
  { href: '/dashboard/roles', label: 'Roles', icon: Users },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <GitBranch className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Partner Dashboard</span>
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8
              ${pathname === item.href ? 'bg-muted text-foreground' : 'text-muted-foreground'}
            `}
            title={item.label} // Tooltip on hover
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
