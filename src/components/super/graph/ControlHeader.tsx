"use client";

import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { Check, ChevronsUpDown, SlidersHorizontal, Network, LayoutGrid } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// --- Type Definitions ---
export type NodeData = {
  label: string;
  role: string;
};
export type ViewMode = 'graph' | 'table';
export type FilterStatus = {
  pending: boolean;
  active: boolean;
  revoked: boolean;
};

// --- Sub-component: FocusOnNode ---
function FocusOnNode({ nodes, setFocusedNode }: { nodes: Node<NodeData>[], setFocusedNode: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? null : currentValue;
    setValue(newValue ?? "");
    setFocusedNode(newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between sm:w-[200px]" // Responsive width
        >
          <span className="truncate">
            {value ? nodes.find((node) => node.id === value)?.data.label : "Focus on a role..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search role..." />
          <CommandList>
            <CommandEmpty>No role found.</CommandEmpty>
            <CommandGroup>
              {nodes.map((node) => (
                <CommandItem
                  key={node.id}
                  value={node.id}
                  onSelect={handleSelect}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === node.id ? "opacity-100" : "opacity-0"}`} />
                  {node.data.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// --- Sub-component: FilterControls ---
function FilterControls({ filterStatus, setFilterStatus }: { filterStatus: FilterStatus, setFilterStatus: (s: FilterStatus) => void }) {
  const handleFilterChange = (key: keyof FilterStatus, checked: boolean) => {
    setFilterStatus({ ...filterStatus, [key]: checked });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Filter by Status</h4>
          <Separator />
          <div className="flex items-center space-x-2">
            <Checkbox id="active" checked={filterStatus.active} onCheckedChange={(checked) => handleFilterChange('active', !!checked)} />
            <Label htmlFor="active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="pending" checked={filterStatus.pending} onCheckedChange={(checked) => handleFilterChange('pending', !!checked)} />
            <Label htmlFor="pending">Pending</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="revoked" checked={filterStatus.revoked} onCheckedChange={(checked) => handleFilterChange('revoked', !!checked)} />
            <Label htmlFor="revoked">Revoked</Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Sub-component: ViewSwitcher ---
function ViewSwitcher({ viewMode, setViewMode }: { viewMode: ViewMode, setViewMode: (mode: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      <Button variant={viewMode === 'graph' ? 'secondary' : 'ghost'} size="sm" className="gap-1 px-3" onClick={() => setViewMode('graph')}>
        <Network className="h-4 w-4" />
        <span className="hidden sm:inline">Graph View</span>
      </Button>
      <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" className="gap-1 px-3" onClick={() => setViewMode('table')}>
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Table View</span>
      </Button>
    </div>
  );
}


// --- Main ControlHeader Props ---
interface ControlHeaderProps {
  nodes: Node<NodeData>[];
  setFocusedNode: (nodeId: string | null) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

// --- The Main ControlHeader Component ---
export default function ControlHeader({ nodes, setFocusedNode, filterStatus, setFilterStatus, viewMode, setViewMode }: ControlHeaderProps) {
  return (
    // UPDATED: This is the main responsive container.
    // It stacks vertically on small screens and horizontally on medium screens and up.
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left side: Title and View Switcher */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Relationship Management</h1>
          <p className="text-muted-foreground">
            Manage data sharing rules between roles in the network.
          </p>
        </div>
        <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {/* Right side: Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {/* The focus dropdown is only visible when in graph mode */}
        {viewMode === 'graph' && <FocusOnNode nodes={nodes} setFocusedNode={setFocusedNode} />}
        <FilterControls filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
      </div>
    </div>
  );
}
