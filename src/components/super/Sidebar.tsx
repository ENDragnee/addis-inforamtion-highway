'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  Link2, 
  Database, 
  ScrollText, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// UPDATED: Paths are now correct for the /super route
const navigationItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/super/dashboard' },
  { name: 'Institutions', icon: Building, href: '/super/institutions' },
  { name: 'Roles', icon: Users, href: '/super/roles' },
  { name: 'Relationships', icon: Link2, href: '/super/relationships' },
  { name: 'Data Schemas', icon: Database, href: '/super/schemas' },
  { name: 'Data Requests', icon: ScrollText, href: '/super/datarequests' },
];

interface SidebarProps {
  session: Session;
}

export default function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const user = session.user;
  const userInitials = user.name?.split(' ').map(n => n[0]).join('') || 'S';

  return (
    // UPDATED: Responsive classes to hide on mobile, and semantic styling
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex md:w-64">
      {/* Sidebar Header */}
      <div className="flex h-14 items-center border-b px-4 md:px-6">
        <Link href="/super/dashboard" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="hidden md:inline">TrustBroker Admin</span>
        </Link>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 md:px-4">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                ${isActive
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              title={item.name} // Tooltip for collapsed view
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer with User Info and Logout */}
      <div className="mt-auto border-t p-2 md:p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:inline">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
