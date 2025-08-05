"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { PlusCircle, MoreHorizontal, Edit, Trash, Eye, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import SchemaForm from "@/components/super/SchemaForm";
import SchemaDetailSheet from "@/components/super/schema/SchemaDetailSheet";
import { useGetSchemas, useDeleteSchema, SchemaWithCount, SchemaFilters } from "@/hooks/use-schemas";
import PaginationControls from "@/components/ui/pagination-controls";

export default function SchemasPage() {
  // --- STATE MANAGEMENT ---
  const [filters, setFilters] = useState<SchemaFilters>({
    page: 1,
    limit: 10,
    search: '',
    sort: 'schemaId:asc', // Default sort
  });
  const [debouncedSearch] = useDebounce(filters.search, 500);

  // State for modals and selected data
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<SchemaWithCount | null>(null);
  const [schemaToView, setSchemaToView] = useState<SchemaWithCount | null>(null);
  const [schemaToDelete, setSchemaToDelete] = useState<SchemaWithCount | null>(null);

  // --- DATA FETCHING & MUTATIONS ---
  const { data: schemasData, isLoading, error } = useGetSchemas({ ...filters, search: debouncedSearch });
  const deleteSchemaMutation = useDeleteSchema();

  // --- HANDLER FUNCTIONS ---
  const handleSort = (field: 'schemaId' | 'relationshipCount') => {
    const [currentField, currentOrder] = filters.sort.split(':');
    const newOrder = currentField === field && currentOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sort: `${field}:${newOrder}` }));
  };

  const handleCreate = () => { setSelectedSchema(null); setIsFormOpen(true); };
  const handleEdit = (schema: SchemaWithCount) => { setSelectedSchema(schema); setIsFormOpen(true); };
  const handleView = (schema: SchemaWithCount) => { setSchemaToView(schema); };
  const handleDelete = (schema: SchemaWithCount) => { setSchemaToDelete(schema); };
  
  const confirmDelete = () => {
    if (schemaToDelete) {
      deleteSchemaMutation.mutate(schemaToDelete.id, {
        onSuccess: () => setSchemaToDelete(null),
      });
    }
  };

  // --- RENDER LOGIC ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Schema Management</h1>
          <p className="text-muted-foreground">Define the types of data that can be exchanged in the network.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Schema
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or description..."
              className="pl-8 max-w-sm"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('schemaId')} className="-ml-4">
                      Schema ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('relationshipCount')}>
                      Rules
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loading text="" /></TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-destructive">Error: {error.message}</TableCell></TableRow>
                ) : schemasData?.data.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No schemas found.</TableCell></TableRow>
                ) : (
                  schemasData?.data.map((schema) => (
                    <TableRow key={schema.id}>
                      <TableCell className="font-mono font-medium">{schema.schemaId}</TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">{schema.description}</TableCell>
                      <TableCell>{schema.relationshipCount}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleView(schema)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleEdit(schema)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDelete(schema)} className="text-destructive"><Trash className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
          {schemasData && schemasData.meta.total > 0 && (
            <PaginationControls
              page={filters.page}
              totalPages={schemasData.meta.totalPages}
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
              totalItems={schemasData.meta.total}
              limit={filters.limit}
            />
          )}
        </CardFooter>
      </Card>

      {/* Modals and Sheets are rendered here, their visibility controlled by state */}
      <SchemaForm 
        schema={selectedSchema} 
        onClose={() => setIsFormOpen(false)} 
        isOpen={isFormOpen} 
      />
      
      <SchemaDetailSheet 
        schema={schemaToView} 
        onOpenChange={(open) => !open && setSchemaToView(null)} 
      />

      {schemaToDelete && (
        <ConfirmationDialog
          isOpen={!!schemaToDelete}
          onClose={() => setSchemaToDelete(null)}
          onConfirm={confirmDelete}
          title={`Delete Schema: ${schemaToDelete.schemaId}?`}
          description="Are you sure you want to delete this schema? This action will fail if the schema is currently used in any relationships."
          confirmText="Delete"
        />
      )}
    </div>
  );
}
