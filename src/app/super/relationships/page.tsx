"use client";

import { useState, useMemo, useCallback } from 'react';
import { ReactFlowProvider, Node, Connection } from '@xyflow/react';

import { useGetGraphData, GraphEdge } from '@/hooks/use-graph-data';
import { useGetRoles } from '@/hooks/use-roles';
import { useGetSchemas } from '@/hooks/use-schemas';

import GraphExplorer from '@/components/super/graph/GraphExplorer';
import ControlHeader, { FilterStatus, ViewMode, NodeData } from '@/components/super/graph/ControlHeader';
import RelationshipsTable from '@/components/super/graph/RelationshipsTable';
import CreateRelationshipDialog from '@/components/super/graph/CreateRelationshipDialog';
import { Card, CardContent } from '@/components/ui/card';
import Loading from '@/components/ui/loading';

export default function RelationshipsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>({
    pending: true,
    active: true,
    revoked: false,
  });
  const [newConnection, setNewConnection] = useState<Connection | null>(null);

  // This page is now the single source of truth for all data.
  const { data: graphData, isLoading: isGraphLoading, error: graphError } = useGetGraphData();
  const { data: roles, isLoading: areRolesLoading } = useGetRoles();
  const { data: schemas, isLoading: areSchemasLoading } = useGetSchemas();
  
  const isLoading = isGraphLoading || areRolesLoading || areSchemasLoading;
  const error = graphError; // Can be expanded to combine errors

  const filteredEdges = useMemo(() => {
    if (!graphData?.edges) return [];
    return graphData.edges.filter((edge: GraphEdge) => {
      if (edge.data?.status === 'PENDING' && !filterStatus.pending) return false;
      if (edge.data?.status === 'ACTIVE' && !filterStatus.active) return false;
      if (edge.data?.status === 'REVOKED' && !filterStatus.revoked) return false;
      return true;
    });
  }, [graphData?.edges, filterStatus]);
  
  const onNodesPopulated = useCallback((populatedNodes: Node[]) => {
    setNodes(populatedNodes as Node<NodeData>[]);
  }, []);

  const handleNewConnection = useCallback((connection: Connection) => {
    setNewConnection(connection);
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <ControlHeader
        nodes={nodes}
        setFocusedNode={setFocusedNode}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
       />
       
       {isLoading ? (
          <Card className="w-full h-[75vh]">
            <Loading text="Loading relationship data..." />
          </Card>
       ) : viewMode === 'graph' ? (
          <Card className="w-full h-[75vh] flex flex-col">
            <CardContent className="flex-1 p-0 relative">
              <ReactFlowProvider>
                <GraphExplorer 
                  allNodes={graphData?.nodes || []}
                  filteredEdges={filteredEdges}
                  focusedNode={focusedNode}
                  onNodesPopulated={onNodesPopulated}
                  onNewConnection={handleNewConnection}
                />
              </ReactFlowProvider>
            </CardContent>
          </Card>
       ) : (
          // THE FIX: Pass the fetched `roles` and `schemas` data as props.
          <RelationshipsTable 
            edges={filteredEdges} 
            roles={roles || []}
            schemas={schemas || []}
          />
       )}

       <CreateRelationshipDialog
         isOpen={!!newConnection}
         onClose={() => setNewConnection(null)}
         sourceRole={newConnection?.source ? { id: newConnection.source, name: nodes.find(n => n.id === newConnection.source)?.data.label || '' } : null}
         targetRole={newConnection?.target ? { id: newConnection.target, name: nodes.find(n => n.id === newConnection.target)?.data.label || '' } : null}
         roles={roles || []}
         schemas={schemas || []}
       />
    </div>
  );
}
