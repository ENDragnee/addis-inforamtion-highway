"use client"

import { useState } from "react"
import { Search, Filter, Send, TimerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from "react"
import { ConfirmationDialog } from "@/components/ConfirmationDialog"

// 1. Define the Data Structure (TypeScript)
type DataRequestLog = {
  id: string
  timestamp: Date
  requester: { name: string }
  provider: { name: string }
  schema: { schemaUrn: string }
  status: 'Awaiting Consent' | 'Approved' | 'Denied' | 'Expired' | 'Completed'
  failureReason?: string
  events: { timestamp: Date; description: string }[]
}

// 2. Create Mock Data
const mockAuditLogs: DataRequestLog[] = [
  {
    id: "req_001",
    timestamp: new Date("2025-07-30T10:00:00Z"),
    requester: { name: "Global Innovations Inc." },
    provider: { name: "Tech Solutions Ltd." },
    schema: { schemaUrn: "urn:schema:salaryVerification" },
    status: "Completed",
    events: [
      { timestamp: new Date("2025-07-30T09:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T10:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T10:05:00Z"), description: "Approved" },
      { timestamp: new Date("2025-07-30T10:10:00Z"), description: "Completed" },
    ],
  },
  {
    id: "req_002",
    timestamp: new Date("2025-07-30T11:30:00Z"),
    requester: { name: "Future Systems Corp." },
    provider: { name: "Data Dynamics LLC" },
    schema: { schemaUrn: "urn:schema:examResult" },
    status: "Awaiting Consent",
    events: [
      { timestamp: new Date("2025-07-30T11:29:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T11:30:00Z"), description: "Awaiting Consent" },
    ],
  },
  {
    id: "req_003",
    timestamp: new Date("2025-07-30T12:00:00Z"),
    requester: { name: "Tech Solutions Ltd." },
    provider: { name: "Global Innovations Inc." },
    schema: { schemaUrn: "urn:schema:employmentHistory" },
    status: "Denied",
    failureReason: "Provider rejected consent.",
    events: [
      { timestamp: new Date("2025-07-30T11:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T12:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T12:02:00Z"), description: "Denied" },
    ],
  },
  {
    id: "req_004",
    timestamp: new Date("2025-07-30T13:00:00Z"),
    requester: { name: "Data Dynamics LLC" },
    provider: { name: "Future Systems Corp." },
    schema: { schemaUrn: "urn:schema:identityProof" },
    status: "Expired",
    failureReason: "Consent not provided within time limit.",
    events: [
      { timestamp: new Date("2025-07-30T12:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T13:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T13:15:00Z"), description: "Expired" },
    ],
  },
  {
    id: "req_005",
    timestamp: new Date("2025-07-30T14:00:00Z"),
    requester: { name: "Global Innovations Inc." },
    provider: { name: "Future Systems Corp." },
    schema: { schemaUrn: "urn:schema:universityDegree" },
    status: "Approved",
    events: [
      { timestamp: new Date("2025-07-30T13:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T14:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T14:03:00Z"), description: "Approved" },
    ],
  },
  {
    id: "req_006",
    timestamp: new Date("2025-07-30T15:00:00Z"),
    requester: { name: "Tech Solutions Ltd." },
    provider: { name: "Data Dynamics LLC" },
    schema: { schemaUrn: "urn:schema:bankAccountDetails" },
    status: "Completed",
    events: [
      { timestamp: new Date("2025-07-30T14:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T15:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T15:04:00Z"), description: "Approved" },
      { timestamp: new Date("2025-07-30T15:08:00Z"), description: "Completed" },
    ],
  },
  {
    id: "req_007",
    timestamp: new Date("2025-07-30T16:00:00Z"),
    requester: { name: "Future Systems Corp." },
    provider: { name: "Global Innovations Inc." },
    schema: { schemaUrn: "urn:schema:birthCertificate" },
    status: "Denied",
    failureReason: "Requester not authorized.",
    events: [
      { timestamp: new Date("2025-07-30T15:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T16:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T16:01:00Z"), description: "Denied" },
    ],
  },
  {
    id: "req_008",
    timestamp: new Date("2025-07-30T17:00:00Z"),
    requester: { name: "Data Dynamics LLC" },
    provider: { name: "Tech Solutions Ltd." },
    schema: { schemaUrn: "urn:schema:salaryVerification" },
    status: "Awaiting Consent",
    events: [
      { timestamp: new Date("2025-07-30T16:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T17:00:00Z"), description: "Awaiting Consent" },
    ],
  },
  {
    id: "req_009",
    timestamp: new Date("2025-07-30T18:00:00Z"),
    requester: { name: "Global Innovations Inc." },
    provider: { name: "Data Dynamics LLC" },
    schema: { schemaUrn: "urn:schema:employmentHistory" },
    status: "Completed",
    events: [
      { timestamp: new Date("2025-07-30T17:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T18:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T18:04:00Z"), description: "Approved" },
      { timestamp: new Date("2025-07-30T18:09:00Z"), description: "Completed" },
    ],
  },
  {
    id: "req_010",
    timestamp: new Date("2025-07-30T19:00:00Z"),
    requester: { name: "Future Systems Corp." },
    provider: { name: "Tech Solutions Ltd." },
    schema: { schemaUrn: "urn:schema:identityProof" },
    status: "Expired",
    failureReason: "User did not respond.",
    events: [
      { timestamp: new Date("2025-07-30T18:59:00Z"), description: "Request Initiated" },
      { timestamp: new Date("2025-07-30T19:00:00Z"), description: "Awaiting Consent" },
      { timestamp: new Date("2025-07-30T19:10:00Z"), description: "Expired" },
    ],
  },
]

// Reusable StatusBadge Component
const StatusBadge: React.FC<{ status: DataRequestLog['status'] }> = ({ status }) => {
  let className = "";

  switch (status) {
    case "Approved":
    case "Completed":
      className = "bg-green-500 hover:bg-green-500/80";
      break;
    case "Awaiting Consent":
      className = "bg-blue-500 hover:bg-blue-500/80";
      break;
    case "Denied":
    case "Expired":
      className = "bg-red-500 hover:bg-red-500/80";
      break;
    default:
      break;
  }

  return (
    <Badge className={className}>
      {status}
    </Badge>
  );
};

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterInstitution, setFilterInstitution] = useState("all")
  const [filterDateRange, setFilterDateRange] = useState({
    start: "",
    end: "",
  })
  const [selectedLog, setSelectedLog] = useState<DataRequestLog | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [actionType, setActionType] = useState<"forceExpire" | "resendConsent" | null>(null)

  const handleViewDetails = (log: DataRequestLog) => {
    setSelectedLog(log)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedLog(null)
  }

  const handleActionClick = (type: "forceExpire" | "resendConsent") => {
    setActionType(type)
    setShowConfirmation(true)
  }

  const handleConfirmAction = () => {
    if (selectedLog && actionType) {
      if (actionType === "forceExpire") {
        console.log(`Force expiring request: ${selectedLog.id}`)
        // Implement actual force expire logic here
      } else if (actionType === "resendConsent") {
        console.log(`Resending consent notification for request: ${selectedLog.id}`)
        // Implement actual resend consent logic here
      }
    }
    setShowConfirmation(false)
    setActionType(null)
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setActionType(null)
  }

  // Mock data for filter dropdowns
  const allStatuses = ["Awaiting Consent", "Approved", "Denied", "Expired", "Completed"]
  const allInstitutions = Array.from(new Set([
    ...mockAuditLogs.map(log => log.requester.name),
    ...mockAuditLogs.map(log => log.provider.name),
  ]))

  // Filtering logic (simplified for UI mockup)
  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch = log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.schema.schemaUrn.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || log.status === filterStatus
    const matchesInstitution = filterInstitution === "all" ||
                               log.requester.name === filterInstitution ||
                               log.provider.name === filterInstitution

    // Date range filtering is omitted for brevity in this UI-only mockup

    return matchesSearch && matchesStatus && matchesInstitution
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Data Request Audit Trail</h1>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search by ID, Requester, Provider, Schema..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {allStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="institution-filter">Institution</Label>
              <Select value={filterInstitution} onValueChange={setFilterInstitution}>
                <SelectTrigger id="institution-filter">
                  <SelectValue placeholder="Filter by Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {allInstitutions.map((inst) => (
                    <SelectItem key={inst} value={inst}>
                      {inst}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[200px]">
              <Label htmlFor="date-start">Date Range</Label>
              <div className="flex gap-2">
                <Input
                  id="date-start"
                  type="date"
                  value={filterDateRange.start}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
                />
                <Input
                  id="date-end"
                  type="date"
                  value={filterDateRange.end}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
                />
              </div>
            </div>

            <Button>
              <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">REQUEST ID</TableHead>
              <TableHead className="w-[180px]">TIMESTAMP</TableHead>
              <TableHead>REQUESTER</TableHead>
              <TableHead>PROVIDER</TableHead>
              <TableHead className="w-[250px]">SCHEMA</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.id}</TableCell>
                <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                <TableCell>{log.requester.name}</TableCell>
                <TableCell>{log.provider.name}</TableCell>
                <TableCell className="font-mono text-sm">{log.schema.schemaUrn}</TableCell>
                <TableCell>
                  <StatusBadge status={log.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Request Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Transaction Details: {selectedLog?.id}</DialogTitle>
            <DialogDescription>
              Comprehensive details of the data request transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium">Timestamp:</p>
                  <p>{selectedLog.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  <StatusBadge status={selectedLog.status} />
                </div>
                <div>
                  <p className="text-sm font-medium">Requester:</p>
                  <p>{selectedLog.requester.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Provider:</p>
                  <p>{selectedLog.provider.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Schema URN:</p>
                  <p className="font-mono text-sm">{selectedLog.schema.schemaUrn}</p>
                </div>
              </div>

              {selectedLog.failureReason && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{selectedLog.failureReason}</span>
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Event Timeline</h3>
                <div className="relative pl-4 border-l-2 border-gray-200">
                  {selectedLog.events.map((event, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="absolute -left-2 mt-1 h-4 w-4 rounded-full bg-gray-400"></div>
                      <p className="text-sm text-gray-500">{event.timestamp.toLocaleString()}</p>
                      <p className="font-medium">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedLog.status === "Awaiting Consent" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Admin Actions</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleActionClick("forceExpire")}
                    >
                      <TimerOff className="mr-2 h-4 w-4" /> Force Expire Request
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleActionClick("resendConsent")}
                    >
                      <Send className="mr-2 h-4 w-4" /> Resend Consent Notification
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetailsModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showConfirmation && selectedLog && actionType && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={handleCancelConfirmation}
          onConfirm={handleConfirmAction}
          title={
            actionType === "forceExpire"
              ? `Force Expire Request ${selectedLog.id}?`
              : `Resend Consent for Request ${selectedLog.id}?`
          }
          description={
            actionType === "forceExpire"
              ? `Are you sure you want to force expire this request? This action cannot be undone.`
              : `Are you sure you want to resend the consent notification for this request?`
          }
          confirmText={actionType === "forceExpire" ? "Force Expire" : "Resend"}
          cancelText="Cancel"
        />
      )}
    </div>
  )
}
