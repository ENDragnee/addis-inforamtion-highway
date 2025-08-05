"use client";

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ReactFlow, addEdge, useNodesState, useEdgesState, Connection, Edge, Node, useReactFlow, ReactFlowProvider, Position } from '@xyflow/react';
import { AppEdge } from '@/lib/types';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import InstitutionNode from '@/components/super/InstitutionNode';
import InspectorPanel from '@/components/super/InspectorPanel';
import ActiveEdge from '@/components/super/edges/ActiveEdge';
import PendingEdge from '@/components/super/edges/PendingEdge';
import RevokedEdge from '@/components/super/edges/RevokedEdge';

const nodeTypes = {
  institution: InstitutionNode,
};

const edgeTypes = {
  active: ActiveEdge,
  pending: PendingEdge,
  revoked: RevokedEdge,
};



const initialNodes: Node[] = [
  { id: '1', type: 'institution', data: { label: 'Awash Bank', role: 'Bank' }, position: { x: 250, y: 5 } },
  { id: '2', type: 'institution', data: { label: 'Ministry of Trade', role: 'Government' }, position: { x: 100, y: 200 } },
  { id: '3', type: 'institution', data: { label: 'Ethio Telecom', role: 'Telecom' }, position: { x: 400, y: 200 } },
  { id: '4', type: 'institution', data: { label: 'Ministry of Revenue', role: 'Government' }, position: { x: 250, y: 400 } },
];

const initialEdges: AppEdge[] = [
    { id: 'e1-2', source: '1', target: '2', label: 'SalaryVerification_v1', type: 'active', data: { status: 'active', proposedBy: 'Awash Bank' }, style: {} },
    { id: 'e1-3', source: '1', target: '3', label: 'Proof_of_Employment_v1', type: 'pending', data: { status: 'pending', proposedBy: 'Ethio Telecom' }, style: {} },
    { id: 'e4-1', source: '4', target: '1', label: 'TIN_Certificate', type: 'revoked', data: { status: 'revoked', proposedBy: 'Ministry of Revenue' }, style: {} },
];



type GraphExplorerProps = {
    focusedNode: string | null;
    setNodes: (nodes: Node[]) => void;
    layoutMode: 'hierarchical' | 'force-directed';
    filterStatus: { pending: boolean; active: boolean; revoked: boolean };
};

const GraphExplorer = ({ focusedNode, setNodes: setParentNodes, layoutMode, filterStatus }: GraphExplorerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState<AppEdge | null>(null);
  const { setCenter, getNode, fitView } = useReactFlow();

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  const [displayNodes, setDisplayNodes] = useState<Node[]>(nodes);
  const [displayEdges, setDisplayEdges] = useState<AppEdge[]>(edges);

  const getLayoutedElements = useCallback((nodes: Node[], edges: AppEdge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    const layoutedNodes = nodes.map(node => {
      dagreGraph.setNode(node.id, { width: 150, height: 150 });
      return { ...node }; // Create a copy
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return {
      nodes: layoutedNodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          position: {
            x: nodeWithPosition.x - 150 / 2,
            y: nodeWithPosition.y - 150 / 2,
          },
        };
      }),
      edges: edges.map(edge => ({ ...edge, data: { status: edge.data?.status || 'active', label: typeof edge.label === 'string' ? edge.label : undefined } })), // Ensure data has status and label
    };
  }, []);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    setParentNodes(nodes);
  }, [nodes, setParentNodes]);

  useEffect(() => {
    if (layoutMode) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodesRef.current,
            edgesRef.current,
            layoutMode === 'hierarchical' ? 'TB' : 'LR'
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        window.requestAnimationFrame(() => {
            fitView();
        });
    }
  }, [layoutMode, fitView, setNodes, setEdges, getLayoutedElements]);

  useEffect(() => {
    let currentDisplayNodes = nodesRef.current;
    let currentDisplayEdges = edgesRef.current;

    if (focusedNode) {
        const node = getNode(focusedNode);
        if(node) {
            setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 500 });

            const connectedEdgeIds = new Set<string>();
            const connectedNodeIds = new Set<string>();

            currentDisplayEdges = edgesRef.current.filter(edge => {
              if (edge.source === focusedNode || edge.target === focusedNode) {
                connectedEdgeIds.add(edge.id);
                connectedNodeIds.add(edge.source);
                connectedNodeIds.add(edge.target);
                return true;
              }
              return false;
            });

            currentDisplayNodes = nodesRef.current.filter(n =>
              n.id === focusedNode || connectedNodeIds.has(n.id)
            );

        }
    } 

    // Apply filterStatus to the currentDisplayEdges
    currentDisplayEdges = currentDisplayEdges.filter(edge => {
      if (edge.data?.status === 'pending' && !filterStatus.pending) return false;
      if (edge.data?.status === 'active' && !filterStatus.active) return false;
      if (edge.data?.status === 'revoked' && !filterStatus.revoked) return false;
      return true;
    });

    setDisplayNodes(currentDisplayNodes.map(n => ({ ...n, style: { ...n.style, opacity: 1 } })));
    setDisplayEdges(currentDisplayEdges.map(e => ({ ...e, style: { ...e.style, opacity: 1 } })));

  }, [focusedNode, setCenter, getNode, nodesRef, edgesRef, filterStatus]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((els) => {
      const newEdge = { ...params, data: { status: 'pending', label: 'New Relationship' } } as AppEdge;
      return addEdge(newEdge, els) as AppEdge[];
    }),
    [setEdges],
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge as AppEdge);
  }, []);

  const handleApprove = () => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === selectedEdge.id) {
            return {
              ...edge,
              data: { ...edge.data, status: 'active' },
              style: { stroke: 'green' },
              animated: false,
            };
          }
          return edge;
        }),
      );
      setSelectedEdge(null);
    }
  };

  const handleReject = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  const handleRevoke = () => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === selectedEdge.id) {
            return {
              ...edge,
              data: { ...edge.data, status: 'revoked' },
              type: 'revoked',
              style: { stroke: 'red' },
              animated: false,
            };
          }
          return edge;
        }),
      );
      setSelectedEdge(null);
    }
  };

  return (
    <div className="flex h-screen">
        <div className="flex-1">
            <ReactFlow
                nodes={displayNodes}
                edges={displayEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
            />
        </div>
        <InspectorPanel edge={selectedEdge} onApprove={handleApprove} onReject={handleReject} onRevoke={handleRevoke} />
    </div>
  );
};

const GraphExplorerWrapper = (props: GraphExplorerProps) => (
    <ReactFlowProvider>
        <GraphExplorer {...props} />
    </ReactFlowProvider>
);

export default GraphExplorerWrapper;
