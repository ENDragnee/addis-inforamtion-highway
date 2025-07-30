'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import { 
  LayoutDashboard, 
  Building, 
  ListCollapse, 
  LogOut,
  GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/super/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super/dashboard/institutions', label: 'Institutions', icon: Building },
  { href: '/super/dashboard/datarequests', label: 'Data Requests', icon: ListCollapse },
];

interface SuperSidebarProps {
  user: Session['user'];
}

export default function SuperSidebar({ user }: SuperSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <Link href="/super/dashboard" className="flex items-center gap-2 font-bold text-lg text-accent">
          <GitBranch />
          <span>TrustBroker Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                ${isActive
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto">
        <div className="mb-4">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </aside>
  );
}
