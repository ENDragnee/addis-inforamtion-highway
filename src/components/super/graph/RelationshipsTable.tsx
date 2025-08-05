'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MoreHorizontal, Check, X, Trash2, PlusCircle, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGetGraphData, useUpdateRelationshipStatus, useDeleteRelationship, RelationshipFilters, GraphEdge } from '@/hooks/use-graph-data';
import { useGetRoles } from '@/hooks/use-roles';
import { useGetSchemas } from '@/hooks/use-schemas';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import CreateRelationshipDialog from './CreateRelationshipDialog';
import Loading from '@/components/ui/loading';
import PaginationControls from '@/components/ui/pagination-controls';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDebounce } from 'use-debounce';

export default function RelationshipsTable() {
  const [filters, setFilters] = useState<RelationshipFilters>({
    page: 1,
    limit: 10,
    search: '',
  });
  const [debouncedSearch] = useDebounce(filters.search, 500);
  
  const [actionToConfirm, setActionToConfirm] = useState<{ type: 'reject' | 'revoke'; edge: GraphEdge } | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: graphData, isLoading: isGraphLoading, error } = useGetGraphData({ ...filters, search: debouncedSearch });
  // THE FIX: We only need to fetch the first page of roles for the dropdown.
  // We can add a search feature to this in the future if needed.
  const { data: rolesData, isLoading: areRolesLoading } = useGetRoles({ page: 1, limit: 100, search: '' });
  const { data: schemas, isLoading: areSchemasLoading } = useGetSchemas();

  const updateStatusMutation = useUpdateRelationshipStatus();
  const deleteRelationshipMutation = useDeleteRelationship();

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'PENDING': return 'secondary';
      case 'REVOKED': return 'destructive';
      default: return 'outline';
    }
  };
  
  // THE FIX: Simplified the confirm handler. It doesn't need an argument.
  const handleConfirm = () => {
    if (!actionToConfirm) return;
    if (actionToConfirm.type === 'reject') {
      deleteRelationshipMutation.mutate(actionToConfirm.edge.id);
    } else if (actionToConfirm.type === 'revoke') {
      updateStatusMutation.mutate({ id: actionToConfirm.edge.id, status: 'REVOKED' });
    }
    setActionToConfirm(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by role or schema..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isGraphLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loading text="" /></TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-destructive">Error: {error.message}</TableCell></TableRow>
                ) : graphData?.edges.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No relationships found.</TableCell></TableRow>
                ) : (
                  graphData?.edges.map((edge) => (
                    <TableRow key={edge.id}>
                      <TableCell>
                        <div className="font-medium">{edge.data?.requesterName}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          Can request from <ArrowRight className="h-3 w-3" /> <span className="font-medium">{edge.data?.providerName}</span>
                        </div>
                      </TableCell>
                      <TableCell><div className="font-mono text-xs">{edge.label}</div></TableCell>
                      <TableCell><Badge variant={getBadgeVariant(edge.data?.status || '')} className="capitalize">{edge.data?.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {edge.data?.status === 'PENDING' && (
                              <>
                                <DropdownMenuLabel>Review Proposal</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => updateStatusMutation.mutate({ id: edge.id, status: 'ACTIVE' })}>
                                  <Check className="mr-2 h-4 w-4 text-green-500" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setActionToConfirm({ type: 'reject', edge })} className="text-destructive">
                                  <X className="mr-2 h-4 w-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {edge.data?.status === 'ACTIVE' && (
                              <DropdownMenuItem onSelect={() => setActionToConfirm({ type: 'revoke', edge })} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Revoke
                              </DropdownMenuItem>
                            )}
                            {edge.data?.status === 'REVOKED' && (
                              <DropdownMenuItem disabled>Rule is Revoked</DropdownMenuItem>
                            )}
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
          {graphData && graphData.meta.total > 0 && (
            <PaginationControls 
              page={filters.page}
              totalPages={graphData.meta.totalPages}
              onPageChange={(page) => setFilters(prev => ({...prev, page}))}
              totalItems={graphData.meta.total}
              limit={filters.limit}
            />
          )}
        </CardFooter>
      </Card>

      {actionToConfirm && (
        <ConfirmationDialog
          isOpen={!!actionToConfirm}
          onClose={() => setActionToConfirm(null)}
          onConfirm={handleConfirm}
          title={`Confirm ${actionToConfirm.type}`}
          // THE FIX: Corrected typo from `actionToTearm` to `actionToConfirm`
          description={`Are you sure you want to ${actionToConfirm.type} this rule?`}
          confirmText={actionToConfirm.type}
        />
      )}

      {areRolesLoading || areSchemasLoading ? (
         <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent><Loading text="Loading form data..." /></DialogContent>
         </Dialog>
      ) : (
        <CreateRelationshipDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          // THE FIX: Extract the `data` array from the paginated response object
          roles={rolesData?.data || []}
          schemas={schemas || []}
        />
      )}
    </>
  );
}
