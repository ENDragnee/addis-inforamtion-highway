import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Node } from '@xyflow/react';

type ControlPanelProps = {
    setFocusedNode: (nodeId: string | null) => void;
    nodes: Node[];
    setLayoutMode: (mode: 'force-directed' | 'hierarchical') => void;
    setFilterStatus: (status: { pending: boolean; active: boolean; revoked: boolean }) => void;
};

const ControlPanel = ({ setFocusedNode, nodes, setLayoutMode, setFilterStatus }: ControlPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchingNodes, setMatchingNodes] = useState<Node[]>([]);
  const [filterStatus, setLocalFilterStatus] = useState({
    pending: false,
    active: true,
    revoked: false,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term) {
      const matches = nodes.filter(node => (node.data as { label: string }).label.toLowerCase().includes(term.toLowerCase()));
      setMatchingNodes(matches);
    } else {
      setMatchingNodes([]);
      setFocusedNode(null);
    }
  };

  const handleSelectNode = (nodeId: string) => {
    setFocusedNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        setSearchTerm((node.data as { label: string }).label);
    }
    setMatchingNodes([]);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    setLocalFilterStatus(prevStatus => {
      const newStatus = { ...prevStatus, [id.replace('-filter', '')]: checked };
      setFilterStatus(newStatus);
      return newStatus;
    });
  };

  return (
    <div className="w-64 p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Controls</h2>
      <div className="mb-4">
        <label htmlFor="focus-search" className="block text-sm font-medium text-gray-700 mb-1">Focus On</label>
        <Input id="focus-search" type="search" placeholder="Search Institution..." value={searchTerm} onChange={handleSearchChange} />
        {matchingNodes.length > 0 && (
          <ul className="border rounded-md mt-1">
            {matchingNodes.map(node => (
              <li key={node.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectNode(node.id)}>
                {(node.data as { label: string }).label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Layout Modes</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setLayoutMode('force-directed')}>Force Directed</Button>
          <Button variant="outline" size="sm" onClick={() => setLayoutMode('hierarchical')}>Hierarchical</Button>
        </div>
      </div>
      <div>
        <h3 className="text-md font-semibold mb-2">Filters</h3>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="pending-filter" checked={filterStatus.pending} onChange={handleFilterChange} />
          <label htmlFor="pending-filter">Pending</label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="active-filter" checked={filterStatus.active} onChange={handleFilterChange} />
          <label htmlFor="active-filter">Active</label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="revoked-filter" checked={filterStatus.revoked} onChange={handleFilterChange} />
          <label htmlFor="revoked-filter">Revoked</label>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;