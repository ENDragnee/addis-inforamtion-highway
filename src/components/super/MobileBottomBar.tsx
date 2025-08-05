'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building, 
  Link2,
  ScrollText
} from 'lucide-react';

// A smaller set of primary navigation items for mobile
const mobileNavItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/super/dashboard' },
  { name: 'Institutions', icon: Building, href: '/super/dashboard/institutions' },
  { name: 'Relationships', icon: Link2, href: '/super/dashboard/relationships' },
  { name: 'Requests', icon: ScrollText, href: '/super/dashboard/datarequests' },
];

export default function MobileBottomBar() {
  const pathname = usePathname();

  return (
    // This bar is fixed to the bottom and only visible on small screens (sm:hidden)
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t sm:hidden">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {mobileNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`inline-flex flex-col items-center justify-center px-5 group
                ${isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted'}
              `}
            >
              <item.icon className={`w-5 h-5 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
