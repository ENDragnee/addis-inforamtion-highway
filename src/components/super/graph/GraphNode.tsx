import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';

type GraphNodeProps = {
    data: {
        label: string; // The Role name, e.g., "Bank"
        role: string;  // The count of institutions, e.g., "5 institution(s)"
    };
};

const GraphNode = ({ data }: GraphNodeProps) => {
  return (
    // The main card is styled to stand out
    <Card className="w-48 border-2 border-primary shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
        {/* An icon adds visual interest */}
        <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
        </div>
        <div className="grid gap-0.5">
          <CardTitle className="text-base">{data.label}</CardTitle>
          <CardDescription>{data.role}</CardDescription>
        </div>
      </CardHeader>
      
      {/* The handles are styled to match the theme */}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-primary" />
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-primary" />
    </Card>
  );
};

export default GraphNode;
