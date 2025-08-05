
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type InstitutionNodeProps = {
    data: {
        label: string;
        role: string;
    };
};

const InstitutionNode = ({ data }: InstitutionNodeProps) => {
  return (
    <Card className="w-48">
      <CardHeader>
        <CardTitle>{data.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">{data.role || 'Bank'}</p>
      </CardContent>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </Card>
  );
};

export default InstitutionNode;
