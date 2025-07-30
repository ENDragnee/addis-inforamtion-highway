'use client';

import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Check, X, Trash2 } from 'lucide-react';
import { Session } from 'next-auth';

// Define a more specific type for a relationship
type Relationship = {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED';
  requesterRole: { id: string; name: string };
  providerRole: { id: string; name: string };
  dataSchema: { id: string; schemaId: string };
  proposedByInstitutionId: string;
};

interface RelationshipsTableProps {
  relationships: Relationship[];
  session: Session;
  mutate: () => void;
}

export default function RelationshipsTable({ relationships, session, mutate }: RelationshipsTableProps) {
  const handleUpdateStatus = (relationshipId: string, status: 'ACTIVE' | 'REJECTED' | 'REVOKED') => {
    const promise = axios.patch(`/api/dashboard/relationships/${relationshipId}`, { status });

    toast.promise(promise, {
      loading: 'Updating status...',
      success: () => {
        mutate();
        return `Relationship status updated to ${status}.`;
      },
      error: 'Failed to update status.',
    });
  };

  const getBadgeVariant = (status: Relationship['status']) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'PENDING': return 'secondary';
      case 'REJECTED':
      case 'REVOKED': return 'destructive';
      default: return 'outline';
    }
  };

  const myInstitutionId = session.user.institutionId;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Requester</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Schema</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {relationships.map((rel) => {
          const amIRequester = rel.proposedByInstitutionId === myInstitutionId;
          const amIProvider = !amIRequester;
          
          return (
            <TableRow key={rel.id}>
              <TableCell className="font-medium">{rel.requesterRole.name}</TableCell>
              <TableCell>{rel.providerRole.name}</TableCell>
              <TableCell>{rel.dataSchema.schemaId}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(rel.status)}>{rel.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {rel.status === 'PENDING' && amIProvider && (
                      <>
                        <DropdownMenuItem onSelect={() => handleUpdateStatus(rel.id, 'ACTIVE')}>
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleUpdateStatus(rel.id, 'REJECTED')}>
                          <X className="mr-2 h-4 w-4" /> Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {rel.status === 'ACTIVE' && (
                      <DropdownMenuItem onSelect={() => handleUpdateStatus(rel.id, 'REVOKED')} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Revoke
                      </DropdownMenuItem>
                    )}
                     {rel.status !== 'ACTIVE' && rel.status !== 'PENDING' && (
                      <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
