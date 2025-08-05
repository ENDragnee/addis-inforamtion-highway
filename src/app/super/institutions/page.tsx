"use client";

import { useState } from "react";
import { useDebounce } from 'use-debounce';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGetInstitutions, useUpdateInstitutionStatus, Institution, InstitutionFilters } from "@/hooks/use-institutions";
import { useGetRoles } from "@/hooks/use-roles";
import { InstitutionStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Edit, Trash, Undo2, PlusCircle, Search, CheckCircle } from "lucide-react";
import { InstitutionForm } from "@/components/super/InstitutionForm";
import Loading from "@/components/ui/loading";
import PaginationControls from "@/components/ui/pagination-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const allStatuses: (InstitutionStatus | 'all')[] = ['all', 'ACTIVE', 'PENDING', 'SUSPENDED'];

export default function InstitutionsPage() {
  // THE FIX: All filters are now managed in a single state object
  const [filters, setFilters] = useState<InstitutionFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
  });
  const [debouncedSearch] = useDebounce(filters.search, 500);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  
  // THE FIX: Pass the entire filters object to the hook
  const { data: institutionsData, isLoading: areInstitutionsLoading, error: institutionsError } = useGetInstitutions({ ...filters, search: debouncedSearch });
  const { data: roles, isLoading: areRolesLoading } = useGetRoles();
  const updateStatusMutation = useUpdateInstitutionStatus();
  
  const isLoading = areInstitutionsLoading || areRolesLoading;

  const handleFilterChange = (key: keyof InstitutionFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 on any filter change
  };

  const handleEdit = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedInstitution(null);
    setIsFormOpen(true);
  };

  const handleStatusChange = (id: string, status: InstitutionStatus) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  const getBadgeVariant = (status: InstitutionStatus) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'SUSPENDED': return 'destructive';
      case 'PENDING': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Institution Management</h1>
          <p className="text-muted-foreground">Onboard, view, and manage all partner institutions.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Institution
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>INSTITUTION</TableHead>
                  <TableHead>CLIENT ID</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loading text="" /></TableCell></TableRow>
                ) : institutionsError ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-destructive">Failed to load institutions.</TableCell></TableRow>
                ) : institutionsData?.data.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No institutions found.</TableCell></TableRow>
                ) : (
                  institutionsData?.data.map((institution) => (
                    <TableRow key={institution.id}>
                      <TableCell>
                        <div className="font-bold">{institution.name}</div>
                        <div className="text-sm text-muted-foreground">{institution.role.name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{institution.clientId}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(institution.status)}>{institution.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(institution)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {institution.status === 'ACTIVE' && <DropdownMenuItem onSelect={() => handleStatusChange(institution.id, 'SUSPENDED')} className="text-destructive"><Trash className="mr-2 h-4 w-4" /> Deactivate</DropdownMenuItem>}
                            {institution.status === 'PENDING' && <DropdownMenuItem onSelect={() => handleStatusChange(institution.id, 'ACTIVE')}><CheckCircle className="mr-2 h-4 w-4 text-green-500"/> Approve</DropdownMenuItem>}
                            {institution.status === 'SUSPENDED' && <DropdownMenuItem onSelect={() => handleStatusChange(institution.id, 'ACTIVE')}><Undo2 className="mr-2 h-4 w-4" /> Reactivate</DropdownMenuItem>}
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
          {institutionsData && institutionsData.meta.total > 0 && (
            <PaginationControls 
              page={filters.page}
              totalPages={institutionsData.meta.totalPages}
              onPageChange={(page) => handleFilterChange('page', page)}
              totalItems={institutionsData.meta.total}
              limit={filters.limit}
            />
          )}
        </CardFooter>
      </Card>

      <InstitutionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        institution={selectedInstitution}
        roles={roles || []}
      />
    </div>
  );
}
