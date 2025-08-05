"use client"

import { useState } from "react"
import { PlusCircle, MoreHorizontal, Edit, Users, Trash, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import InstitutionForm from "@/components/super/InstitutionForm" // Import the new component
import React from "react"
import { Institution, InstitutionStatus } from "@/lib/types"
import { ConfirmationDialog } from "@/components/ConfirmationDialog"
import { ViewInstitutionUsersDialog } from "@/components/super/ViewInstitutionUsersDialog"

// 2. Create Mock Data
const mockInstitutions: Institution[] = [
  {
    id: "inst_001",
    name: "Global Innovations Inc.",
    role: "Primary Partner",
    clientId: "GI-7890",
    status: InstitutionStatus.Active,
    apiEndpoint: "https://api.globalinnovations.com",
  },
  {
    id: "inst_002",
    name: "Tech Solutions Ltd.",
    role: "Service Provider",
    clientId: "TS-1234",
    status: InstitutionStatus.Suspended,
    apiEndpoint: "https://api.techsolutions.net",
  },
  {
    id: "inst_003",
    name: "Future Systems Corp.",
    role: "Affiliate",
    clientId: "FS-5678",
    status: InstitutionStatus.Active,
    apiEndpoint: "https://api.futuresystems.org",
  },
  {
    id: "inst_004",
    name: "Data Dynamics LLC",
    role: "Consulting Partner",
    clientId: "DD-9101",
    status: InstitutionStatus.Active,
    apiEndpoint: "https://api.datadynamics.io",
  },
]

// Reusable StatusBadge Component
const StatusBadge: React.FC<{ status: InstitutionStatus }> = ({ status }) => {
  const variant = status === InstitutionStatus.Active ? 'default' : 'destructive'; // 'default' is usually green/blue, 'destructive' is red
  const className = status === InstitutionStatus.Active ? 'bg-green-500 hover:bg-green-500/80' : 'bg-orange-500 hover:bg-orange-500/80';

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
};

export default function InstitutionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [institutionToActOn, setInstitutionToActOn] = useState<Institution | null>(null)
  const [actionType, setActionType] = useState<"deactivate" | "reactivate" | null>(null)
  const [isViewUsersModalOpen, setIsViewUsersModalOpen] = useState(false)

  const handleAddInstitution = () => {
    setSelectedInstitution(null)
    setIsFormOpen(true)
  }

  const handleEditInstitution = (institution: Institution) => {
    setSelectedInstitution(institution)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedInstitution(null) // Clear selected institution on close
  }

  const handleDeactivateClick = (institution: Institution) => {
    setInstitutionToActOn(institution)
    setActionType("deactivate")
    setShowConfirmation(true)
  }

  const handleReactivateClick = (institution: Institution) => {
    setInstitutionToActOn(institution)
    setActionType("reactivate")
    setShowConfirmation(true)
  }

  const handleConfirmAction = () => {
    if (institutionToActOn && actionType) {
      console.log(`${actionType} institution:`, institutionToActOn.name)
      // Here you would typically call an API to update the institution status
      // For now, we'll just log it.
    }
    setShowConfirmation(false)
    setInstitutionToActOn(null)
    setActionType(null)
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setInstitutionToActOn(null)
    setActionType(null)
  }

  const handleViewUsersClick = (institution: Institution) => {
    setSelectedInstitution(institution)
    setIsViewUsersModalOpen(true)
  }

  const handleCloseViewUsersModal = () => {
    setIsViewUsersModalOpen(false)
    setSelectedInstitution(null)
  }

  return (
    <div className="space-y-6">
      {/* 3. Build the Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Institution Management</h1>
        <Button onClick={handleAddInstitution}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Institution
        </Button>
      </div>

      {/* 4. Implement the Institutions Table */}
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">INSTITUTION</TableHead>
              <TableHead>CLIENT ID</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInstitutions.map((institution) => (
              <TableRow key={institution.id}>
                <TableCell className="font-medium">
                  <div className="font-bold">{institution.name}</div>
                  <div className="text-sm text-gray-500">{institution.role}</div>
                </TableCell>
                <TableCell>{institution.clientId}</TableCell>
                <TableCell>
                  <StatusBadge status={institution.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditInstitution(institution)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewUsersClick(institution)}>
                        <Users className="mr-2 h-4 w-4" /> View Users
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {institution.status === InstitutionStatus.Active ? (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeactivateClick(institution)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleReactivateClick(institution)}
                        >
                          <Undo2 className="mr-2 h-4 w-4" /> Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InstitutionForm
        institution={selectedInstitution}
        onClose={handleCloseForm}
        isOpen={isFormOpen}
      />

      {showConfirmation && institutionToActOn && actionType && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={handleCancelConfirmation}
          onConfirm={handleConfirmAction}
          title={
            actionType === "deactivate"
              ? `Deactivate ${institutionToActOn.name}?`
              : `Reactivate ${institutionToActOn.name}?`
          }
          description={
            actionType === "deactivate"
              ? `Are you sure you want to deactivate ${institutionToActOn.name}? This will suspend all its operations.`
              : `Are you sure you want to reactivate ${institutionToActOn.name}? This will restore its operations.`
          }
          confirmText={actionType === "deactivate" ? "Deactivate" : "Reactivate"}
          cancelText="Cancel"
        />
      )}

      <ViewInstitutionUsersDialog
        isOpen={isViewUsersModalOpen}
        onClose={handleCloseViewUsersModal}
        institution={selectedInstitution}
      />
    </div>
  )
}
