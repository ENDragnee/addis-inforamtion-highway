"use client";

import React from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';

// A configuration object to hold the styles for each edge variant.
const styleConfig = {
  active: {
    stroke: 'hsl(var(--chart-1))', // Green
    strokeWidth: 2,
  },
  pending: {
    stroke: 'hsl(var(--chart-2))', // Orange
    strokeWidth: 2,
    strokeDasharray: '5,5',
  },
  revoked: {
    stroke: 'hsl(var(--destructive))', // Red
    strokeWidth: 1.5,
    opacity: 0.7,
  },
  default: {
    stroke: 'hsl(var(--border))',
    strokeWidth: 1.5,
  },
};

// A separate mapping for the label's class name.
const labelClassConfig = {
  active: 'text-foreground',
  pending: 'text-foreground',
  revoked: 'text-muted-foreground opacity-70',
  default: 'text-muted-foreground',
};

// --- THE DEFINITIVE FIX ---
// We will use the base `EdgeProps` and access `type` and `data` carefully.
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label,
  style = {},
  data, // We accept the `data` prop
}: EdgeProps) => { // Use the simplest `EdgeProps` type without generics.
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  // Determine the type for styling. The `type` property is on the top-level edge object.
  // We can get it from the `data` prop if we pass it there, or just use `data.status`.
  // Let's use `data.status` as it's the source of truth.
  const edgeStatus = data?.status || 'default';

  // Select the appropriate styles and class names from our config objects.
  const pathStyles = styleConfig[edgeStatus as keyof typeof styleConfig] || styleConfig.default;
  const labelClassName = labelClassConfig[edgeStatus as keyof typeof labelClassConfig] || labelClassConfig.default;
  
  // Create the final style object for the path.
  const finalPathStyle = { ...style, ...pathStyles };

  return (
    <>
      <path
        d={edgePath}
        className="react-flow__edge-path"
        style={{ stroke: 'transparent', strokeWidth: 20 }}
      />
      
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={finalPathStyle}
      />
      
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className={`nodrag nopan absolute rounded-md border bg-background/80 px-2 py-1 text-xs font-semibold shadow-sm ${labelClassName}`}
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;
