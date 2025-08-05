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

// Define the Institution type (same as in page.tsx)
type Institution = {
  id: string
  name: string
  role: string
  clientId: string
  status: 'Active' | 'Suspended'
  apiEndpoint: string
}

type InstitutionFormProps = {
  institution: Institution | null
  onClose: () => void
  isOpen: boolean
}

export default function InstitutionForm({ institution, onClose, isOpen }: InstitutionFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    apiEndpoint: "",
    publicKey: "", // Assuming a new field for public key
  })

  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name,
        role: institution.role,
        apiEndpoint: institution.apiEndpoint,
        publicKey: "mock-public-key-for-" + institution.id, // Placeholder for public key
      })
    } else {
      setFormData({
        name: "",
        role: "",
        apiEndpoint: "",
        publicKey: "",
      })
    }
  }, [institution, isOpen]) // Re-initialize when institution or isOpen changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = () => {
    console.log("Form submitted:", formData)
    // In a real app, you'd send this data to an API
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{institution ? "Edit Institution" : "Add New Institution"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Institution Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select onValueChange={handleSelectChange} value={formData.role}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Primary Partner">Primary Partner</SelectItem>
                <SelectItem value="Service Provider">Service Provider</SelectItem>
                <SelectItem value="Affiliate">Affiliate</SelectItem>
                <SelectItem value="Consulting Partner">Consulting Partner</SelectItem>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="Employer">Employer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiEndpoint" className="text-right">
              API Endpoint
            </Label>
            <Input
              id="apiEndpoint"
              value={formData.apiEndpoint}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="publicKey" className="text-right">
              Public Key
            </Label>
            <Textarea
              id="publicKey"
              value={formData.publicKey}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
