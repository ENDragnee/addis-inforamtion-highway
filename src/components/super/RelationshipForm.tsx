"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight } from "lucide-react"

// Define types for props
type Role = {
  id: string
  name: string
}

type DataSchema = {
  id: string
  schemaUrn: string
}

type RelationshipFormProps = {
  onClose: () => void
  isOpen: boolean
  roles: Role[]
  schemas: DataSchema[]
}

export default function RelationshipForm({
  onClose,
  isOpen,
  roles,
  schemas,
}: RelationshipFormProps) {
  const [formData, setFormData] = useState({
    requesterRoleId: "",
    providerRoleId: "",
    dataSchemaId: "",
  })

  useEffect(() => {
    // Reset form data when dialog opens or closes
    if (!isOpen) {
      setFormData({
        requesterRoleId: "",
        providerRoleId: "",
        dataSchemaId: "",
      })
    }
  }, [isOpen])

  const handleSubmit = () => {
    console.log("Proposed Relationship:", formData)
    // In a real app, you'd send this data to an API
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Propose a New Data Sharing Rule</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="requesterRole">Requester Role</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, requesterRoleId: value }))
                }
                value={formData.requesterRoleId}
              >
                <SelectTrigger id="requesterRole">
                  <SelectValue placeholder="Select Requester Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="mt-6 h-5 w-5 text-gray-500" />

            <div className="flex-1">
              <Label htmlFor="dataSchema">Data Schema</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, dataSchemaId: value }))
                }
                value={formData.dataSchemaId}
              >
                <SelectTrigger id="dataSchema">
                  <SelectValue placeholder="Select Data Schema" />
                </SelectTrigger>
                <SelectContent>
                  {schemas.map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      {schema.schemaUrn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="mt-6 h-5 w-5 text-gray-500" />

            <div className="flex-1">
              <Label htmlFor="providerRole">Provider Role</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, providerRoleId: value }))
                }
                value={formData.providerRoleId}
              >
                <SelectTrigger id="providerRole">
                  <SelectValue placeholder="Select Provider Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Propose Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
