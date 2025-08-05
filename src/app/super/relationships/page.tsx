
"use client";

import React, { useState } from 'react';
import { ReactFlowProvider, Node } from '@xyflow/react';
import GraphExplorer from './GraphExplorer';
import ControlPanel from '@/components/super/ControlPanel';

const RelationshipsPage = () => {
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'force-directed'>('hierarchical');
  const [filterStatus, setFilterStatus] = useState({
    pending: false,
    active: true,
    revoked: false,
  });

  return (
    <div className="flex h-screen">
      <ReactFlowProvider>
        <ControlPanel setFocusedNode={setFocusedNode} nodes={nodes} setLayoutMode={setLayoutMode} setFilterStatus={setFilterStatus} />
        <div className="flex-1">
          <GraphExplorer focusedNode={focusedNode} setNodes={setNodes} layoutMode={layoutMode} filterStatus={filterStatus} />
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default RelationshipsPage;
