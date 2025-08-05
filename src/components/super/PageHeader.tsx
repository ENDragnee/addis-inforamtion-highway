"use client"

import { usePathname } from "next/navigation"

export default function PageHeader() {
  const pathname = usePathname()

  const getTitle = () => {
    switch (pathname) {
      case "/admin/dashboard":
        return "Dashboard"
      case "/admin/institutions":
        return "Institution Management"
      case "/admin/roles":
        return "Role Management"
      case "/admin/relationships":
        return "Relationship Management"
      case "/admin/schemas":
        return "Schema Management"
      case "/admin/audit":
        return "Audit Trail"
      default:
        return "Admin"
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
    </header>
  )
}