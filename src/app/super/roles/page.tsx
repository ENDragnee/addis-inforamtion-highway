"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { PlusCircle, MoreHorizontal, Edit, Trash, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { RoleForm } from "@/components/super/RoleForm";
import RoleDetailSheet from "@/components/super/role/RoleDetailSheet";
import { useGetRoles, useDeleteRole, RoleWithDetails, RoleFilters } from "@/hooks/use-roles";
import PaginationControls from "@/components/ui/pagination-controls";

export default function RolesPage() {
  // --- STATE MANAGEMENT ---
  const [filters, setFilters] = useState<RoleFilters>({
    page: 1,
    limit: 10,
    search: '',
  });
  const [debouncedSearch] = useDebounce(filters.search, 500);

  // State for controlling modals and selected data
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithDetails | null>(null);
  const [roleToView, setRoleToView] = useState<RoleWithDetails | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleWithDetails | null>(null);

  // --- DATA FETCHING & MUTATIONS ---
  const { data: rolesData, isLoading, error } = useGetRoles({ ...filters, search: debouncedSearch });
  const deleteRoleMutation = useDeleteRole();

  // --- HANDLER FUNCTIONS ---
  const handleCreate = () => { setSelectedRole(null); setIsFormOpen(true); };
  const handleEdit = (role: RoleWithDetails) => { setSelectedRole(role); setIsFormOpen(true); };
  const handleViewDetails = (role: RoleWithDetails) => { setRoleToView(role); };
  const handleDelete = (role: RoleWithDetails) => { setRoleToDelete(role); };
  
  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id, {
        onSuccess: () => setRoleToDelete(null), // Close dialog on success
      });
    }
  };

  // --- RENDER LOGIC ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Define the types of institutions and their data capabilities.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search by role name..."
            className="max-w-sm"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ROLE</TableHead>
                  <TableHead>ASSOCIATED SCHEMAS</TableHead>
                  <TableHead>INSTITUTIONS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loading text="" /></TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-destructive">Error: {error.message}</TableCell></TableRow>
                ) : rolesData?.data.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No roles found.</TableCell></TableRow>
                ) : (
                  rolesData?.data.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-muted-foreground max-w-[300px] truncate">{role.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.dataSchemas.slice(0, 3).map(s => <Badge key={s.id} variant="secondary">{s.schemaId}</Badge>)}
                          {role.dataSchemas.length > 3 && <Badge variant="outline">+{role.dataSchemas.length - 3}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{role.institutionCount}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleViewDetails(role)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleEdit(role)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleDelete(role)} className="text-destructive"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          {rolesData && rolesData.meta.total > 0 && (
            <PaginationControls
              page={filters.page}
              totalPages={rolesData.meta.totalPages}
              onPageChange={(page) => setFilters(prev => ({...prev, page}))}
              totalItems={rolesData.meta.total}
              limit={filters.limit}
            />
          )}
        </CardFooter>
      </Card>
      
      {/* Modals and Sheets are rendered here, their visibility controlled by state */}
      <RoleForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        role={selectedRole} 
      />

      <RoleDetailSheet 
        role={roleToView} 
        onOpenChange={(open) => !open && setRoleToView(null)} 
      />

      {roleToDelete && (
        <ConfirmationDialog
          isOpen={!!roleToDelete}
          onClose={() => setRoleToDelete(null)}
          onConfirm={confirmDelete}
          title={`Delete Role: ${roleToDelete.name}?`}
          description="Are you sure you want to delete this role? This action will fail if the role is currently in use."
          confirmText="Delete"
        />
      )}
    </div>
  );
}
