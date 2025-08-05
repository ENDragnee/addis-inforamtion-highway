'use-client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Check, X, Trash2, PlusCircle, ArrowRight } from 'lucide-react';
import { GraphEdge, useUpdateRelationshipStatus, useDeleteRelationship } from '@/hooks/use-graph-data';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import CreateRelationshipDialog from './CreateRelationshipDialog';
import { Role } from '@/generated/prisma/client'; // Import the full Role type
import { Schema } from '@/hooks/use-schemas'; // Import the Schema type

interface RelationshipsTableProps {
  edges: GraphEdge[];
  // THE FIX: Accept roles and schemas as props
  roles: Role[];
  schemas: Schema[];
}

export default function RelationshipsTable({ edges, roles, schemas }: RelationshipsTableProps) {
  const [actionToConfirm, setActionToConfirm] = useState<{ type: 'reject' | 'revoke'; edge: GraphEdge } | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  
  // THE FIX: Mutations are still handled here, but data fetching is removed.
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
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Relationships</CardTitle>
              <CardDescription>
                A complete list of all data sharing rules in the network.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
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
                {edges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No relationships match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  edges.map((edge) => (
                    <TableRow key={edge.id}>
                      <TableCell>
                        <div className="font-medium">{edge.data?.requesterName}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          Can request from <ArrowRight className="h-3 w-3" /> <span className="font-medium">{edge.data?.providerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{edge.label}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(edge.data?.status || '')} className="capitalize">
                          {edge.data?.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
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
      </Card>

      {actionToConfirm && (
        <ConfirmationDialog
          isOpen={!!actionToConfirm}
          onClose={() => setActionToConfirm(null)}
          onConfirm={handleConfirm}
          title={`Confirm ${actionToConfirm.type}`}
          description={`Are you sure you want to ${actionToConfirm.type} this rule?`}
          confirmText={actionToConfirm.type}
        />
      )}

      {/* THE FIX: The dialog now receives roles and schemas as props, no loading needed here. */}
      <CreateRelationshipDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        roles={roles}
        schemas={schemas}
      />
    </>
  );
}
