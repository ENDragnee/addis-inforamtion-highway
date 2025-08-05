'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Check, X, Trash2 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { GraphEdge, useUpdateRelationshipStatus, useDeleteRelationship } from '@/hooks/use-graph-data';
import { RelationshipStatus } from '@/generated/prisma/client';

// Define the props for the panel's content
interface InspectorPanelContentProps {
  edge: GraphEdge;
  onClose: () => void;
}

// 1. Create a dedicated component for the panel's content
function InspectorPanelContent({ edge, onClose }: InspectorPanelContentProps) {
  const updateStatusMutation = useUpdateRelationshipStatus();
  const deleteRelationshipMutation = useDeleteRelationship();

  if (!edge.data) {
    return (
      <Card className="border-none shadow-none rounded-none">
        <CardHeader><CardTitle>Error</CardTitle><CardDescription>Selected relationship has no data.</CardDescription></CardHeader>
      </Card>
    );
  }

  const handleUpdate = (status: RelationshipStatus) => {
    updateStatusMutation.mutate({ id: edge.id, status });
    onClose();
  };
  
  const handleDelete = () => {
    deleteRelationshipMutation.mutate(edge.id);
    onClose();
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'PENDING': return 'secondary';
      case 'REVOKED': case 'REJECTED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle>Relationship Details</CardTitle>
        <CardDescription>Review or manage this data sharing rule.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <Badge variant={getBadgeVariant(edge.data.status)} className="capitalize">{edge.data.status}</Badge>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Requester Role</p>
          <p>{edge.data.requesterName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Provider Role</p>
          <p>{edge.data.providerName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Data Schema</p>
          <p className="font-mono text-sm">{edge.label as React.ReactNode}</p>
          <p className="text-xs text-muted-foreground">{edge.data.description}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4 border-t">
        {edge.data.status === 'PENDING' && (
          <>
            <Button 
              onClick={() => handleUpdate('ACTIVE')} 
              className="w-full"
              disabled={updateStatusMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" /> Approve
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              className="w-full"
              disabled={deleteRelationshipMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" /> Reject
            </Button>
          </>
        )}
        {edge.data.status === 'ACTIVE' && (
          <Button 
            variant="destructive" 
            onClick={() => handleUpdate('REVOKED')} 
            className="w-full"
            disabled={updateStatusMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Revoke
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// 2. Create the main component that handles responsive rendering
export default function InspectorPanel({ edge, onClose }: { edge: GraphEdge | null; onClose: () => void; }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!edge) {
    if (isDesktop) {
      return (
        <aside className="hidden md:flex w-80 p-4 border-l bg-card flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">Select a relationship line to see details.</p>
        </aside>
      );
    }
    return null;
  }

  if (isDesktop) {
    return (
      <aside className="hidden md:block w-80 border-l bg-card">
        <InspectorPanelContent edge={edge} onClose={onClose} />
      </aside>
    );
  }

  return (
    <Sheet open={!!edge} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[75vh] p-0">
        <InspectorPanelContent edge={edge} onClose={onClose} />
      </SheetContent>
    </Sheet>
  );
}
