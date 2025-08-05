import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Institution } from "@/lib/types"

interface ViewInstitutionUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
}

// Mock data for SuperUser accounts
const mockSuperUsers = [
  {
    id: "user_001",
    name: "Alice Smith",
    email: "alice.smith@example.com",
    role: "SuperUser Admin",
  },
  {
    id: "user_002",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "SuperUser Viewer",
  },
  {
    id: "user_003",
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    role: "SuperUser Admin",
  },
]

export const ViewInstitutionUsersDialog: React.FC<ViewInstitutionUsersDialogProps> = ({
  isOpen,
  onClose,
  institution,
}) => {
  if (!institution) {
    return null // Or handle the case where institution is null, e.g., by not rendering
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Users for {institution.name}</DialogTitle>
          <DialogDescription>
            Listing SuperUser accounts designated as admins for this institution.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>EMAIL</TableHead>
                <TableHead>ROLE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSuperUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
