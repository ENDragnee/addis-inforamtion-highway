"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Building, Users, LinkIcon, Database, ScrollText, ShieldCheck, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const pathname = usePathname()

  const navigationItems = [
    { name: "Dashboard", icon: Home, href: "/admin/dashboard" },
    { name: "Institutions", icon: Building, href: "/admin/institutions" },
    { name: "Roles", icon: Users, href: "/admin/roles" },
    { name: "Relationships", icon: LinkIcon, href: "/admin/relationships" },
    { name: "Data Schemas", icon: Database, href: "/admin/schemas" },
    { name: "Audit Trail", icon: ScrollText, href: "/admin/audit" },
  ]

  return (
    <aside className="w-[280px] bg-gray-800 text-gray-200 flex flex-col p-4">
      {/* Sidebar Header */}
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold">Trust Protocol Admin</h2>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-gray-700 text-white"
                    : "hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <div className="text-sm font-medium mb-2">John Doe</div>
        <Button variant="ghost" className="w-full justify-start text-gray-200 hover:bg-gray-700 hover:text-gray-50">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </aside>
  )
}