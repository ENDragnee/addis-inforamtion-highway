"use client"

import { useState } from "react"
import { PlusCircle, MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import RoleForm from "@/components/super/RoleForm"
import React from "react"

// Define the Data Structure (TypeScript)
type Role = {
  id: string
  name: string
  description: string
  institutionCount: number
}

// Create Mock Data
const mockRoles: Role[] = [
  {
    id: "role_001",
    name: "Bank",
    description: "Financial institutions providing banking services.",
    institutionCount: 5,
  },
  {
    id: "role_002",
    name: "Government Agency",
    description: "Government bodies and departments.",
    institutionCount: 3,
  },
  {
    id: "role_003",
    name: "Employer",
    description: "Organizations employing individuals.",
    institutionCount: 12,
  },
  {
    id: "role_004",
    name: "University",
    description: "Educational institutions offering higher education.",
    institutionCount: 8,
  },
]

export default function RolesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const handleCreateRole = () => {
    setSelectedRole(null)
    setIsFormOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsFormOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    console.log("Delete role:", role.name)
    // Implement delete logic here
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedRole(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Role Management</h1>
        <Button onClick={handleCreateRole}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Role
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">ROLE NAME</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead>INSTITUTIONS</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>{role.institutionCount}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRole(role)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteRole(role)} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RoleForm
        role={selectedRole}
        onClose={handleCloseForm}
        isOpen={isFormOpen}
      />
    </div>
  )
}
