import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppEdge } from '@/lib/types';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

type InspectorPanelProps = {
    edge: AppEdge | null;
    onApprove: () => void;
    onReject: () => void;
    onRevoke: () => void;
};

const InspectorPanel = ({ edge, onApprove, onReject, onRevoke }: InspectorPanelProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "revoke" | null>(null);

  if (!edge) return null;

  const handleActionClick = (type: "approve" | "reject" | "revoke") => {
    setActionType(type);
    setShowConfirmation(true);
  };

  const handleConfirmAction = () => {
    if (actionType === "approve") {
      onApprove();
    } else if (actionType === "reject") {
      onReject();
    } else if (actionType === "revoke") {
      onRevoke();
    }
    setShowConfirmation(false);
    setActionType(null);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setActionType(null);
  };

  const getConfirmationTitle = () => {
    switch (actionType) {
      case "approve":
        return `Approve Rule: ${edge.label}?`;
      case "reject":
        return `Reject Rule: ${edge.label}?`;
      case "revoke":
        return `Revoke Rule: ${edge.label}?`;
      default:
        return "Confirm Action";
    }
  };

  const getConfirmationDescription = () => {
    const ruleText = `data sharing rule between ${edge.source} and ${edge.target} for ${edge.label}`;
    switch (actionType) {
      case "approve":
        return `Are you sure you want to approve this ${ruleText}?`;
      case "reject":
        return `Are you sure you want to reject this ${ruleText}? This will permanently remove the proposed rule.`;
      case "revoke":
        return `Are you sure you want to revoke this ${ruleText}? This will suspend the active rule.`;
      default:
        return "Please confirm your action.";
    }
  };

  return (
    <div className="w-80 p-4 border-l">
      <h2 className="text-lg font-semibold mb-4">Relationship Details</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Requester</h3>
          <p>{edge.source}</p>
        </div>
        <div>
          <h3 className="font-semibold">Provider</h3>
          <p>{edge.target}</p>
        </div>
        <div>
          <h3 className="font-semibold">Data</h3>
          <p>{edge.label as React.ReactNode}</p>
        </div>
        <div>
          <h3 className="font-semibold">Status</h3>
          <p>{edge.data?.status || 'Active'}</p>
        </div>
        {edge.data?.proposedBy && (
          <div>
            <h3 className="font-semibold">Proposed By</h3>
            <p>{edge.data.proposedBy}</p>
          </div>
        )}
        {edge.data?.status === 'pending' && (
          <div className="flex space-x-2 pt-4">
            <Button onClick={() => handleActionClick("approve")}>✅ Approve Rule</Button>
            <Button variant="destructive" onClick={() => handleActionClick("reject")}>❌ Reject Rule</Button>
          </div>
        )}
        {edge.data?.status === 'active' && (
          <div className="flex space-x-2 pt-4">
            <Button variant="destructive" onClick={() => handleActionClick("revoke")}>🚫 Revoke Rule</Button>
          </div>
        )}
      </div>

      {showConfirmation && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={handleCancelConfirmation}
          onConfirm={handleConfirmAction}
          title={getConfirmationTitle()}
          description={getConfirmationDescription()}
          confirmText={actionType ? actionType.charAt(0).toUpperCase() + actionType.slice(1) : "Confirm"}
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default InspectorPanel;