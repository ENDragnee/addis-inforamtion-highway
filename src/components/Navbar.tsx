'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitcher } from './ThemeSwitcher';
import { GitBranch } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/login', label: 'Login' },
    //{ href: '/signup', label: 'Sign Up' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <nav className="container mx-auto flex items-center justify-between p-4">
        {/* CHANGED: Using text-accent for the brand color */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-accent">
          <GitBranch />
          <span>Addis-Information-Highway</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // CHANGED: Using semantic colors for active/inactive states
              className={`text-sm font-medium transition-colors hover:text-accent ${
                pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <ThemeSwitcher />
      </nav>
      {/* CHANGED: Using the semantic border color */}
      <hr className="border-border" />
    </header>
  );
}
