"use client"

import { useState } from "react"
import { PlusCircle, MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Loading from "@/components/ui/loading"
import { ConfirmationDialog } from "@/components/ConfirmationDialog"
import SchemaForm from "@/components/super/SchemaForm"
import { useGetSchemas, useDeleteSchema, SchemaWithCount } from "@/hooks/use-schemas"

export default function SchemasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<SchemaWithCount | null>(null);
  const [schemaToDelete, setSchemaToDelete] = useState<SchemaWithCount | null>(null);

  // Fetch data using our custom hook
  const { data: schemas, isLoading, error } = useGetSchemas();
  const deleteSchemaMutation = useDeleteSchema();

  const handleAddSchema = () => {
    setSelectedSchema(null);
    setIsFormOpen(true);
  };

  const handleEditSchema = (schema: SchemaWithCount) => {
    setSelectedSchema(schema);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (schema: SchemaWithCount) => {
    setSchemaToDelete(schema);
  };
  
  const confirmDelete = () => {
    if (schemaToDelete) {
      deleteSchemaMutation.mutate(schemaToDelete.id);
      setSchemaToDelete(null); // Close the confirmation dialog
    }
  };

  if (isLoading) return <Loading text="Loading data schemas..." />;
  if (error) return <p className="text-destructive">Error: {error.message}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Schema Management</h1>
          <p className="text-muted-foreground">Define the types of data that can be exchanged in the network.</p>
        </div>
        <Button onClick={handleAddSchema}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Schema
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Schemas</CardTitle>
          <CardDescription>
            A list of all defined data schemas and the number of relationship rules using them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SCHEMA ID (URN)</TableHead>
                <TableHead>DESCRIPTION</TableHead>
                <TableHead>RULES USING</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemas?.map((schema) => (
                <TableRow key={schema.id}>
                  <TableCell className="font-mono font-medium">{schema.schemaId}</TableCell>
                  <TableCell className="text-muted-foreground">{schema.description}</TableCell>
                  <TableCell>{schema.relationshipCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditSchema(schema)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDeleteClick(schema)} className="text-destructive">
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

      <SchemaForm
        schema={selectedSchema}
        onClose={() => setIsFormOpen(false)}
        isOpen={isFormOpen}
      />

      {schemaToDelete && (
        <ConfirmationDialog
          isOpen={!!schemaToDelete}
          onClose={() => setSchemaToDelete(null)}
          onConfirm={confirmDelete}
          title={`Delete Schema: ${schemaToDelete.schemaId}?`}
          description="Are you sure you want to delete this schema? This action cannot be undone and will fail if the schema is currently used in any relationships."
          confirmText="Delete"
        />
      )}
    </div>
  );
}
