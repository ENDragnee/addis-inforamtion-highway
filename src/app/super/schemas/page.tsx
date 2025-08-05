"use client"

import { useState } from "react"
import { PlusCircle, MoreHorizontal, Edit } from "lucide-react"
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
} from "@/components/ui/dropdown-menu"
import SchemaForm from "@/components/super/SchemaForm"
import React from "react"

// Define the Data Structure (TypeScript)
type Role = {
  id: string
  name: string
}

type DataSchema = {
  id: string
  schemaUrn: string
  description: string
  issuerRole: Role
}

// Create Mock Data
const mockSchemas: DataSchema[] = [
  {
    id: "schema_001",
    schemaUrn: "et.fayda.person.BirthCertificate_v1",
    description: "Official record of a person's birth.",
    issuerRole: { id: "role_government", name: "Government Agency" },
  },
  {
    id: "schema_002",
    schemaUrn: "et.fayda.employer.payroll.SalaryVerification_v1",
    description: "Verification of an individual's salary from an employer.",
    issuerRole: { id: "role_employer", name: "Employer" },
  },
  {
    id: "schema_003",
    schemaUrn: "et.fayda.university.degree.UniversityDegree_v1",
    description: "Record of a degree awarded by a university.",
    issuerRole: { id: "role_university", name: "University" },
  },
  {
    id: "schema_004",
    schemaUrn: "et.fayda.bank.account.BankAccountDetails_v1",
    description: "Details of a bank account.",
    issuerRole: { id: "role_bank", name: "Bank" },
  },
]

// Mock Data for Roles (for the form dropdowns)
const allRoles: Role[] = [
  { id: "role_government", name: "Government Agency" },
  { id: "role_employer", name: "Employer" },
  { id: "role_university", name: "University" },
  { id: "role_bank", name: "Bank" },
  { id: "role_ministry", name: "Ministry of Education" },
]

export default function SchemasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState<DataSchema | null>(null)

  const handleAddSchema = () => {
    setSelectedSchema(null)
    setIsFormOpen(true)
  }

  const handleEditSchema = (schema: DataSchema) => {
    setSelectedSchema(schema)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedSchema(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Data Schema Management</h1>
        <Button onClick={handleAddSchema}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Schema
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">SCHEMA URN</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead>ISSUER ROLE</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSchemas.map((schema) => (
              <TableRow key={schema.id}>
                <TableCell className="font-mono font-medium">{schema.schemaUrn}</TableCell>
                <TableCell>{schema.description}</TableCell>
                <TableCell>{schema.issuerRole.name}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditSchema(schema)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SchemaForm
        schema={selectedSchema}
        onClose={handleCloseForm}
        isOpen={isFormOpen}
        roles={allRoles}
      />
    </div>
  )
}
