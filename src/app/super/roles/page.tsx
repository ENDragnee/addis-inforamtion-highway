"use client"

import { useState } from "react"
import { PlusCircle, MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Loading from "@/components/ui/loading"
import { RoleForm } from "@/components/super/RoleForm" // We'll create this next
import { useGetRoles, useDeleteRole, Role } from "@/hooks/use-roles" // Import our new hook
import { ConfirmationDialog } from "@/components/ConfirmationDialog" // Assuming you have this

export default function RolesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { data: roles, isLoading, error } = useGetRoles();
  const deleteRoleMutation = useDeleteRole();

  const handleCreateRole = () => {
    setSelectedRole(null)
    setIsFormOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsFormOpen(true)
  }
  
  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
      setRoleToDelete(null);
    }
  };

  if (isLoading) return <Loading text="Loading roles..." />
  if (error) return <p className="text-destructive">Error: {error.message}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Role Management</h1>
        <Button onClick={handleCreateRole}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>Define the types of institutions that can participate in the network.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ROLE NAME</TableHead>
                <TableHead>DESCRIPTION</TableHead>
                <TableHead>INSTITUTIONS</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles?.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">{role.description}</TableCell>
                  <TableCell>{role.institutionCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditRole(role)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleDeleteClick(role)} className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <RoleForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        role={selectedRole}
      />

      {roleToDelete && (
        <ConfirmationDialog
          isOpen={!!roleToDelete}
          onClose={() => setRoleToDelete(null)}
          onConfirm={confirmDelete}
          title={`Delete Role: ${roleToDelete.name}?`}
          description={`Are you sure you want to delete this role? This action cannot be undone and will fail if the role is currently assigned to any institutions.`}
          confirmText="Delete"
        />
      )}
    </div>
  )
}
