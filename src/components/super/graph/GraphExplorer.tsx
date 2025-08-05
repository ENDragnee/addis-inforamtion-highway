"use client";

import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow, useNodesState, useEdgesState, useReactFlow, Position, Background, Controls, BackgroundVariant, Node, Edge, Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { GraphNode, GraphEdge } from '@/hooks/use-graph-data';
import GraphNodeComponent from '@/components/super/graph/GraphNode';
import InspectorPanel from '@/components/super/graph/InspectorPanel';
import CustomEdge from '@/components/super/edges/CustomEdge';

const nodeTypes = { institution: GraphNodeComponent };
// All edge types will use the same component, which internally checks the `type` prop
const edgeTypes = { active: CustomEdge, pending: CustomEdge, revoked: CustomEdge, default: CustomEdge };

const getLayoutedElements = (nodes: GraphNode[], edges: GraphEdge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 50 });
  const nodeWidth = 192;
  const nodeHeight = 88;
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return { ...node, targetPosition: Position.Top, sourcePosition: Position.Bottom, position: { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y - nodeHeight / 2 } };
    }),
    edges: edges // Return the edges
  };
};

interface GraphExplorerProps {
  allNodes: GraphNode[];
  filteredEdges: GraphEdge[];
  focusedNode: string | null;
  onNodesPopulated: (nodes: Node[]) => void;
  onNewConnection: (connection: Connection) => void;
}

export default function GraphExplorer({ allNodes, filteredEdges, focusedNode, onNodesPopulated, onNewConnection }: GraphExplorerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const { setCenter, fitView, getNode } = useReactFlow();

  useEffect(() => {
    if (allNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(allNodes, filteredEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      onNodesPopulated(layoutedNodes);
      window.requestAnimationFrame(() => fitView({ duration: 500, padding: 0.1 }));
    }
  }, [allNodes, filteredEdges, setNodes, setEdges, fitView, onNodesPopulated]);

  useEffect(() => {
    if (focusedNode) {
      const node = getNode(focusedNode);
      if (node) {
        setCenter(node.position.x + (node.width ?? 0) / 2, node.position.y + (node.height ?? 0) / 2, { zoom: 1.2, duration: 800 });
      }
    } else {
      fitView({ duration: 800 });
    }
  }, [focusedNode, getNode, setCenter, fitView]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge as GraphEdge);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  const onConnect = useCallback((params: Connection) => {
    if (params.source === params.target) return;
    if (onNewConnection) {
      onNewConnection(params);
    } else {
      console.error("onNewConnection prop is missing from GraphExplorer component!");
    }
  }, [onNewConnection]);

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="dark:opacity-20" />
          <Controls />
        </ReactFlow>
      </div>
      <InspectorPanel edge={selectedEdge} onClose={() => setSelectedEdge(null)} />
    </div>
  );
}
