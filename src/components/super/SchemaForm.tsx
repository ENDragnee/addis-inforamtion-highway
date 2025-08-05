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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Define types for props
type Role = {
  id: string
  name: string
}

type DataSchema = {
  id: string
  schemaUrn: string
  description: string
  issuerRole: Role;
  jsonSchema?: string; // Optional JSON schema definition
}

type SchemaFormProps = {
  schema: DataSchema | null
  onClose: () => void
  isOpen: boolean
  roles: Role[]
}

export default function SchemaForm({ schema, onClose, isOpen, roles }: SchemaFormProps) {
  const [formData, setFormData] = useState({
    schemaUrn: "",
    description: "",
    issuerRoleId: "",
    jsonSchema: "",
  })

  useEffect(() => {
    if (schema) {
      setFormData({
        schemaUrn: schema.schemaUrn,
        description: schema.description,
        issuerRoleId: schema.issuerRole.id,
        jsonSchema: schema.jsonSchema || "",
      })
    } else {
      setFormData({
        schemaUrn: "",
        description: "",
        issuerRoleId: "",
        jsonSchema: "",
      })
    }
  }, [schema, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, issuerRoleId: value }))
  }

  const handleSubmit = () => {
    console.log("Schema form submitted:", formData)
    // In a real app, you'd send this data to an API
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{schema ? "Edit Schema" : "Add New Schema"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="schemaUrn">Schema URN</Label>
            <Input
              id="schemaUrn"
              value={formData.schemaUrn}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500">
              This is the unique, versioned ID. Format: domain.source.Entity_v1
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jsonSchema">JSON Schema Definition (Optional)</Label>
            <Textarea
              id="jsonSchema"
              value={formData.jsonSchema}
              onChange={handleChange}
              className="font-mono"
              rows={10}
              placeholder="Paste JSON schema here..."
            />
            <p className="text-sm text-gray-500">
              Define the structure of the Verifiable Credential using JSON Schema.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="issuerRole">Authoritative Issuer Role</Label>
            <Select onValueChange={handleSelectChange} value={formData.issuerRoleId}>
              <SelectTrigger id="issuerRole">
                <SelectValue placeholder="Select Issuer Role" />
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Schema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
